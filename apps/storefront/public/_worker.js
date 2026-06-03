/**
 * Cloudflare Pages Function (edge worker for store.qesuite.com)
 *
 * On every request to store.qesuite.com/:slug:
 *   - Crawlers (Googlebot etc.) → fetch pre-rendered HTML from the Worker API
 *   - Humans → serve the normal Vue SPA from Pages
 */

const API = 'https://qesuite-worker-api.leemfo.workers.dev'

const BOT_RE = /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|duckduckbot|ahrefsbot|semrushbot|screaming.frog|twitterbot|facebookexternalhit|linkedinbot|whatsapp|slackbot|telegrambot/i

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const ua  = request.headers.get('User-Agent') ?? ''

    // Only intercept store pages (/:slug) for bots
    const slugMatch = url.pathname.match(/^\/([a-z0-9-]+)\/?$/)
    if (slugMatch && request.method === 'GET' && BOT_RE.test(ua)) {
      const slug = slugMatch[1]
      // Skip obvious non-store paths
      if (['sitemap.xml','robots.txt','favicon.svg','sw.js','manifest.webmanifest'].includes(slug)) {
        return env.ASSETS.fetch(request)
      }
      const prerender = await fetch(`${API}/render/${slug}`, {
        headers: { 'User-Agent': ua, 'Accept': 'text/html' }
      })
      if (prerender.ok) return prerender
    }

    // Everyone else (humans + assets) → serve the Vue SPA from Pages
    return env.ASSETS.fetch(request)
  }
}
