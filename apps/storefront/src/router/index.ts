import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:slug',
      component: () => import('../views/StorefrontLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
        { path: 'track/:code', name: 'track', component: () => import('../views/TrackView.vue') },
        { path: 'order-success', name: 'order-success', component: () => import('../views/OrderSuccessView.vue') },
      ]
    },
    { path: '/', name: 'marketplace', component: () => import('../views/MarketplaceView.vue') },
    { path: '/offline', name: 'offline', component: () => import('../views/OfflineView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (_to.name === 'marketplace') return { top: 0 }
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router
