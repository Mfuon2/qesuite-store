import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccessStore } from '@/stores/access'

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
      path: '/accept-invite',
      name: 'accept-invite',
      component: () => import('@/views/AcceptInviteView.vue'),
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
      meta: { requiresAuth: true, roles: ['owner', 'staff'], requiresOnboardingComplete: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { permission: 'dashboard.view' } },
        { path: 'orders', name: 'orders', component: () => import('@/views/dashboard/OrdersView.vue'), meta: { permission: 'orders.view' } },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/dashboard/OrderDetailView.vue'), meta: { permission: 'orders.view' } },
        { path: 'products', name: 'products', component: () => import('@/views/dashboard/ProductsView.vue'), meta: { permission: 'products.view' } },
        { path: 'categories', name: 'categories', component: () => import('@/views/dashboard/CategoriesView.vue'), meta: { permission: 'categories.view' } },
        { path: 'delivery', name: 'delivery-team', component: () => import('@/views/dashboard/DeliveryTeamView.vue'), meta: { permission: 'delivery.view' } },
        { path: 'pos', name: 'pos', component: () => import('@/views/dashboard/SalesTerminalView.vue'), meta: { permission: 'pos.view' } },
        { path: 'expenses', name: 'expenses', component: () => import('@/views/dashboard/ExpensesView.vue'), meta: { permission: 'expenses.view' } },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/dashboard/AnalyticsView.vue'), meta: { permission: 'analytics.view' } },
        { path: 'settings', name: 'settings', component: () => import('@/views/dashboard/SettingsView.vue'), meta: { permission: 'settings.view' } },
        { path: 'billing', name: 'billing', component: () => import('@/views/dashboard/BillingView.vue'), meta: { permission: 'billing.view' } },
        { path: 'notifications', name: 'notifications', component: () => import('@/views/dashboard/NotificationsView.vue'), meta: { permission: 'notifications.view' } },
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

function getHomeForRole(role: string): string {
  if (role === 'owner') return '/dashboard'
  if (role === 'staff') return '/dashboard'
  if (role === 'rider') return '/rider'
  if (role === 'superadmin') return '/admin/stores'
  return '/login'
}

router.beforeEach(async (to) => {
  // Read from the Pinia auth store (memory token) — NOT sessionStorage,
  // which no longer holds the access token after the security hardening.
  const authStore = useAuthStore()
  const accessStore = useAccessStore()

  // On first navigation after a page reload, wait for the cookie-based
  // rehydration attempt to complete before deciding auth state.
  await authStore.ready

  const token = authStore.token
  const role  = authStore.role
  const onboardingComplete = authStore.onboardingComplete

  // Already authenticated → redirect away from public routes
  if (to.meta.public && token && role) {
    if (to.name === 'rider-verify' || to.name === 'accept-invite') return true
    if (role === 'owner') return onboardingComplete ? '/dashboard' : '/onboarding'
    return getHomeForRole(role)
  }

  if (to.meta.requiresAuth) {
    if (!token || !role) return '/login'

    // Role mismatch → send to correct section
    const requiredRole = to.meta.role as string | undefined
    const requiredRoles = to.meta.roles as string[] | undefined
    if ((requiredRole && role !== requiredRole) || (requiredRoles && !requiredRoles.includes(role))) {
      return getHomeForRole(role)
    }

    if (role === 'owner' || role === 'staff') {
      try {
        await accessStore.fetchCurrent()
      } catch {
        return '/login'
      }
    }

    const permission = to.meta.permission as string | undefined
    if (role === 'staff' && permission && !accessStore.can(permission)) {
      const firstAllowed = [
        ['dashboard.view', '/dashboard'], ['orders.view', '/orders'], ['pos.view', '/pos'],
        ['expenses.view', '/expenses'], ['products.view', '/products'], ['categories.view', '/categories'],
        ['delivery.view', '/delivery'], ['analytics.view', '/analytics'],
        ['notifications.view', '/notifications'], ['settings.view', '/settings'], ['billing.view', '/billing'],
      ].find(([required]) => accessStore.can(required))
      return firstAllowed?.[1] ?? '/login'
    }

    // Owner onboarding gate
    if (role === 'owner' && to.meta.requiresOnboardingComplete && !onboardingComplete) return '/onboarding'
    if (to.name === 'onboarding' && onboardingComplete) return '/dashboard'
  }

  return true
})

export default router
