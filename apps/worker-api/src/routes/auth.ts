import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { Env, Variables } from '../types'
import { signJWT, verifyJWT, generateOTP, generateId, generateTrackingCode } from '../lib/jwt'
import { hashPassword, verifyPassword } from '../lib/password'
import { sendSMS } from '../lib/notifications'

const auth = new Hono<{ Bindings: Env; Variables: Variables }>()

const ACCESS_TOKEN_TTL = 900        // 15 minutes
const REFRESH_TOKEN_TTL = 604800    // 7 days
const OTP_TTL_SECONDS = 600         // 10 minutes
const OTP_MAX_ATTEMPTS = 5

const DEMO_PRODUCTS = [
  { name: 'Tomatoes 2kg', description: 'Fresh farm tomatoes', price: 80, stock: 50, featured: 1 },
  { name: 'Fresh Milk 500ml', description: 'Pasteurised whole milk', price: 60, stock: 40, featured: 1 },
  { name: 'White Bread', description: 'Sliced white bread loaf', price: 55, stock: 30, featured: 0 },
  { name: 'Rice 1kg', description: 'Long grain white rice', price: 120, stock: 25, featured: 0 },
  { name: 'Bananas (bunch)', description: 'Sweet ripe bananas', price: 50, stock: 20, featured: 1 },
  { name: 'Orange Juice 1L', description: 'Fresh-squeezed orange juice', price: 150, stock: 15, featured: 0 },
  { name: 'Cooking Oil 500ml', description: 'Refined vegetable oil', price: 110, stock: 30, featured: 0 },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30)
}

// GET /api/auth/check-store-name?name=... — public, no auth required
auth.get('/check-store-name', async (c) => {
  const name = c.req.query('name')?.trim()
  if (!name) return c.json({ success: false, error: 'name is required', data: null }, 400)
  const slug = slugify(name)
  const existing = await c.env.qesuite_db.prepare(
    'SELECT id FROM tenants WHERE slug = ? OR LOWER(name) = LOWER(?)'
  ).bind(slug, name).first()
  return c.json({ success: true, data: { available: !existing, slug }, error: null })
})

// POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json<{
      name: string
      email?: string
      phone?: string
      password: string
      store_name: string
    }>()

    const { name, email, phone, password, store_name } = body

    if (!name || !password || !store_name) {
      return c.json({ error: 'name, password, and store_name are required', data: null }, 400)
    }
    if (!email && !phone) {
      return c.json({ error: 'email or phone is required', data: null }, 400)
    }
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters', data: null }, 400)
    }

    // Check email/phone uniqueness
    if (email) {
      const existing = await c.env.qesuite_db.prepare(
        "SELECT id FROM users WHERE email = ? AND role = 'owner'"
      ).bind(email).first()
      if (existing) {
        return c.json({ error: 'Email already registered', data: null }, 409)
      }
    }
    if (phone) {
      const existing = await c.env.qesuite_db.prepare(
        "SELECT id FROM users WHERE phone = ? AND role = 'owner'"
      ).bind(phone).first()
      if (existing) {
        return c.json({ error: 'Phone already registered', data: null }, 409)
      }
    }

    // Generate unique slug
    let slug = slugify(store_name)
    let slugAttempt = slug
    let slugIndex = 0
    while (true) {
      const existing = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
        .bind(slugAttempt)
        .first()
      if (!existing) { slug = slugAttempt; break }
      slugIndex++
      slugAttempt = `${slug}-${slugIndex}`
    }

    const tenantId = generateId()
    const userId = generateId()
    const settingsId = generateId()
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const passwordHash = await hashPassword(password)

    // Tenant
    await c.env.qesuite_db.prepare(
      `INSERT INTO tenants (id, name, slug, plan, trial_ends_at, subscription_status, created_at)
       VALUES (?, ?, ?, 'trial', ?, 'trialing', datetime('now'))`
    ).bind(tenantId, store_name, slug, trialEndsAt).run()

    // Owner user
    await c.env.qesuite_db.prepare(
      `INSERT INTO users (id, tenant_id, name, phone, email, password_hash, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'owner', 1, datetime('now'))`
    ).bind(userId, tenantId, name, phone ?? null, email ?? null, passwordHash).run()

    // Store settings
    await c.env.qesuite_db.prepare(
      `INSERT INTO store_settings (id, tenant_id, delivery_enabled, pickup_enabled, currency, language, updated_at)
       VALUES (?, ?, 1, 1, 'KES', 'en', datetime('now'))`
    ).bind(settingsId, tenantId).run()

    // Default category
    const categoryId = generateId()
    await c.env.qesuite_db.prepare(
      `INSERT INTO categories (id, tenant_id, name, icon, sort_order, is_active) VALUES (?, ?, 'General', '🛒', 0, 1)`
    ).bind(categoryId, tenantId).run()

    // Seed demo products
    for (const p of DEMO_PRODUCTS) {
      await c.env.qesuite_db.prepare(
        `INSERT INTO products (id, tenant_id, category_id, name, description, price, stock, featured, on_sale, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, datetime('now'), datetime('now'))`
      ).bind(generateId(), tenantId, categoryId, p.name, p.description, p.price, p.stock, p.featured).run()
    }

    // Issue tokens
    const accessToken = await signJWT(
      { sub: userId, tenant_id: tenantId, role: 'owner', name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )
    const refreshToken = await signJWT(
      { sub: userId, tenant_id: tenantId, role: 'owner', name },
      c.env.JWT_SECRET,
      REFRESH_TOKEN_TTL
    )

    await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?')
      .bind(refreshToken, userId)
      .run()

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: REFRESH_TOKEN_TTL,
      path: '/',
    })

    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        user: { id: userId, name, role: 'owner', tenant_id: tenantId },
        store: { slug, name: store_name },
      },
      error: null,
      message: `Your store is live at ${c.env.APP_BASE_URL}/${slug}`,
    }, 201)
  } catch (err) {
    console.error('register error', err)
    return c.json({ error: 'Registration failed', data: null }, 500)
  }
})

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<{
      identifier: string   // email or phone
      password: string
    }>()

    const { identifier, password } = body
    if (!identifier || !password) {
      return c.json({ error: 'identifier and password are required', data: null }, 400)
    }

    const isEmail = identifier.includes('@')

    // For phone logins, find ALL active owner accounts sharing that phone
    // so we can detect multi-store owners before verifying the password once
    if (!isEmail) {
      const { results: ownerRows } = await c.env.qesuite_db.prepare(
        `SELECT id, tenant_id, name, password_hash FROM users
         WHERE phone = ? AND role = 'owner' AND is_active = 1`
      ).bind(identifier).all<{
        id: string; tenant_id: string | null; name: string; password_hash: string
      }>()

      if (ownerRows.length > 1) {
        // Verify password against the first row (all rows for same phone share credentials)
        const valid = await verifyPassword(password, ownerRows[0].password_hash)
        if (!valid) {
          return c.json({ error: 'Invalid credentials', data: null }, 401)
        }

        // Collect all stores this phone number owns
        const tenantIds = ownerRows.map(r => r.tenant_id).filter(Boolean) as string[]
        const placeholders = tenantIds.map(() => '?').join(', ')
        const { results: tenants } = await c.env.qesuite_db.prepare(
          `SELECT id, name, slug, logo_url, primary_color FROM tenants WHERE id IN (${placeholders})`
        ).bind(...tenantIds).all<{
          id: string; name: string; slug: string
          logo_url: string | null; primary_color: string
        }>()

        // Issue a short-lived selection token — proves auth without granting dashboard access
        const selectionToken = await signJWT(
          { sub: ownerRows[0].id, tenant_id: null, role: 'owner', name: ownerRows[0].name },
          c.env.JWT_SECRET,
          300  // 5 minutes — enough to pick a store
        )

        return c.json({
          success: true,
          data: {
            requires_store_selection: true,
            selection_token: selectionToken,
            stores: tenants.map(t => {
              const userRow = ownerRows.find(r => r.tenant_id === t.id)
              return {
                tenant_id: t.id,
                user_id: userRow!.id,
                name: t.name,
                slug: t.slug,
                logo_url: t.logo_url,
                primary_color: t.primary_color,
              }
            }),
          },
          error: null,
        })
      }
    }

    // Single-store path (email login or single phone match)
    const user = await c.env.qesuite_db.prepare(
      isEmail
        ? 'SELECT * FROM users WHERE email = ? AND is_active = 1'
        : "SELECT * FROM users WHERE phone = ? AND role = 'owner' AND is_active = 1"
    ).bind(identifier).first<{
      id: string; tenant_id: string | null; name: string; role: string
      password_hash: string; email: string; phone: string
    }>()

    if (!user || !user.password_hash) {
      return c.json({ error: 'Invalid credentials', data: null }, 401)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'Invalid credentials', data: null }, 401)
    }

    const role = user.role as 'owner' | 'staff' | 'rider' | 'superadmin'
    const accessToken = await signJWT(
      { sub: user.id, tenant_id: user.tenant_id, role, name: user.name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )
    const refreshToken = await signJWT(
      { sub: user.id, tenant_id: user.tenant_id, role, name: user.name },
      c.env.JWT_SECRET,
      REFRESH_TOKEN_TTL
    )

    await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?')
      .bind(refreshToken, user.id)
      .run()

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: REFRESH_TOKEN_TTL,
      path: '/',
    })

    let slug: string | null = null
    if (user.tenant_id) {
      const tenant = await c.env.qesuite_db.prepare('SELECT slug FROM tenants WHERE id = ?')
        .bind(user.tenant_id)
        .first<{ slug: string }>()
      slug = tenant?.slug ?? null
    }

    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        user: { id: user.id, name: user.name, role, tenant_id: user.tenant_id },
        store: slug ? { slug } : null,
      },
      error: null,
    })
  } catch (err) {
    console.error('login error', err)
    return c.json({ error: 'Login failed', data: null }, 500)
  }
})

