# Graph Report - store  (2026-08-27)

## Corpus Check
- 282 files · ~1,040,457 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2755 nodes · 4934 edges · 158 communities (141 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c0a8230`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CatalogShareModal.vue
- SalesTerminalView.vue
- dependencies
- ui/src/index.ts
- DashboardView.vue
- ProductGrid.vue
- SubscriptionTab.vue
- OrdersView.vue
- TrackView.vue
- worker-api/src/index.ts
- AnalyticsView.vue
- shared/src/index.ts
- StoreDetailView.vue
- stores/auth.ts
- ProductCatalogStep.vue
- MarketplaceView.vue
- api/admin.ts
- AddressSearch.vue
- types/src/index.ts
- apiFetch
- SettingsView.vue
- UsersAccessPanel.vue
- NotificationsView.vue
- cloudflare.d.ts
- PlatformBillingView.vue
- DeliveryTeamView.vue
- StoresView.vue
- components/LiveMap.vue
- PurchaseOrdersView.vue
- DashboardLayout.vue
- dashboard/OrderDetailView.vue
- compilerOptions
- stores/store.ts
- compilerOptions
- Progress
- parseAppTimestamp
- dashboard/LiveMap.vue
- api/orders.ts
- views/OnboardingView.vue
- ProductFormModal.vue
- BillingView.vue
- LocationSearch.vue
- stores/pos.ts
- StorefrontLayout.vue
- OrderSuccessView.vue
- overrides
- worker-api/package.json
- layouts/OnboardingView.vue
- CategoriesView.vue
- StorefrontHeader.vue
- api/settings.ts
- api/analytics.ts
- SubscriptionsView.vue
- DeliveryStep.vue
- routes/pos.ts
- ExpensesView.vue
- dashboard/OrderCard.vue
- CheckoutView.vue
- dependencies
- devDependencies
- delivery/OrderDetailView.vue
- routes/access.ts
- routes/storefront.ts
- api/delivery.ts
- StoreIdentityStep.vue
- SubscriptionWall.vue
- StockManagementView.vue
- LoginView.vue
- routes/auth.ts
- compilerOptions
- RegisterView.vue
- MetricsView.vue
- ImageUpload.vue
- app/src/router/index.ts
- MpesaManualEntry.vue
- views/HomeView.vue
- deploy.sh
- jwt.ts
- ProductsView.vue
- HeroBanner.vue
- app/src/api/index.ts
- AdminProfileView.vue
- stores/stock.ts
- validatePhone
- Areas requiring refinement
- stores/categories.ts
- useToast
- useCart.ts
- ui/package.json
- app/package.json
- storefront/src/composables/useToast.ts
- AdminLayout.vue
- compilerOptions
- CLAUDE.md
- ResetPasswordModal.vue
- PaymentReferenceModal.vue
- compilerOptions
- ContactStep.vue
- PackingSlipModal.vue
- SuppliersView.vue
- useNetworkActivity.ts
- routes/invoices.ts
- shared/package.json
- delivery/HomeView.vue
- API Load and Stress Test Report
- confirm
- VoidSaleModal.vue
- useRealtime
- loadAll
- pointsFor
- api/purchaseOrders.ts
- ConfirmModal.vue
- AssignRiderModal.vue
- RealTimeIndicator.vue
- useModal.ts
- pctChange
- DataTable.vue
- LeafletMap
- trackOrder
- TrialBanner.vue
- FailureReasonModal.vue
- styles/package.json
- types/package.json
- admin/KpiCard.vue
- admin/StatusBadge.vue
- LoadingSpinner.vue
- @qesuite/styles
- confirmTillAction
- useSnapCarousel
- cashDifferenceLabel
- PageHeader.vue
- dashboard/KpiCard.vue
- recentActivity
- app/src/vite-env.d.ts
- storefront/src/vite-env.d.ts
- handleCharge
- DeliveryConfigStep.vue
- deliveryOrders.ts
- vue
- vue-router
- app/src/shims-vue.d.ts
- paymentChartData
- PosTill.vue
- VerifyView.vue
- @qesuite/shared
- storefront/src/shims-vue.d.ts
- stores/suppliers.ts
- subtotal
- app/src/App.vue
- ColorPicker.vue
- @heroicons/vue

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 90 edges
2. `useToast()` - 44 edges
3. `showToast()` - 38 edges
4. `useAccessStore` - 36 edges
5. `router` - 35 edges
6. `useAuthStore` - 34 edges
7. `Env` - 34 edges
8. `useStorefrontStore` - 31 edges
9. `Variables` - 30 edges
10. `parseAppTimestamp()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `timeAgo` --calls--> `parseAppTimestamp()`  [EXTRACTED]
  apps/app/src/components/dashboard/OrderCard.vue → packages/shared/src/index.ts
- `onPhoneInput()` --calls--> `validatePhone()`  [EXTRACTED]
  apps/storefront/src/components/checkout/ContactStep.vue → packages/shared/src/index.ts
- `RawOrdersResponse` --references--> `Order`  [EXTRACTED]
  apps/app/src/api/orders.ts → packages/types/src/index.ts
- `RawPosListResponse` --references--> `PosSale`  [EXTRACTED]
  apps/app/src/api/pos.ts → packages/types/src/index.ts
- `isExpiringSoon()` --calls--> `parseAppTimestamp()`  [EXTRACTED]
  apps/app/src/components/admin/StoreRow.vue → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Communities (158 total, 17 thin omitted)

### Community 0 - "CatalogShareModal.vue"
Cohesion: 0.06
Nodes (66): accentColor, allCatalogsSelected, allProductsSelected, canGenerate, canvasToBlob(), CatalogId, catalogLabel(), catalogOptions (+58 more)

### Community 1 - "SalesTerminalView.vue"
Cohesion: 0.03
Nodes (46): accessStore, businessDate, canCharge, cart, cartTotal, cashAdjustmentOpen, cashExpenseCategory, cashMovementAmount (+38 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, @heroicons/vue, pinia, @qesuite/shared, @qesuite/styles, @qesuite/types, @qesuite/ui, vue (+39 more)

### Community 3 - "ui/src/index.ts"
Cohesion: 0.07
Nodes (43): cells, displayFormatter, displayLabel, emit, monthFormatter, monthLabel, onTriggerClick(), onTriggerKeydown() (+35 more)

### Community 4 - "DashboardView.vue"
Cohesion: 0.04
Nodes (40): activeQuickPage, auth, chartBounds, chartLoading, chartSeries, DashboardFinancialData, days, financialData (+32 more)

### Community 5 - "ProductGrid.vue"
Cohesion: 0.12
Nodes (17): activeCategoryName, emit, filteredProducts, filterOptions, filtersActive, loading, priceRanges, productPrice() (+9 more)

### Community 6 - "SubscriptionTab.vue"
Cohesion: 0.07
Nodes (41): activateStoreSubscription(), addStoreBillingRecord(), adjustSubscriptionDays(), cancelStoreSubscription(), getStoreSubscription(), reviveStoreSubscription(), updateStoreSubscription(), updateStoreTrial() (+33 more)

### Community 7 - "OrdersView.vue"
Cohesion: 0.05
Nodes (31): accessStore, advance(), advancing, currentPage, hasFilters, isListView, KANBAN_COLS, kanbanByStatus (+23 more)

### Community 8 - "TrackView.vue"
Cohesion: 0.06
Nodes (33): cart, code, currentStatusDescription, currentStatusIndex, currentStatusTitle, deliveryAddress, error, estimatedMinutes (+25 more)

### Community 9 - "worker-api/src/index.ts"
Cohesion: 0.13
Nodes (27): ALLOWED_ORIGINS, app, auditEntry, authMiddleware(), tenantGuard(), ApprovalRequestRow, approvals, billing (+19 more)

### Community 10 - "AnalyticsView.vue"
Cohesion: 0.06
Nodes (27): DateRange, accessStore, analyticsStore, barOptions, baseChartOptions, cancelChange, customFrom, customTo (+19 more)

### Community 11 - "shared/src/index.ts"
Cohesion: 0.06
Nodes (15): ACCESS_PERMISSION_GROUPS, ACCESS_PRESETS, AccessPermissionKey, APP_CONSTANTS, CATEGORY_ICON_PRESETS, CURRENCY_SYMBOLS, NAIROBI_CENTER, ORDER_STATUSES (+7 more)

### Community 12 - "StoreDetailView.vue"
Cohesion: 0.07
Nodes (29): updateStoreProfile(), run(), activeTab, editingProfile, handleExtend(), handleImpersonate(), handleResetPassword(), handleSuspend() (+21 more)

### Community 13 - "stores/auth.ts"
Cohesion: 0.16
Nodes (23): adminLogin(), apiGetMe(), apiLogin(), apiLogout(), apiRegister(), apiResolveIdentifier(), apiSelectStore(), AuthData (+15 more)

### Community 14 - "ProductCatalogStep.vue"
Cohesion: 0.15
Nodes (10): cancelForm(), editingIdx, emit, imageUploading, imageUploadRef, localProducts, newProduct, props (+2 more)

### Community 15 - "MarketplaceView.vue"
Cohesion: 0.07
Nodes (28): getStores(), ProductPreview, StoreListItem, adStyle, enabled, props, activeCategory, categoryFilters (+20 more)

### Community 16 - "api/admin.ts"
Cohesion: 0.12
Nodes (29): AdminLoginResponse, AdminUser, deleteStore(), extendTrial(), getGMVChart(), getImpersonationToken(), getPlatformMetrics(), getStore() (+21 more)

### Community 17 - "AddressSearch.vue"
Cohesion: 0.08
Nodes (26): api, ApiError, clear(), close(), emit, googleMode, GooglePrediction, googleResults (+18 more)

### Community 18 - "types/src/index.ts"
Cohesion: 0.05
Nodes (50): apiApproveRequest(), apiGetApprovals(), apiRejectRequest(), api, useApprovalsStore, ACTION_ICON, approvalsStore, notes (+42 more)

### Community 19 - "apiFetch"
Cohesion: 0.15
Nodes (28): apiAcceptInvitation(), apiCreateInvitation(), apiGetAccessCatalog(), apiGetCurrentAccess(), apiGetInvitation(), apiGetInvitations(), apiGetMembers(), apiRenewInvitation() (+20 more)

### Community 20 - "SettingsView.vue"
Cohesion: 0.06
Nodes (31): fontOptions, fontOptions, accessStore, activeTab, activeTabMeta, applyPreview(), authStore, bannerRef (+23 more)

### Community 21 - "UsersAccessPanel.vue"
Cohesion: 0.06
Nodes (34): copyMessage(), AccessEditor, accessStore, activeCount, closeDraft(), copyInvite(), createInvitation(), Draft (+26 more)

### Community 22 - "NotificationsView.vue"
Cohesion: 0.07
Nodes (21): accessStore, CHANNEL_FILTERS, channelFilter, currentPage, fetchSummary(), limit, loading, Meta (+13 more)

### Community 23 - "cloudflare.d.ts"
Cohesion: 0.07
Nodes (9): D1Database, D1ExecResult, D1PreparedStatement, D1Result, Queue, R2Bucket, R2Object, R2ObjectBody (+1 more)

### Community 24 - "PlatformBillingView.vue"
Cohesion: 0.10
Nodes (25): getPlatformBilling(), PlatformBillingRecord, verifyBillingReference(), iconPath, ICONS, iconSizeClass, props, sizeClass (+17 more)

### Community 25 - "DeliveryTeamView.vue"
Cohesion: 0.10
Nodes (21): apiGetDeliveryStaff(), apiUpdateDeliveryStaff(), accessStore, activeRiders, addingRider, cancelEdit(), editForm, editingRider (+13 more)

### Community 26 - "StoresView.vue"
Cohesion: 0.06
Nodes (21): dayOptions, selected, endItem, pageNumbers, props, startItem, reason, useDebounce() (+13 more)

### Community 27 - "components/LiveMap.vue"
Cohesion: 0.12
Nodes (10): destIcon(), initMap(), LeafletMarker, LeafletPolyline, map(), mapEl, mapReady, props (+2 more)

### Community 28 - "PurchaseOrdersView.vue"
Cohesion: 0.07
Nodes (23): accessStore, canSaveDraft, canSubmitReceive, closeModal(), detail, doAction(), editingId, form (+15 more)

### Community 29 - "DashboardLayout.vue"
Cohesion: 0.08
Nodes (25): accessStore, authStore, currentPageTitle, filteredNavStructure, isActiveNav(), isRestaurant, mobileMenuOpen, moreOpen (+17 more)

### Community 30 - "dashboard/OrderDetailView.vue"
Cohesion: 0.08
Nodes (23): apiRecordPayment(), accessStore, availableActions, canAssignRider, canCancel, cancelReason, cancelReasonOptions, handlePaymentConfirm() (+15 more)

### Community 31 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 32 - "stores/store.ts"
Cohesion: 0.16
Nodes (20): checkMpesaStatus(), getCategories(), getProducts(), getStore(), initiateMpesa(), MpesaCodeResponse, MpesaInitResponse, MpesaStatusResponse (+12 more)

### Community 33 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 34 - "Progress"
Cohesion: 0.08
Nodes (25): 1. Prerequisites, 2. Install dependencies, 3. Set up Cloudflare resources, 4. Run migrations, 5. Configure environment, 6. Start development, 7. Deploy, Apps (+17 more)

### Community 35 - "parseAppTimestamp"
Cohesion: 0.12
Nodes (22): getStoreBillingHistory(), StoreBillingHistory, loading, props, records, isExpiringSoon(), daysRemaining, previewEnd() (+14 more)

### Community 36 - "dashboard/LiveMap.vue"
Cohesion: 0.11
Nodes (9): icon(), LeafletMap, LeafletMarker, LeafletPolyline, mapEl, mapReady, props, recenter() (+1 more)

### Community 37 - "api/orders.ts"
Cohesion: 0.16
Nodes (21): apiAssignRider(), apiGetOrder(), apiGetOrders(), apiGetPackingSlip(), apiUpdateOrderStatus(), RawOrderDetailResponse, RawOrdersResponse, RawPackingSlipResponse (+13 more)

### Community 38 - "views/OnboardingView.vue"
Cohesion: 0.09
Nodes (20): apiCompleteOnboarding(), nextStep(), authStore, canProceed, currentStep, deliveryConfig, isComplete, nextStep() (+12 more)

### Community 39 - "ProductFormModal.vue"
Cohesion: 0.12
Nodes (26): apiBulkImportProducts(), apiCreateProduct(), apiDeleteProduct(), apiGetProduct(), apiGetProducts(), apiGetUploadUrl(), apiUpdateProduct(), categories (+18 more)

### Community 40 - "BillingView.vue"
Cohesion: 0.06
Nodes (48): apiCreateInvoice(), apiGetArAging(), apiGetInvoice(), apiGetInvoices(), apiIssueCreditNote(), apiRecordInvoicePayment(), apiRequestWriteOff(), apiSendInvoice() (+40 more)

### Community 41 - "LocationSearch.vue"
Cohesion: 0.09
Nodes (26): clear(), close(), confirmedAddress, emit, googleMode, GooglePrediction, googleResults, highlighted (+18 more)

### Community 42 - "stores/pos.ts"
Cohesion: 0.21
Nodes (21): apiCloseTill(), apiCreatePosSale(), apiGetCurrentTill(), apiGetPosReport(), apiGetPosSale(), apiGetPosSales(), apiGetTillHistory(), apiOpenTill() (+13 more)

### Community 43 - "StorefrontLayout.vue"
Cohesion: 0.10
Nodes (17): dismissed, status, store, visible, applySEO(), cartStore, goToMarketplace(), redirectCountdown (+9 more)

### Community 44 - "OrderSuccessView.vue"
Cohesion: 0.10
Nodes (14): app, i18n, router, isRoot, route, cachedProducts, cart, store (+6 more)

### Community 45 - "overrides"
Cohesion: 0.09
Nodes (22): devDependencies, typescript, typescript, name, overrides, brace-expansion, fast-uri, nanoid (+14 more)

### Community 46 - "worker-api/package.json"
Cohesion: 0.08
Nodes (23): dependencies, hono, pdf-lib, @qesuite/shared, @qesuite/types, devDependencies, @cloudflare/workers-types, typescript (+15 more)

### Community 47 - "layouts/OnboardingView.vue"
Cohesion: 0.10
Nodes (17): authStore, canProceed, currentStep, deliveryConfig, isComplete, prefilling, products, progressPct (+9 more)

### Community 48 - "CategoriesView.vue"
Cohesion: 0.10
Nodes (14): accessStore, activeCategories, cancelForm(), categoriesStore, CATEGORY_ICON_COMPONENTS, { confirm }, editingId, form (+6 more)

### Community 49 - "StorefrontHeader.vue"
Cohesion: 0.10
Nodes (14): cartStore, config, isDark, { locale }, locationGranted, locationLabel, locationOpen, manualAddress (+6 more)

### Community 50 - "api/settings.ts"
Cohesion: 0.24
Nodes (15): apiGetStoreSettings(), apiGetSubscription(), apiGetTenant(), apiUpdateStoreSettings(), apiUpdateTenant(), OnboardingPayload, OnboardingProductRow, TenantUpdate (+7 more)

### Community 51 - "api/analytics.ts"
Cohesion: 0.23
Nodes (18): AnalyticsParams, apiGetAnalyticsSummary(), apiGetEmployeePerformance(), apiGetFinancialPerformance(), apiGetPaymentMethods(), apiGetPeakHours(), apiGetRevenueChart(), apiGetTopProducts() (+10 more)

### Community 52 - "SubscriptionsView.vue"
Cohesion: 0.11
Nodes (16): apiGetBillingHistory(), apiSubmitMpesaReference(), accessStore, canSubmitReference, history, loading, monthlyAmount, mpesaReference (+8 more)

### Community 53 - "DeliveryStep.vue"
Cohesion: 0.12
Nodes (12): addressError, cart, cartStore, checkout, deliveryEnabled, deliveryFeeDisplay, deliveryFeeLabel, estimatedMinutes (+4 more)

### Community 54 - "routes/pos.ts"
Cohesion: 0.08
Nodes (24): BUSINESS_TIME_ZONE, businessDate(), businessDateDaysAgo(), D1_NAIROBI_MODIFIER, inclusiveDateRange(), restaurantGuard(), analytics, DateRange (+16 more)

### Community 55 - "ExpensesView.vue"
Cohesion: 0.13
Nodes (17): dateRangeDisplay, accessStore, canSubmit, closeExpenseDialog(), { confirm }, expenseCategoryOptions, expensesStore, form (+9 more)

### Community 56 - "dashboard/OrderCard.vue"
Cohesion: 0.12
Nodes (16): availableActions, emit, handleStatusChange(), itemsSummary, paymentMethodLabel, props, statusActions, timeAgo (+8 more)

### Community 57 - "CheckoutView.vue"
Cohesion: 0.11
Nodes (13): props, steps, { t }, cart, cartStore, checkout, deliveryFeeLabel, isConfirmation (+5 more)

### Community 58 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, chart.js, pinia, @qesuite/types, @qesuite/ui, @supabase/supabase-js, vue-chartjs, vue-i18n (+9 more)

### Community 59 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, postcss, tailwindcss, typescript, vite, vite-plugin-pwa, @vitejs/plugin-vue (+9 more)

### Community 60 - "delivery/OrderDetailView.vue"
Cohesion: 0.12
Nodes (13): actionLoading, assignment, assignmentId, googleMapsUrl, navTarget(), ordersStore, osmUrl, route (+5 more)

### Community 61 - "routes/access.ts"
Cohesion: 0.15
Nodes (14): AccessRule, accessRules, enforceAccessPolicy(), normalizePermissions(), ownerOnly(), PermissionKey, requirePermissions(), rulesByMethod (+6 more)

### Community 62 - "routes/storefront.ts"
Cohesion: 0.21
Nodes (17): handleQueue(), logNotification(), NotificationMessage, processNotification(), b64(), enc, escapeHtml(), renderOwnerAlertEmail() (+9 more)

### Community 63 - "api/delivery.ts"
Cohesion: 0.18
Nodes (11): apiCreateDeliveryStaff(), apiDeleteDeliveryStaff(), apiGetActiveAssignments(), apiSendMagicLink(), RiderStoreSelectionData, VerifyResponse, addRider(), sendLink() (+3 more)

### Community 64 - "StoreIdentityStep.vue"
Cohesion: 0.16
Nodes (14): apiCheckSlug(), bannerUploadRef, categories, checkSlug(), form, generateSlug(), logoUploadRef, slugChecking (+6 more)

### Community 65 - "SubscriptionWall.vue"
Cohesion: 0.13
Nodes (14): apiInitiateMpesaPayment(), activePlan, authStore, isExpired, logout(), mpesaPhone, mpesaSuccess, payError (+6 more)

### Community 66 - "StockManagementView.vue"
Cohesion: 0.08
Nodes (24): accessStore, activeTab, adjustStock(), canEditStock, countDrafts, filteredProducts, lowStockCount, lowStockThreshold() (+16 more)

### Community 67 - "LoginView.vue"
Cohesion: 0.14
Nodes (9): auth, error, identifier, ownerPassword, resolving, router, selectingTenantId, step (+1 more)

### Community 68 - "routes/auth.ts"
Cohesion: 0.18
Nodes (13): generateOTP(), deriveKey(), enc, fromHex(), hashPassword(), hashToken(), toHex(), verifyPassword() (+5 more)

### Community 69 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, lib, module, moduleResolution, noImplicitAny, resolveJsonModule, strict, target (+7 more)

### Community 70 - "RegisterView.vue"
Cohesion: 0.14
Nodes (13): apiCheckStoreName(), acceptedTerms, authStore, error, form, handleStoreNameInput(), loading, router (+5 more)

### Community 71 - "MetricsView.vue"
Cohesion: 0.15
Nodes (14): barChartOptions, baseChartOptions, donutData, donutOptions, formatMoney(), gmvChartData, growthChartData, kpiCards (+6 more)

### Community 72 - "ImageUpload.vue"
Cohesion: 0.19
Nodes (12): emit, fileInput, handleChange(), handleDrop(), isDragging, preview, processFile(), progress (+4 more)

### Community 73 - "app/src/router/index.ts"
Cohesion: 0.18
Nodes (8): app, i18n, router, adminEmail, adminPassword, auth, error, router

### Community 74 - "MpesaManualEntry.vue"
Cohesion: 0.07
Nodes (24): cart, checkout, copied, order, slug, store, accountRef, cart (+16 more)

### Community 75 - "views/HomeView.vue"
Cohesion: 0.10
Nodes (16): emit, props, scrollContainer, scrollToActive(), selectCategory(), tabRefs, address, phone (+8 more)

### Community 76 - "deploy.sh"
Cohesion: 0.26
Nodes (13): abort(), BUILD_STATUS, DEPLOY_STATUS, fail(), hr(), info(), ok(), print_summary() (+5 more)

### Community 77 - "jwt.ts"
Cohesion: 0.14
Nodes (19): fib(), handleCron(), maybeSendReminder(), runDailyAnalyticsSnapshot(), runSubscriptionReminders(), snapshotTenantDay(), generateId(), generateTrackingCode() (+11 more)

### Community 78 - "ProductsView.vue"
Cohesion: 0.09
Nodes (20): accessStore, canManageProducts, categoriesStore, categoryFilterOptions, { confirm }, editingProduct, featuredCount, handleCsvImport() (+12 more)

### Community 79 - "HeroBanner.vue"
Cohesion: 0.17
Nodes (12): deliveryEnabled, distanceLabel, estimatedMinutes, hasOwnerBanner, haversineKm(), heroImage, loading, logoUrl (+4 more)

### Community 80 - "app/src/api/index.ts"
Cohesion: 0.24
Nodes (15): apiFetchBlob(), apiUpload(), clearTokens(), doRefresh(), getRoleFromToken(), labelForRequest(), refreshAccessToken(), setTokens() (+7 more)

### Community 81 - "AdminProfileView.vue"
Cohesion: 0.22
Nodes (10): apiUpdateMe(), authStore, changePassword(), form, initial, passwordAction, passwordForm, profileAction (+2 more)

### Community 82 - "stores/stock.ts"
Cohesion: 0.41
Nodes (10): apiCloseStockTake(), apiGetStockMovements(), apiGetStockTakeSession(), apiGetStockTakeSessions(), apiOpenStockTake(), apiRecordStockTakeCounts(), apiRequestStockAdjustment(), useStockStore (+2 more)

### Community 83 - "validatePhone"
Cohesion: 0.15
Nodes (12): nairobiCompactTimestamp(), getMpesaPassword(), payments, validatePhone(), displayValue, emit, focused, inputRef (+4 more)

### Community 84 - "Areas requiring refinement"
Cohesion: 0.10
Nodes (20): 10. End-to-end financial control, 1. Tax-ready receipts and invoices, 2. Payment collection and reconciliation, 3. Profit, cash-flow, and performance reporting, 4. Customer credit and receivables control, 5. Accurate stock costing and valuation, 6. Expiry and low-stock workflows, 7. Controlled access and complete accountability (+12 more)

### Community 85 - "stores/categories.ts"
Cohesion: 0.42
Nodes (9): apiCreateCategory(), apiDeleteCategory(), apiGetCategories(), apiReorderCategories(), apiUpdateCategory(), useCategoriesStore, Category, CategoryCreate (+1 more)

### Community 86 - "useToast"
Cohesion: 0.17
Nodes (16): apiCreateExpense(), apiDeleteExpense(), apiGetExpenses(), apiGetExpenseSummary(), ExpenseSummary, RawExpensesListResponse, { toasts, remove }, useAdminAction() (+8 more)

### Community 87 - "useCart.ts"
Cohesion: 0.08
Nodes (27): cart, cartStore, deliveryFeeDisplay, slug, storefrontStore, discountPct, displayPrice, { formatPrice, addToCart, increment, decrement, getQuantity } (+19 more)

### Community 88 - "ui/package.json"
Cohesion: 0.18
Nodes (10): dependencies, @qesuite/shared, @qesuite/shared, vue, main, name, peerDependencies, vue (+2 more)

### Community 89 - "app/package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, preview, type-check, type (+1 more)

### Community 90 - "storefront/src/composables/useToast.ts"
Cohesion: 0.18
Nodes (10): isDark, prefersDark, storedTheme, { toasts, dismiss }, dismiss(), show(), Toast, toasts (+2 more)

### Community 91 - "AdminLayout.vue"
Cohesion: 0.20
Nodes (7): auth, bottomNavItems, navItems, route, router, sidebarOpen, userInitial

### Community 92 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include (+1 more)

### Community 93 - "CLAUDE.md"
Cohesion: 0.20
Nodes (8): Backend architecture (`apps/worker-api`), Commands, Database (`migrations/`), Frontend architecture, graphify, Security invariants (don't relax these without asking), Shared packages (`packages/`), What this is

### Community 94 - "ResetPasswordModal.vue"
Cohesion: 0.22
Nodes (7): copied, customPassword, emit, isSubmitDisabled, mode, props, showInput

### Community 95 - "PaymentReferenceModal.vue"
Cohesion: 0.25
Nodes (8): confirm(), emit, loading, method, methods, note, props, reference

### Community 96 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.ts

### Community 97 - "ContactStep.vue"
Cohesion: 0.28
Nodes (8): checkout, errors, handleNext(), onPhoneInput(), phoneValid, { t }, validateName(), validatePhone()

### Community 98 - "PackingSlipModal.vue"
Cohesion: 0.25
Nodes (5): emit, loading, ordersStore, props, text

### Community 99 - "SuppliersView.vue"
Cohesion: 0.18
Nodes (12): accessStore, cancelForm(), editingId, filteredSuppliers, form, openAddForm(), resetForm(), saveSupplier() (+4 more)

### Community 100 - "useNetworkActivity.ts"
Cohesion: 0.40
Nodes (4): { isActive, label }, NetworkToken, state, useNetworkActivity()

### Community 101 - "routes/invoices.ts"
Cohesion: 0.15
Nodes (11): buildDocumentPdf(), hexToRgb(), money(), PdfDocumentInput, PdfLineItem, nextSequenceNumber(), DOCUMENT_TITLES, INVOICE_NUMBER_PREFIX (+3 more)

### Community 102 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, @qesuite/types, @qesuite/types, main, name, types, version

### Community 103 - "delivery/HomeView.vue"
Cohesion: 0.15
Nodes (10): label, props, useGeolocation(), onError(), onSuccess(), start(), auth, geo (+2 more)

### Community 104 - "API Load and Stress Test Report"
Cohesion: 0.22
Nodes (8): API Load and Stress Test Report, Cloudflare Workers + D1 expectation, Executive result, Interpretation, Measured results, Recommended next tests, Reproducibility, Workload simulated

### Community 105 - "confirm"
Cohesion: 0.50
Nodes (4): confirm(), confirmDelete(), confirmDelete(), confirmDelete()

### Community 106 - "VoidSaleModal.vue"
Cohesion: 0.33
Nodes (6): emit, handleVoid(), posStore, props, reason, voiding

### Community 107 - "useRealtime"
Cohesion: 0.33
Nodes (4): RealtimeStatus, useRealtime(), connect(), scheduleReconnect()

### Community 108 - "loadAll"
Cohesion: 0.43
Nodes (7): buildQs(), fetchChart(), fetchKpis(), fetchRecentOrders(), fetchStatus(), fetchTopProducts(), loadAll()

### Community 109 - "pointsFor"
Cohesion: 0.38
Nodes (7): chartY(), chartZeroY, expenseLinePath, linePath(), pointsFor(), salesLinePath, varianceLinePath

### Community 110 - "api/purchaseOrders.ts"
Cohesion: 0.29
Nodes (15): apiApprovePurchaseOrder(), apiCancelPurchaseOrder(), apiCreatePurchaseOrder(), apiGetPurchaseOrder(), apiGetPurchaseOrders(), apiReceivePurchaseOrder(), apiRejectPurchaseOrder(), apiSendPurchaseOrder() (+7 more)

### Community 111 - "ConfirmModal.vue"
Cohesion: 0.40
Nodes (5): confirmBlocked, confirmInput, emit, handleConfirm(), props

### Community 112 - "AssignRiderModal.vue"
Cohesion: 0.18
Nodes (10): assigning, emit, handleAssign(), loading, ordersStore, props, riders, selectedRiderId (+2 more)

### Community 113 - "RealTimeIndicator.vue"
Cohesion: 0.33
Nodes (5): dotClass, label, pingClass, props, textClass

### Community 114 - "useModal.ts"
Cohesion: 0.33
Nodes (3): ModalState, state, useModal()

### Community 115 - "pctChange"
Cohesion: 0.33
Nodes (6): formatSignedKes(), heroChangePct, overviewChangePct, pctChange(), statCards, varianceChange()

### Community 116 - "DataTable.vue"
Cohesion: 0.40
Nodes (4): hasRows, props, slots, TableColumn

### Community 118 - "trackOrder"
Cohesion: 0.50
Nodes (4): trackOrder(), fetchTrackData(), manualRefresh(), submitTrackLookup()

### Community 119 - "TrialBanner.vue"
Cohesion: 0.40
Nodes (3): bannerClass, props, visible

### Community 120 - "FailureReasonModal.vue"
Cohesion: 0.29
Nodes (6): canConfirm, customReason, emit, handleConfirm(), reasons, selected

### Community 121 - "styles/package.json"
Cohesion: 0.40
Nodes (4): exports, ./base.css, name, version

### Community 122 - "types/package.json"
Cohesion: 0.40
Nodes (4): main, name, types, version

### Community 123 - "admin/KpiCard.vue"
Cohesion: 0.50
Nodes (3): iconBgClass, iconColorClass, props

### Community 124 - "admin/StatusBadge.vue"
Cohesion: 0.40
Nodes (4): badgeClass, label, props, SubscriptionStatus

### Community 125 - "LoadingSpinner.vue"
Cohesion: 0.50
Nodes (3): heightClass, props, sizeClass

### Community 127 - "confirmTillAction"
Cohesion: 0.50
Nodes (4): confirmTillAction(), openOperatingTill(), submitCashMovement(), submitTillClose()

### Community 132 - "recentActivity"
Cohesion: 0.67
Nodes (3): recentActivity, statusLabel(), timeAgo()

### Community 136 - "DeliveryConfigStep.vue"
Cohesion: 0.38
Nodes (6): addRider(), emit, form, removeRider(), riderPhone, riderPhones

### Community 137 - "deliveryOrders.ts"
Cohesion: 0.22
Nodes (11): AssignedOrder, getMyOrders(), pingLocation(), updateAssignmentStatus(), updateStatus(), badgeClass, props, statusLabel (+3 more)

### Community 142 - "PosTill.vue"
Cohesion: 0.22
Nodes (9): emit, form, PAYMENT_METHOD_OPTIONS, props, splitRemaining, TillForm, TillSplitLeg, PosPaymentMethod (+1 more)

### Community 143 - "VerifyView.vue"
Cohesion: 0.20
Nodes (8): auth, route, router, selectError, selecting, storeChoices, verifyError, verifying

### Community 153 - "stores/suppliers.ts"
Cohesion: 0.50
Nodes (7): apiCreateSupplier(), apiDeactivateSupplier(), apiGetSuppliers(), apiUpdateSupplier(), SupplierInput, useSuppliersStore, Supplier

### Community 155 - "app/src/App.vue"
Cohesion: 0.33
Nodes (5): { state: confirm }, { toasts, removeToast }, ConfirmState, state, useConfirm()

### Community 157 - "ColorPicker.vue"
Cohesion: 0.67
Nodes (3): emit, handleHexInput(), props

## Knowledge Gaps
- **1310 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+1305 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `router` connect `app/src/router/index.ts` to `SalesTerminalView.vue`, `DashboardView.vue`, `OrdersView.vue`, `AnalyticsView.vue`, `StoreDetailView.vue`, `VerifyView.vue`, `types/src/index.ts`, `apiFetch`, `SettingsView.vue`, `NotificationsView.vue`, `PlatformBillingView.vue`, `DeliveryTeamView.vue`, `StoresView.vue`, `PurchaseOrdersView.vue`, `DashboardLayout.vue`, `dashboard/OrderDetailView.vue`, `views/OnboardingView.vue`, `BillingView.vue`, `CategoriesView.vue`, `SubscriptionsView.vue`, `ExpensesView.vue`, `delivery/OrderDetailView.vue`, `StockManagementView.vue`, `LoginView.vue`, `RegisterView.vue`, `MetricsView.vue`, `ProductsView.vue`, `AdminProfileView.vue`, `AdminLayout.vue`, `SuppliersView.vue`, `delivery/HomeView.vue`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CatalogShareModal.vue`, `SalesTerminalView.vue`, `types/src/index.ts`, `SettingsView.vue`, `UsersAccessPanel.vue`, `PlatformBillingView.vue`, `stores/suppliers.ts`, `DeliveryTeamView.vue`, `app/src/App.vue`, `api/orders.ts`, `views/OnboardingView.vue`, `ProductFormModal.vue`, `BillingView.vue`, `stores/pos.ts`, `layouts/OnboardingView.vue`, `api/settings.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `ExpensesView.vue`, `StockManagementView.vue`, `app/src/api/index.ts`, `stores/stock.ts`, `stores/categories.ts`, `api/purchaseOrders.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useAccessStore` connect `apiFetch` to `SalesTerminalView.vue`, `OrdersView.vue`, `AnalyticsView.vue`, `stores/auth.ts`, `SettingsView.vue`, `UsersAccessPanel.vue`, `NotificationsView.vue`, `DeliveryTeamView.vue`, `PurchaseOrdersView.vue`, `DashboardLayout.vue`, `dashboard/OrderDetailView.vue`, `BillingView.vue`, `CategoriesView.vue`, `api/analytics.ts`, `SubscriptionsView.vue`, `ExpensesView.vue`, `StockManagementView.vue`, `ImageUpload.vue`, `app/src/router/index.ts`, `ProductsView.vue`, `SuppliersView.vue`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useToast()` (e.g. with `removeToast()` and `showToast()`) actually correct?**
  _`useToast()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `useAccessStore` (e.g. with `reset()` and `createInvitation()`) actually correct?**
  _`useAccessStore` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _1310 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CatalogShareModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.061569416498993966 - nodes in this community are weakly interconnected._