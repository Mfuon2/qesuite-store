import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'

const upload = new Hono<{ Bindings: Env; Variables: Variables }>()

const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// POST /api/upload/image — generate presigned R2 URL
upload.post('/image', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    type UploadBody = {
      content_type?: string
      purpose?: 'product' | 'logo' | 'banner'
      filename?: string
    }
    const body: UploadBody = await c.req.json<UploadBody>().catch(() => ({}))

    const contentType = body.content_type ?? 'image/jpeg'
    const purpose = body.purpose ?? 'product'

    if (!ALLOWED_TYPES.includes(contentType)) {
      return c.json({
        error: `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        data: null,
      }, 400)
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
    const fileId = generateId()
    const key = `${purpose}/${tenantId}/${fileId}.${ext}`

    // Cloudflare R2 presigned PUT URL — valid for 10 minutes
    // Using R2's createPresignedUrl if available (bound R2 bucket)
    // For Workers with R2 binding, we implement a proxy upload endpoint
    // The client PUTs the image binary to /api/upload/r2/:key and this worker proxies to R2

    const publicUrl = `https://images.qesuite.com/${key}`
    const uploadToken = btoa(JSON.stringify({ key, tenant_id: tenantId, exp: Date.now() + 600_000 }))

    return c.json({
      data: {
        upload_url: `${c.env.APP_BASE_URL}/api/upload/r2?token=${encodeURIComponent(uploadToken)}`,
        public_url: publicUrl,
        key,
        content_type: contentType,
        expires_in: 600,
      },
      error: null,
    })
  } catch (err) {
    console.error('upload image error', err)
    return c.json({ error: 'Failed to generate upload URL', data: null }, 500)
  }
})

// PUT /api/upload/r2 — proxy binary upload to R2 (used by presigned URL flow)
upload.put('/r2', async (c) => {
  try {
    const tokenParam = c.req.query('token')
    if (!tokenParam) {
      return c.json({ error: 'Missing upload token', data: null }, 400)
    }

    let key: string
    let tenantId: string
    let exp: number

    try {
      const decoded = JSON.parse(atob(decodeURIComponent(tokenParam))) as {
        key: string; tenant_id: string; exp: number
      }
      key = decoded.key
      tenantId = decoded.tenant_id
      exp = decoded.exp
    } catch {
      return c.json({ error: 'Invalid upload token', data: null }, 400)
    }

    if (Date.now() > exp) {
      return c.json({ error: 'Upload token expired', data: null }, 401)
    }

    const contentType = c.req.header('Content-Type') ?? 'image/jpeg'
    if (!ALLOWED_TYPES.includes(contentType)) {
      return c.json({ error: 'Unsupported content type', data: null }, 400)
    }

    const arrayBuffer = await c.req.arrayBuffer()

    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return c.json({ error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024}MB`, data: null }, 413)
    }

    await c.env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType },
      customMetadata: { tenant_id: tenantId },
    })

    const publicUrl = `https://images.qesuite.com/${key}`

    return c.json({ data: { url: publicUrl, key }, error: null, message: 'Upload successful' })
  } catch (err) {
    console.error('r2 upload error', err)
    return c.json({ error: 'Upload failed', data: null }, 500)
  }
})

export default upload