// POST /api/auth/select-store — second step when owner has multiple stores
auth.post('/select-store', async (c) => {
  try {
    const { selection_token, tenant_id } = await c.req.json<{
      selection_token: string
      tenant_id: string
    }>()

    if (!selection_token || !tenant_id) {
      return c.json({ error: 'selection_token and tenant_id are required', data: null }, 400)
    }

    // Verify the selection token
    let payload: { sub: string; role: string; name: string }
    try {
      payload = await verifyJWT(selection_token, c.env.JWT_SECRET) as typeof payload
    } catch {
      return c.json({ error: 'Selection token expired. Please log in again.', data: null }, 401)
    }

    if (payload.role !== 'owner') {
      return c.json({ error: 'Forbidden', data: null }, 403)
    }

    // Confirm the requested tenant actually belongs to this user's phone
    const user = await c.env.qesuite_db.prepare(
      `SELECT u.id, u.name, u.phone, u.role
       FROM users u
       JOIN users src ON src.id = ? AND src.phone = u.phone
       WHERE u.tenant_id = ? AND u.role = 'owner' AND u.is_active = 1`
    ).bind(payload.sub, tenant_id).first<{
      id: string; name: string; phone: string; role: string
    }>()

    if (!user) {
      return c.json({ error: 'Store not found or access denied', data: null }, 403)
    }

    const accessToken = await signJWT(
      { sub: user.id, tenant_id, role: 'owner', name: user.name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )
    const refreshToken = await signJWT(
      { sub: user.id, tenant_id, role: 'owner', name: user.name },
      c.env.JWT_SECRET,
      REFRESH_TOKEN_TTL
    )

    await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?')
      .bind(refreshToken, user.id).run()

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true, secure: true, sameSite: 'Lax', maxAge: REFRESH_TOKEN_TTL, path: '/',
    })

    const tenant = await c.env.qesuite_db.prepare('SELECT slug FROM tenants WHERE id = ?')
      .bind(tenant_id).first<{ slug: string }>()

    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        user: { id: user.id, name: user.name, role: 'owner', tenant_id },
        store: tenant ? { slug: tenant.slug } : null,
      },
      error: null,
    })
  } catch (err) {
    console.error('select-store error', err)
    return c.json({ error: 'Store selection failed', data: null }, 500)
  }
})

