import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ─── Public ──────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true }
    },
    {
      path: '/auth/verify',
      name: 'rider-verify',
      component: () => import('@/views/delivery/VerifyView.vue'),
      meta: { public: true }
    },

    // ─── Owner (role: owner) ──────────────────────────────────────────
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true, role: 'owner' }
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true, role: 'owner', requiresOnboardingComplete: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
        { path: 'orders', name: 'orders', component: () => import('@/views/dashboard/OrdersView.vue') },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/dashboard/OrderDetailView.vue') },
        { path: 'products', name: 'products', component: () => import('@/views/dashboard/ProductsView.vue') },
        { path: 'categories', name: 'categories', component: () => import('@/views/dashboard/CategoriesView.vue') },
        { path: 'delivery', name: 'delivery-team', component: () => import('@/views/dashboard/DeliveryTeamView.vue') },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/dashboard/AnalyticsView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/dashboard/SettingsView.vue') },
        { path: 'billing', name: 'billing', component: () => import('@/views/dashboard/BillingView.vue') },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/dashboard/NotificationsView.vue') },
      ]
    },

    // ─── Rider (role: rider) ──────────────────────────────────────────
    {
      path: '/rider',
      component: () => import('@/layouts/DeliveryLayout.vue'),
      meta: { requiresAuth: true, role: 'rider' },
      children: [
        { path: '', name: 'rider-home', component: () => import('@/views/delivery/HomeView.vue') },
        { path: 'order/:id', name: 'rider-order', component: () => import('@/views/delivery/OrderDetailView.vue') },
      ]
    },

    // ─── Superadmin (role: superadmin) ────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'superadmin' },
      children: [
        { path: '', redirect: '/admin/stores' },
        { path: 'stores', name: 'admin-stores', component: () => import('@/views/admin/StoresView.vue') },
        { path: 'stores/:id', name: 'admin-store-detail', component: () => import('@/views/admin/StoreDetailView.vue') },
        { path: 'metrics', name: 'admin-metrics', component: () => import('@/views/admin/MetricsView.vue') },
        { path: 'billing', name: 'admin-billing', component: () => import('@/views/admin/PlatformBillingView.vue') },
        { path: 'profile', name: 'admin-profile', component: () => import('@/views/admin/AdminProfileView.vue') },
      ]
    },

    // ─── Catch-all ────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
})

function getRoleFromToken(token: string): string | null {
  try { return JSON.parse(atob(token.split('.')[1])).role ?? null } catch { return null }
}

function getHomeForRole(role: string): string {
  if (role === 'owner') return '/dashboard'
  if (role === 'rider') return '/rider'
  if (role === 'superadmin') return '/admin/stores'
  return '/login'
}

router.beforeEach((to) => {
  const token = sessionStorage.getItem('access_token')
  const role = token ? getRoleFromToken(token) : null
  const onboardingComplete = sessionStorage.getItem('onboarding_complete') === 'true'

  // Already authenticated → redirect away from public routes
  if (to.meta.public && token && role) {
    if (to.name === 'rider-verify') return true // always allow verify
    if (role === 'owner') return onboardingComplete ? '/dashboard' : '/onboarding'
    return getHomeForRole(role)
  }

  if (to.meta.requiresAuth) {
    if (!token || !role) return '/login'

    // Role mismatch → send to correct section
    const requiredRole = to.meta.role as string | undefined
    if (requiredRole && role !== requiredRole) return getHomeForRole(role)

    // Owner onboarding gate
    if (to.meta.requiresOnboardingComplete && !onboardingComplete) return '/onboarding'
    if (to.name === 'onboarding' && onboardingComplete) return '/dashboard'
  }

  return true
})

export default router
