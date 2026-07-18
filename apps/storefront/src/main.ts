import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import router from './router'
import App from './App.vue'
import en from '../locales/en.json'
import sw from '../locales/sw.json'
import './style.css'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

// After a deploy, browsers running the previous version fail to lazy-load
// old hashed chunks ("Failed to fetch dynamically imported module").
// Reload once to pick up the fresh index.html with matching chunk names.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'chunk-reload-at'
  const last = Number(sessionStorage.getItem(key) ?? 0)
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(key, String(Date.now()))
    window.location.reload()
  }
})

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages: { en, sw }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