// POST /api/auth/otp/send
auth.post('/otp/send', async (c) => {
  try {
    const { phone } = await c.req.json<{ phone: string }>()
    if (!phone) {
      return c.json({ error: 'phone is required', data: null }, 400)
    }

    // Rate limit: max 5 OTPs per phone per 10 minutes
    const windowStart = new Date(Date.now() - OTP_TTL_SECONDS * 1000).toISOString()
    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM users WHERE phone = ? AND otp_expires_at > ?`
    ).bind(phone, windowStart).first<{ cnt: number }>()

    if (countResult && countResult.cnt >= OTP_MAX_ATTEMPTS) {
      return c.json({ error: 'Too many OTP requests. Try again in 10 minutes.', data: null }, 429)
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString()

    // Upsert user record (may or may not exist yet)
    const existing = await c.env.qesuite_db.prepare('SELECT id FROM users WHERE phone = ?')
      .bind(phone)
      .first<{ id: string }>()

    if (existing) {
      await c.env.qesuite_db.prepare(
        'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?'
      ).bind(otp, expiresAt, existing.id).run()
    } else {
      // Temporary placeholder — full account created on verify
      await c.env.qesuite_db.prepare(
        `INSERT INTO users (id, tenant_id, name, phone, role, otp_code, otp_expires_at, is_active, created_at)
         VALUES (?, NULL, '', ?, 'owner', ?, ?, 0, datetime('now'))`
      ).bind(generateId(), phone, otp, expiresAt).run()
    }

    await sendSMS(c.env, phone, `Your QeSuite OTP is: ${otp}. Expires in 10 minutes.`)

    return c.json({ data: { sent: true }, error: null, message: 'OTP sent' })
  } catch (err) {
    console.error('otp/send error', err)
    return c.json({ error: 'Failed to send OTP', data: null }, 500)
  }
})

// POST /api/auth/otp/verify
auth.post('/otp/verify', async (c) => {
  try {
    const { phone, otp } = await c.req.json<{ phone: string; otp: string }>()
    if (!phone || !otp) {
      return c.json({ error: 'phone and otp are required', data: null }, 400)
    }

    const now = new Date().toISOString()
    const user = await c.env.qesuite_db.prepare(
      `SELECT * FROM users WHERE phone = ? AND otp_code = ? AND otp_expires_at > ? AND is_active = 1`
    ).bind(phone, otp, now).first<{
      id: string; tenant_id: string | null; name: string; role: string
    }>()

    if (!user) {
      return c.json({ error: 'Invalid or expired OTP', data: null }, 401)
    }

    // Clear OTP
    await c.env.qesuite_db.prepare('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?')
      .bind(user.id)
      .run()

    const role = user.role as 'owner' | 'staff' | 'rider' | 'superadmin'
    const accessToken = await signJWT(
      { sub: user.id, tenant_id: user.tenant_id, role, name: user.name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )
    const refreshToken = await signJWT(
      { sub: user.id, tenant_id: user.tenant_id, role, name: user.name },
      c.env.JWT_SECRET,
      REFRESH_TOKEN_TTL
    )

    await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?')
      .bind(refreshToken, user.id)
      .run()

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: REFRESH_TOKEN_TTL,
      path: '/',
    })

    return c.json({
      data: {
        access_token: accessToken,
        user: { id: user.id, name: user.name, role, tenant_id: user.tenant_id },
      },
      error: null,
    })
  } catch (err) {
    console.error('otp/verify error', err)
    return c.json({ error: 'OTP verification failed', data: null }, 500)
  }
})

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  try {
    const token = getCookie(c, 'refresh_token')
    if (!token) {
      return c.json({ error: 'No refresh token', data: null }, 401)
    }

    let payload
    try {
      payload = await verifyJWT(token, c.env.JWT_SECRET)
    } catch {
      deleteCookie(c, 'refresh_token')
      return c.json({ error: 'Invalid refresh token', data: null }, 401)
    }

    // Verify token still matches stored value
    const user = await c.env.qesuite_db.prepare(
      'SELECT id, name, role, tenant_id, refresh_token FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.sub).first<{
      id: string; name: string; role: string; tenant_id: string | null; refresh_token: string
    }>()

    if (!user || user.refresh_token !== token) {
      deleteCookie(c, 'refresh_token')
      return c.json({ error: 'Refresh token revoked', data: null }, 401)
    }

    const role = user.role as 'owner' | 'staff' | 'rider' | 'superadmin'
    const accessToken = await signJWT(
      { sub: user.id, tenant_id: user.tenant_id, role, name: user.name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )

    return c.json({
      success: true,
      data: { access_token: accessToken },
      error: null,
    })
  } catch (err) {
    console.error('refresh error', err)
    return c.json({ error: 'Token refresh failed', data: null }, 500)
  }
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  try {
    const token = getCookie(c, 'refresh_token')
    if (token) {
      try {
        const payload = await verifyJWT(token, c.env.JWT_SECRET)
        await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = NULL WHERE id = ?')
          .bind(payload.sub)
          .run()
      } catch {
        // Token may already be invalid — still clear the cookie
      }
    }
    deleteCookie(c, 'refresh_token')
    return c.json({ data: { logged_out: true }, error: null })
  } catch (err) {
    console.error('logout error', err)
    return c.json({ error: 'Logout failed', data: null }, 500)
  }
})

// POST /api/auth/rider/magic-link
auth.post('/rider/magic-link', async (c) => {
  try {
    const { phone, tenant_id } = await c.req.json<{ phone: string; tenant_id: string }>()
    if (!phone || !tenant_id) {
      return c.json({ error: 'phone and tenant_id are required', data: null }, 400)
    }

    const token = generateTrackingCode() + generateTrackingCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min

    // Update or insert delivery_staff magic link
    const staff = await c.env.qesuite_db.prepare(
      'SELECT id FROM delivery_staff WHERE phone = ? AND tenant_id = ?'
    ).bind(phone, tenant_id).first<{ id: string }>()

    if (!staff) {
      return c.json({ error: 'Rider not found for this store', data: null }, 404)
    }

    await c.env.qesuite_db.prepare(
      'UPDATE delivery_staff SET magic_link_token = ?, magic_link_expires_at = ? WHERE id = ?'
    ).bind(token, expiresAt, staff.id).run()

    const link = `${c.env.APP_BASE_URL.replace('store.', 'go.')}/verify?token=${token}`
    await sendSMS(c.env, phone, `Sign in to your QeSuite delivery dashboard: ${link}\nThis link expires in 30 minutes.`)

    return c.json({ data: { sent: true }, error: null, message: 'Magic link sent' })
  } catch (err) {
    console.error('rider/magic-link error', err)
    return c.json({ error: 'Failed to send magic link', data: null }, 500)
  }
})

// GET /api/auth/rider/verify?token=...
auth.get('/rider/verify', async (c) => {
  try {
    const token = c.req.query('token')
    if (!token) {
      return c.json({ error: 'token is required', data: null }, 400)
    }

    const now = new Date().toISOString()
    const staff = await c.env.qesuite_db.prepare(
      `SELECT ds.*, u.id as user_id, u.name as user_name
       FROM delivery_staff ds
       LEFT JOIN users u ON u.id = ds.user_id
       WHERE ds.magic_link_token = ? AND ds.magic_link_expires_at > ? AND ds.is_active = 1`
    ).bind(token, now).first<{
      id: string; tenant_id: string; name: string; phone: string
      user_id: string | null; user_name: string | null
    }>()

    if (!staff) {
      return c.json({ error: 'Invalid or expired magic link', data: null }, 401)
    }

    // Clear magic link token
    await c.env.qesuite_db.prepare(
      'UPDATE delivery_staff SET magic_link_token = NULL, magic_link_expires_at = NULL WHERE id = ?'
    ).bind(staff.id).run()

    // Ensure user record exists
    let userId = staff.user_id
    if (!userId) {
      userId = generateId()
      await c.env.qesuite_db.prepare(
        `INSERT INTO users (id, tenant_id, name, phone, role, is_active, created_at)
         VALUES (?, ?, ?, ?, 'rider', 1, datetime('now'))`
      ).bind(userId, staff.tenant_id, staff.name, staff.phone).run()
      await c.env.qesuite_db.prepare('UPDATE delivery_staff SET user_id = ? WHERE id = ?')
        .bind(userId, staff.id)
        .run()
    }

    const accessToken = await signJWT(
      { sub: userId, tenant_id: staff.tenant_id, role: 'rider', name: staff.name },
      c.env.JWT_SECRET,
      ACCESS_TOKEN_TTL
    )
    const refreshToken = await signJWT(
      { sub: userId, tenant_id: staff.tenant_id, role: 'rider', name: staff.name },
      c.env.JWT_SECRET,
      REFRESH_TOKEN_TTL
    )

    await c.env.qesuite_db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?')
      .bind(refreshToken, userId)
      .run()

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: REFRESH_TOKEN_TTL,
      path: '/',
    })

    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        user: { id: userId, name: staff.name, role: 'rider', tenant_id: staff.tenant_id },
      },
      error: null,
    })
  } catch (err) {
    console.error('rider/verify error', err)
    return c.json({ error: 'Verification failed', data: null }, 500)
  }
})

// POST /api/auth/rider/request — rider requests a new magic link by phone
auth.post('/rider/request', async (c) => {
  try {
    const { phone } = await c.req.json<{ phone: string }>()
    if (!phone) return c.json({ error: 'phone is required', data: null }, 400)

    const { sendSMS } = await import('../lib/notifications')
    const staff = await c.env.qesuite_db.prepare(
      'SELECT id, name, phone, tenant_id FROM delivery_staff WHERE phone = ? AND is_active = 1 LIMIT 1'
    ).bind(phone).first<{ id: string; name: string; phone: string; tenant_id: string }>()

    if (!staff) {
      return c.json({ data: { sent: false }, error: null, message: 'If your number is registered, you will receive a link.' })
    }

    const token = generateTrackingCode() + generateTrackingCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await c.env.qesuite_db.prepare(
      'UPDATE delivery_staff SET magic_link_token = ?, magic_link_expires_at = ? WHERE id = ?'
    ).bind(token, expiresAt, staff.id).run()

    const link = `${c.env.APP_BASE_URL.replace('store.', 'go.')}/auth/verify?token=${token}`
    await sendSMS(c.env, staff.phone, `Welcome to QeSuite! Access your delivery dashboard here: ${link}\nThis link expires in 30 minutes.`)

    return c.json({ data: { sent: true }, error: null, message: 'Magic link sent' })
  } catch (err) {
    console.error('rider/request error', err)
    return c.json({ error: 'Failed to send magic link', data: null }, 500)
  }
})

// GET /api/auth/me — get current authenticated user
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }
  try {
    const { verifyJWT } = await import('../lib/jwt')
    const payload = await verifyJWT(authHeader.substring(7), c.env.JWT_SECRET)
    const user = await c.env.qesuite_db.prepare(
      'SELECT id, name, email, phone, role, tenant_id, is_active, created_at FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.sub).first()
    if (!user) return c.json({ error: 'User not found', data: null }, 404)

    let tenantSlug: string | null = null
    if (payload.tenant_id) {
      const t = await c.env.qesuite_db.prepare('SELECT slug FROM tenants WHERE id = ?')
        .bind(payload.tenant_id).first<{ slug: string }>()
      tenantSlug = t?.slug ?? null
    }

    return c.json({ success: true, data: { ...user, tenant_slug: tenantSlug }, error: null })
  } catch {
    return c.json({ error: 'Invalid token', data: null }, 401)
  }
})

// PATCH /api/auth/me — update current user's profile
auth.patch('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }
  try {
    const { verifyJWT } = await import('../lib/jwt')
    const payload = await verifyJWT(authHeader.substring(7), c.env.JWT_SECRET)

    const user = await c.env.qesuite_db.prepare(
      'SELECT id, name, email, phone, password_hash FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.sub).first<{
      id: string; name: string; email: string | null; phone: string | null; password_hash: string
    }>()
    if (!user) return c.json({ error: 'User not found', data: null }, 404)

    const body = await c.req.json<{
      name?: string
      email?: string
      phone?: string
      current_password?: string
      new_password?: string
    }>()

    // If changing password, verify current password first
    if (body.new_password) {
      if (!body.current_password) {
        return c.json({ error: 'current_password is required to set a new password', data: null }, 400)
      }
      if (body.new_password.length < 8) {
        return c.json({ error: 'new_password must be at least 8 characters', data: null }, 400)
      }
      const { verifyPassword } = await import('../lib/password')
      const valid = await verifyPassword(body.current_password, user.password_hash)
      if (!valid) {
        return c.json({ error: 'Current password is incorrect', data: null }, 400)
      }
    }

    // Build update
    const updates: string[] = []
    const bindings: unknown[] = []

    if (body.name && body.name !== user.name) {
      updates.push('name = ?')
      bindings.push(body.name)
    }
    if (body.email !== undefined && body.email !== user.email) {
      updates.push('email = ?')
      bindings.push(body.email || null)
    }
    if (body.phone !== undefined && body.phone !== user.phone) {
      updates.push('phone = ?')
      bindings.push(body.phone || null)
    }
    if (body.new_password) {
      const { hashPassword } = await import('../lib/password')
      updates.push('password_hash = ?')
      bindings.push(await hashPassword(body.new_password))
    }

    if (updates.length === 0) {
      return c.json({ success: true, data: null, message: 'Nothing to update', error: null })
    }

    bindings.push(user.id)
    await c.env.qesuite_db.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run()

    return c.json({ success: true, data: null, message: 'Profile updated', error: null })
  } catch (err) {
    console.error('PATCH /me error', err)
    return c.json({ error: 'Failed to update profile', data: null }, 500)
  }
})


// POST /api/auth/seed-admin — one-time superadmin creation (only when no superadmin exists)
auth.post('/seed-admin', async (c) => {
  try {
    const existing = await c.env.qesuite_db.prepare(
      "SELECT id FROM users WHERE role = 'superadmin' LIMIT 1"
    ).first()
    if (existing) {
      return c.json({ error: 'Admin already exists', data: null }, 409)
    }

    const body = await c.req.json<{ email: string; password: string; name?: string }>()
    if (!body.email || !body.password) {
      return c.json({ error: 'email and password are required', data: null }, 400)
    }
    if (body.password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters', data: null }, 400)
    }

    const { hashPassword } = await import('../lib/password')
    const { generateId } = await import('../lib/jwt')
    const id = generateId()
    const hash = await hashPassword(body.password)

    await c.env.qesuite_db.prepare(
      `INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active, created_at)
       VALUES (?, NULL, ?, ?, ?, 'superadmin', 1, datetime('now'))`
    ).bind(id, body.name || 'Super Admin', body.email, hash).run()

    return c.json({ success: true, data: { id, email: body.email, role: 'superadmin' }, error: null }, 201)
  } catch (err) {
    console.error('seed-admin error', err)
    return c.json({ error: 'Failed to create admin', data: null }, 500)
  }
})

export default auth
