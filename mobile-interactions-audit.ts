import { chromium } from '/private/var/folders/6p/2t9w9dk97_z139hx81knj47m0000gn/T/bunx-501-playwright@latest/node_modules/playwright/index.mjs'

const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'owner-1', tenant_id: 'tenant-1', role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`
const ok = (data: unknown) => ({ success: true, data, error: null })
const summary = { total_revenue: 124000, total_orders: 48, avg_order_value: 2583, completion_rate: 91.7, cancelled_orders: 4, unique_customers: 31 }
const financial = {
  revenue: 124000, expenses: 38000, variance: 86000, expense_ratio: 30.6, margin: 69.4,
  expense_count: 12, online_orders: 30, pos_sales: 18, date_from: '2026-08-01', date_to: '2026-08-26',
  previous: { revenue: 100000, expenses: 35000, variance: 65000, expense_ratio: 35, margin: 65, expense_count: 10, online_orders: 26, pos_sales: 14 },
  daily: [{ date: '2026-08-25', revenue: 28000, expenses: 12000, variance: 16000 }, { date: '2026-08-26', revenue: 42000, expenses: 10000, variance: 32000 }],
  by_category: [],
}

let expensePosts = 0
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(10_000)
await page.addInitScript(() => sessionStorage.setItem('onboarding_complete', 'true'))
await page.route('**/api/**', async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname
  if (!path.startsWith('/api/')) return route.continue()
  let data: unknown = null
  if (path === '/api/auth/refresh') data = ok({ access_token: token })
  else if (path === '/api/auth/me') data = ok({ id: 'owner-1', tenant_id: 'tenant-1', name: 'John Doe', email: 'john@example.com', role: 'owner' })
  else if (path === '/api/access/me') data = ok({ role: 'owner', is_owner: true, permissions: [] })
  else if (path === '/api/settings/tenant') data = ok({ id: 'tenant-1', name: 'Testing', slug: 'testing', plan: 'pro', subscription_status: 'active', primary_color: '#10b981', accent_color: '#f59e0b', font_family: 'inter', store_category: 'food' })
  else if (path === '/api/settings/store') data = ok({ delivery_enabled: true, pickup_enabled: true, language: 'en', dark_mode_enabled: false, order_view: 'kanban' })
  else if (path === '/api/billing/subscription') data = ok({ current_period_end: '2026-09-25T00:00:00Z' })
  else if (path === '/api/orders') data = { data: { items: [], total: 0, page: 1, limit: 100 }, error: null }
  else if (path === '/api/analytics/summary') data = ok({ ...summary, prev: { ...summary, total_revenue: 100000, total_orders: 40 } })
  else if (path === '/api/analytics/profit-loss') data = ok(financial)
  else if (path === '/api/analytics/employees') data = ok([{ user_id: 'staff-1', name: 'Alice Sales', job_title: 'Sales clerk', is_active: true, total_sales: 20, online_orders: 12, pos_sales: 8, revenue: 52000, avg_sale: 2600, completed: 19, cancelled_or_voided: 1, completion_rate: 95, last_sale_at: '2026-08-26T08:00:00Z' }])
  else if (path === '/api/analytics/top-products') data = ok({ by_revenue: [], by_volume: [] })
  else if (path === '/api/analytics/peak-hours' || path === '/api/analytics/payment-methods') data = ok([])
  else if (path === '/api/expenses/summary') data = ok({ date_from: '2026-08-01', date_to: '2026-08-26', total: 0, expense_count: 0, by_category: [] })
  else if (path === '/api/expenses' && request.method() === 'POST') {
    expensePosts += 1
    data = ok({ id: 'expense-1', tenant_id: 'tenant-1', category: 'supplies', description: 'Cooking oil', amount: 2500, expense_date: '2026-08-26', created_at: '2026-08-26T08:00:00Z' })
  } else if (path === '/api/expenses') data = { data: { items: [], total: 0, page: 1, limit: 20 }, error: null }
  else data = ok(null)
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
})

await page.goto('http://127.0.0.1:3000/analytics')
await page.getByText('Alice Sales').waitFor()
await page.waitForTimeout(300)
const metricTrack = page.getByRole('region', { name: 'Analytics metrics' })
const reportTrack = page.getByRole('region', { name: 'Employee and financial performance reports' })
const metricSize = await metricTrack.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }))
const reportSize = await reportTrack.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }))
const metricDots = page.getByLabel('Analytics metric carousel pages').getByRole('button')
const reportDots = page.getByLabel('Performance report carousel pages').getByRole('button')
if (await metricDots.count() !== 7 || await reportDots.count() !== 2 || metricSize.scroll <= metricSize.client || reportSize.scroll <= reportSize.client) {
  throw new Error(`Carousel structure failed: ${JSON.stringify({ metricSize, reportSize, metricDots: await metricDots.count(), reportDots: await reportDots.count() })}`)
}
await metricDots.nth(1).click()
await reportDots.nth(1).click()
await page.waitForTimeout(600)
if (await metricDots.nth(1).getAttribute('aria-current') !== 'true' || await reportDots.nth(1).getAttribute('aria-current') !== 'true') {
  throw new Error('Carousel navigation did not update the active dot')
}
await page.screenshot({ path: '/tmp/analytics-mobile-carousels.png', fullPage: true })

await page.goto('http://127.0.0.1:3000/expenses')
await page.getByRole('button', { name: 'Add expense' }).click()
const dialog = page.getByRole('dialog', { name: 'Log an expense' })
await dialog.getByPlaceholder('Description (optional)').fill('Cooking oil')
await dialog.getByPlaceholder('0.00').fill('2500')
await dialog.screenshot({ path: '/tmp/expense-dialog-mobile.png' })
await dialog.getByRole('button', { name: 'Add expense' }).click()
await dialog.waitFor({ state: 'hidden' })
if (expensePosts !== 1) throw new Error(`Expected one bound expense submission, got ${expensePosts}`)

console.log(JSON.stringify({ metricSize, reportSize, metricDots: 7, reportDots: 2, expensePosts }))
await browser.close()
