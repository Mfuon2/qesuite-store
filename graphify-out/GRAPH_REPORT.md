# Graph Report - store  (2026-08-28)

## Corpus Check
- 308 files · ~1,058,003 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2937 nodes · 5366 edges · 165 communities (149 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.85)
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
- types.ts
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
- stores/pos.ts
- BillingView.vue
- LocationSearch.vue
- constants.ts
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
- ApiResponse
- generateId
- ExpensesView.vue
- dashboard/OrderCard.vue
- CheckoutView.vue
- dependencies
- devDependencies
- delivery/OrderDetailView.vue
- syncEngine.ts
- routes/storefront.ts
- localPos.ts
- ProductFormModal.vue
- SubscriptionWall.vue
- StockManagementView.vue
- LoginView.vue
- routes/invoices.ts
- compilerOptions
- RegisterView.vue
- MetricsView.vue
- ImageUpload.vue
- routes/auth.ts
- MpesaManualEntry.vue
- views/HomeView.vue
- deploy.sh
- Pharmacy compliance features: P1–P5
- ProductsView.vue
- HeroBanner.vue
- app/src/api/index.ts
- dexie
- routes/access.ts
- validatePhone
- Areas requiring refinement
- stores/categories.ts
- capability.ts
- DeliveryStep.vue
- ui/package.json
- scripts
- AdminLayout.vue
- useToast
- compilerOptions
- CLAUDE.md
- ResetPasswordModal.vue
- PaymentReferenceModal.vue
- compilerOptions
- VerifyView.vue
- PackingSlipModal.vue
- SuppliersView.vue
- app/src/router/index.ts
- worker-api/src/index.ts
- shared/package.json
- delivery/HomeView.vue
- API Load and Stress Test Report
- CategoryTabs.vue
- ColorPicker.vue
- useRealtime
- loadAll
- pointsFor
- AcceptInviteView.vue
- ConfirmModal.vue
- app/package.json
- RealTimeIndicator.vue
- useModal.ts
- pctChange
- DataTable.vue
- VoidSaleModal.vue
- AssignRiderModal.vue
- TrialBanner.vue
- FailureReasonModal.vue
- styles/package.json
- types/package.json
- admin/KpiCard.vue
- delivery/OrderCard.vue
- LoadingSpinner.vue
- useSnapCarousel
- deviceIdentity.ts
- db.ts
- Pagination.vue
- PageHeader.vue
- dashboard/KpiCard.vue
- recentActivity
- app/src/vite-env.d.ts
- storefront/src/vite-env.d.ts
- @supabase/supabase-js
- DeliveryConfigStep.vue
- deliveryOrders.ts
- paymentChartData
- vue-router
- app/src/shims-vue.d.ts
- storefront/src/composables/useToast.ts
- PosTill.vue
- useGeolocation
- storefront/src/shims-vue.d.ts
- app/vite.config.ts
- stores/suppliers.ts
- ConfirmationStep.vue
- app/src/App.vue
- stores/stock.ts
- storeFontStack
- ModulesTab.vue
- LeafletMarker
- emit
- LeafletMap
- trackOrder
- pinia
- vue-chartjs

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 90 edges
2. `useToast()` - 46 edges
3. `showToast()` - 40 edges
4. `useAccessStore` - 38 edges
5. `useAuthStore` - 38 edges
6. `router` - 37 edges
7. `Env` - 36 edges
8. `Variables` - 32 edges
9. `useStorefrontStore` - 31 edges
10. `generateId()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `timeAgo` --calls--> `parseAppTimestamp()`  [EXTRACTED]
  apps/app/src/components/dashboard/OrderCard.vue → packages/shared/src/index.ts
- `onPhoneInput()` --calls--> `validatePhone()`  [EXTRACTED]
  apps/storefront/src/components/checkout/ContactStep.vue → packages/shared/src/index.ts
- `RawOrdersResponse` --references--> `Order`  [EXTRACTED]
  apps/app/src/api/orders.ts → packages/types/src/index.ts
- `RawPosListResponse` --references--> `PosSale`  [EXTRACTED]
  apps/app/src/api/pos.ts → packages/types/src/index.ts
- `TenantUpdate` --references--> `StoreCategory`  [EXTRACTED]
  apps/app/src/api/settings.ts → packages/types/src/index.ts

## Import Cycles
- None detected.

## Communities (165 total, 16 thin omitted)

### Community 0 - "CatalogShareModal.vue"
Cohesion: 0.06
Nodes (66): accentColor, allCatalogsSelected, allProductsSelected, canGenerate, canvasToBlob(), CatalogId, catalogLabel(), catalogOptions (+58 more)

### Community 1 - "SalesTerminalView.vue"
Cohesion: 0.03
Nodes (60): accessStore, authStore, businessDate, canCharge, cart, cartTotal, cashAdjustmentOpen, cashDifferenceLabel() (+52 more)

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
Nodes (42): activateStoreSubscription(), addStoreBillingRecord(), adjustSubscriptionDays(), cancelStoreSubscription(), getStoreSubscription(), reviveStoreSubscription(), StoreSubscriptionOverview, updateStoreSubscription() (+34 more)

### Community 7 - "OrdersView.vue"
Cohesion: 0.05
Nodes (31): accessStore, advance(), advancing, currentPage, hasFilters, isListView, KANBAN_COLS, kanbanByStatus (+23 more)

### Community 8 - "TrackView.vue"
Cohesion: 0.06
Nodes (32): cart, code, currentStatusDescription, currentStatusIndex, currentStatusTitle, deliveryAddress, error, estimatedMinutes (+24 more)

### Community 9 - "types.ts"
Cohesion: 0.17
Nodes (20): signJWT(), verifyJWT(), nairobiCompactTimestamp(), authMiddleware(), deviceSessionMiddleware(), riderMiddleware(), superadminMiddleware(), parseDisabledModules() (+12 more)

### Community 10 - "AnalyticsView.vue"
Cohesion: 0.06
Nodes (27): DateRange, accessStore, analyticsStore, barOptions, baseChartOptions, cancelChange, customFrom, customTo (+19 more)

### Community 11 - "shared/src/index.ts"
Cohesion: 0.06
Nodes (22): BUSINESS_TIME_ZONE, businessDate(), businessDateDaysAgo(), D1_NAIROBI_MODIFIER, inclusiveDateRange(), restaurantGuard, analytics, DateRange (+14 more)

### Community 12 - "StoreDetailView.vue"
Cohesion: 0.07
Nodes (29): updateStoreProfile(), run(), activeTab, editingProfile, handleExtend(), handleImpersonate(), handleResetPassword(), handleSuspend() (+21 more)

### Community 13 - "stores/auth.ts"
Cohesion: 0.11
Nodes (33): adminLogin(), apiGetMe(), apiLogin(), apiLogout(), apiRegister(), apiResolveIdentifier(), apiSelectStore(), apiUpdateMe() (+25 more)

### Community 14 - "ProductCatalogStep.vue"
Cohesion: 0.15
Nodes (10): cancelForm(), editingIdx, emit, imageUploading, imageUploadRef, localProducts, newProduct, props (+2 more)

### Community 15 - "MarketplaceView.vue"
Cohesion: 0.08
Nodes (27): getStores(), ProductPreview, adStyle, enabled, props, activeCategory, categoryFilters, categoryIcon() (+19 more)

### Community 16 - "api/admin.ts"
Cohesion: 0.12
Nodes (29): AdminLoginResponse, AdminUser, deleteStore(), extendTrial(), getGMVChart(), getImpersonationToken(), getPlatformMetrics(), getStore() (+21 more)

### Community 17 - "AddressSearch.vue"
Cohesion: 0.08
Nodes (26): api, ApiError, clear(), close(), emit, googleMode, GooglePrediction, googleResults (+18 more)

### Community 18 - "types/src/index.ts"
Cohesion: 0.05
Nodes (40): AnalyticsDaily, ApiError, ApprovalStatus, AssignDeliveryRequest, AuditAction, AuditLog, AuthTokens, Cart (+32 more)

### Community 19 - "apiFetch"
Cohesion: 0.28
Nodes (17): apiCreateInvitation(), apiGetAccessCatalog(), apiGetCurrentAccess(), apiGetInvitation(), apiGetInvitations(), apiGetMembers(), apiRenewInvitation(), apiRevokeInvitation() (+9 more)

### Community 20 - "SettingsView.vue"
Cohesion: 0.06
Nodes (26): accessStore, activeTab, activeTabMeta, authStore, bannerRef, brandingComplete, brandingProgress, businessTypes (+18 more)

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
Cohesion: 0.08
Nodes (31): apiCreateDeliveryStaff(), apiDeleteDeliveryStaff(), apiGetActiveAssignments(), apiGetDeliveryStaff(), apiSendMagicLink(), apiUpdateDeliveryStaff(), RiderStoreSelectionData, VerifyResponse (+23 more)

### Community 26 - "StoresView.vue"
Cohesion: 0.08
Nodes (17): dayOptions, selected, reason, useDebounce(), debounce(), StoreFilter, { debounce }, deleteTarget (+9 more)

### Community 27 - "components/LiveMap.vue"
Cohesion: 0.15
Nodes (9): destIcon(), initMap(), LeafletPolyline, map(), mapEl, mapReady, props, riderIcon() (+1 more)

### Community 28 - "PurchaseOrdersView.vue"
Cohesion: 0.06
Nodes (38): apiApprovePurchaseOrder(), apiCancelPurchaseOrder(), apiCreatePurchaseOrder(), apiGetPurchaseOrder(), apiGetPurchaseOrders(), apiReceivePurchaseOrder(), apiRejectPurchaseOrder(), apiSendPurchaseOrder() (+30 more)

### Community 29 - "DashboardLayout.vue"
Cohesion: 0.07
Nodes (27): accessStore, authStore, currentPageTitle, disabledModules, filteredNavStructure, isActiveNav(), isRestaurant, mobileMenuOpen (+19 more)

### Community 30 - "dashboard/OrderDetailView.vue"
Cohesion: 0.08
Nodes (23): apiRecordPayment(), accessStore, availableActions, canAssignRider, canCancel, cancelReason, cancelReasonOptions, handlePaymentConfirm() (+15 more)

### Community 31 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+19 more)

### Community 32 - "stores/store.ts"
Cohesion: 0.14
Nodes (23): checkMpesaStatus(), getCategories(), getProducts(), getStore(), initiateMpesa(), MpesaCodeResponse, MpesaInitResponse, MpesaStatusResponse (+15 more)

### Community 33 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 34 - "Progress"
Cohesion: 0.08
Nodes (25): 1. Prerequisites, 2. Install dependencies, 3. Set up Cloudflare resources, 4. Run migrations, 5. Configure environment, 6. Start development, 7. Deploy, Apps (+17 more)

### Community 35 - "parseAppTimestamp"
Cohesion: 0.11
Nodes (24): getStoreBillingHistory(), StoreBillingHistory, loading, props, records, badgeClass, label, props (+16 more)

### Community 36 - "dashboard/LiveMap.vue"
Cohesion: 0.11
Nodes (9): icon(), LeafletMap, LeafletMarker, LeafletPolyline, mapEl, mapReady, props, recenter() (+1 more)

### Community 37 - "api/orders.ts"
Cohesion: 0.16
Nodes (21): apiAssignRider(), apiGetOrder(), apiGetOrders(), apiGetPackingSlip(), apiUpdateOrderStatus(), RawOrderDetailResponse, RawOrdersResponse, RawPackingSlipResponse (+13 more)

### Community 38 - "views/OnboardingView.vue"
Cohesion: 0.09
Nodes (20): apiCompleteOnboarding(), nextStep(), authStore, canProceed, currentStep, deliveryConfig, isComplete, nextStep() (+12 more)

### Community 39 - "stores/pos.ts"
Cohesion: 0.21
Nodes (22): apiCloseTill(), apiCreatePosSale(), apiGetCurrentTill(), apiGetPosReport(), apiGetPosSale(), apiGetPosSales(), apiGetTillHistory(), apiOpenTill() (+14 more)

### Community 40 - "BillingView.vue"
Cohesion: 0.05
Nodes (50): apiCreateInvoice(), apiGetArAging(), apiGetInvoice(), apiGetInvoices(), apiIssueCreditNote(), apiRecordInvoicePayment(), apiRequestWriteOff(), apiSendInvoice() (+42 more)

### Community 41 - "LocationSearch.vue"
Cohesion: 0.11
Nodes (19): close(), confirmedAddress, googleMode, GooglePrediction, googleResults, highlighted, inputRef, loading (+11 more)

### Community 42 - "constants.ts"
Cohesion: 0.12
Nodes (16): ACCESS_PRESETS, AccessPermissionKey, ALL_STORE_MODULE_KEYS, APP_CONSTANTS, CATEGORY_ICON_PRESETS, CURRENCY_SYMBOLS, NAIROBI_CENTER, ORDER_STATUSES (+8 more)

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
Cohesion: 0.29
Nodes (13): apiGetStoreSettings(), apiGetSubscription(), apiGetTenant(), apiUpdateStoreSettings(), apiUpdateTenant(), OnboardingPayload, OnboardingProductRow, TenantUpdate (+5 more)

### Community 51 - "api/analytics.ts"
Cohesion: 0.23
Nodes (18): AnalyticsParams, apiGetAnalyticsSummary(), apiGetEmployeePerformance(), apiGetFinancialPerformance(), apiGetPaymentMethods(), apiGetPeakHours(), apiGetRevenueChart(), apiGetTopProducts() (+10 more)

### Community 52 - "SubscriptionsView.vue"
Cohesion: 0.10
Nodes (17): apiGetBillingHistory(), apiSubmitMpesaReference(), accessStore, canSubmitReference, history, loading, monthlyAmount, mpesaReference (+9 more)

### Community 53 - "ApiResponse"
Cohesion: 0.24
Nodes (10): apiApproveRequest(), apiGetApprovals(), apiRejectRequest(), useApprovalsStore, ACTION_ICON, approvalsStore, notes, ApiResponse (+2 more)

### Community 54 - "generateId"
Cohesion: 0.10
Nodes (31): fib(), handleCron(), maybeSendReminder(), runDailyAnalyticsSnapshot(), runSubscriptionReminders(), snapshotTenantDay(), generateId(), generateTrackingCode() (+23 more)

### Community 55 - "ExpensesView.vue"
Cohesion: 0.12
Nodes (18): dateRangeDisplay, accessStore, canSubmit, closeExpenseDialog(), { confirm }, expenseCategoryOptions, expensesStore, form (+10 more)

### Community 56 - "dashboard/OrderCard.vue"
Cohesion: 0.12
Nodes (16): availableActions, emit, handleStatusChange(), itemsSummary, paymentMethodLabel, props, statusActions, timeAgo (+8 more)

### Community 57 - "CheckoutView.vue"
Cohesion: 0.11
Nodes (13): props, steps, { t }, cart, cartStore, checkout, deliveryFeeLabel, isConfirmation (+5 more)

### Community 58 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, chart.js, @heroicons/vue, @qesuite/shared, @qesuite/styles, @qesuite/types, @qesuite/ui, vue (+11 more)

### Community 59 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, bun-types, fake-indexeddb, postcss, tailwindcss, typescript, vite (+13 more)

### Community 60 - "delivery/OrderDetailView.vue"
Cohesion: 0.12
Nodes (13): actionLoading, assignment, assignmentId, googleMapsUrl, navTarget(), ordersStore, osmUrl, route (+5 more)

### Community 61 - "syncEngine.ts"
Cohesion: 0.15
Nodes (17): reportReachable(), reportUnreachable(), notifyOutboxChanged(), onOutboxChanged(), authedFetch(), doSyncCycle(), initSyncEngine(), isSyncing (+9 more)

### Community 62 - "routes/storefront.ts"
Cohesion: 0.21
Nodes (17): handleQueue(), logNotification(), NotificationMessage, processNotification(), b64(), enc, escapeHtml(), renderOwnerAlertEmail() (+9 more)

### Community 63 - "localPos.ts"
Cohesion: 0.21
Nodes (9): offlineDb, generateReceiptCode(), LocalSaleCartItem, LocalSaleInput, LocalSaleOutcome, ringSaleOffline(), voidSaleOffline(), uuid7() (+1 more)

### Community 64 - "ProductFormModal.vue"
Cohesion: 0.12
Nodes (26): apiBulkImportProducts(), apiCreateProduct(), apiDeleteProduct(), apiGetProduct(), apiGetProducts(), apiGetUploadUrl(), apiUpdateProduct(), categories (+18 more)

### Community 65 - "SubscriptionWall.vue"
Cohesion: 0.13
Nodes (14): apiInitiateMpesaPayment(), activePlan, authStore, isExpired, logout(), mpesaPhone, mpesaSuccess, payError (+6 more)

### Community 66 - "StockManagementView.vue"
Cohesion: 0.08
Nodes (24): accessStore, activeTab, adjustStock(), canEditStock, countDrafts, filteredProducts, lowStockCount, lowStockThreshold() (+16 more)

### Community 67 - "LoginView.vue"
Cohesion: 0.14
Nodes (9): auth, error, identifier, ownerPassword, resolving, router, selectingTenantId, step (+1 more)

### Community 68 - "routes/invoices.ts"
Cohesion: 0.16
Nodes (10): buildDocumentPdf(), hexToRgb(), money(), PdfDocumentInput, PdfLineItem, DOCUMENT_TITLES, INVOICE_NUMBER_PREFIX, InvoiceBody (+2 more)

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

### Community 73 - "routes/auth.ts"
Cohesion: 0.16
Nodes (15): generateOTP(), deriveKey(), enc, fromHex(), hashPassword(), hashToken(), toHex(), verifyPassword() (+7 more)

### Community 74 - "MpesaManualEntry.vue"
Cohesion: 0.08
Nodes (24): checkout, errors, handleNext(), onPhoneInput(), phoneValid, { t }, validateName(), validatePhone() (+16 more)

### Community 75 - "views/HomeView.vue"
Cohesion: 0.14
Nodes (10): address, phone, slug, store, storeName, whatsappNumber, whatsappUrl, activeCategory (+2 more)

### Community 76 - "deploy.sh"
Cohesion: 0.26
Nodes (13): abort(), BUILD_STATUS, DEPLOY_STATUS, fail(), hr(), info(), ok(), print_summary() (+5 more)

### Community 77 - "Pharmacy compliance features: P1–P5"
Cohesion: 0.15
Nodes (12): Confirmed against real code (not just investigation notes), Context, Critical files, Cross-cutting decisions (made, not left open), Overall cadence, Pharmacy compliance features: P1–P5, Phase 0 — Unblock POS for pharmacy tenants (no migration), Phase 1 — P1: Prescription record + dispensing log (+4 more)

### Community 78 - "ProductsView.vue"
Cohesion: 0.09
Nodes (20): accessStore, canManageProducts, categoriesStore, categoryFilterOptions, { confirm }, editingProduct, featuredCount, handleCsvImport() (+12 more)

### Community 79 - "HeroBanner.vue"
Cohesion: 0.17
Nodes (12): deliveryEnabled, distanceLabel, estimatedMinutes, hasOwnerBanner, haversineKm(), heroImage, loading, logoUrl (+4 more)

### Community 80 - "app/src/api/index.ts"
Cohesion: 0.09
Nodes (32): apiFetchBlob(), apiUpload(), clearTokens(), doRefresh(), getRoleFromToken(), labelForRequest(), refreshAccessToken(), setTokens() (+24 more)

### Community 82 - "routes/access.ts"
Cohesion: 0.16
Nodes (14): AccessRule, accessRules, enforceAccessPolicy(), normalizePermissions(), ownerOnly(), PermissionKey, requirePermissions(), rulesByMethod (+6 more)

### Community 83 - "validatePhone"
Cohesion: 0.21
Nodes (9): validatePhone(), displayValue, emit, focused, inputRef, onInput(), props, showError (+1 more)

### Community 84 - "Areas requiring refinement"
Cohesion: 0.10
Nodes (20): 10. End-to-end financial control, 1. Tax-ready receipts and invoices, 2. Payment collection and reconciliation, 3. Profit, cash-flow, and performance reporting, 4. Customer credit and receivables control, 5. Accurate stock costing and valuation, 6. Expiry and low-stock workflows, 7. Controlled access and complete accountability (+12 more)

### Community 85 - "stores/categories.ts"
Cohesion: 0.42
Nodes (9): apiCreateCategory(), apiDeleteCategory(), apiGetCategories(), apiReorderCategories(), apiUpdateCategory(), useCategoriesStore, Category, CategoryCreate (+1 more)

### Community 86 - "capability.ts"
Cohesion: 0.22
Nodes (11): TillForm, canProceed(), Capability, capabilityForPaymentMethod(), capabilityMessage(), PAYMENT_METHOD_CAPABILITY, isReachable, handleCharge() (+3 more)

### Community 87 - "DeliveryStep.vue"
Cohesion: 0.05
Nodes (39): cart, cartStore, deliveryFeeDisplay, slug, storefrontStore, addressError, cart, cartStore (+31 more)

### Community 88 - "ui/package.json"
Cohesion: 0.18
Nodes (10): dependencies, @qesuite/shared, @qesuite/shared, vue, main, name, peerDependencies, vue (+2 more)

### Community 89 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, preview, test, type-check

### Community 90 - "AdminLayout.vue"
Cohesion: 0.20
Nodes (7): auth, bottomNavItems, navItems, route, router, sidebarOpen, userInitial

### Community 91 - "useToast"
Cohesion: 0.17
Nodes (16): apiCreateExpense(), apiDeleteExpense(), apiGetExpenses(), apiGetExpenseSummary(), ExpenseSummary, RawExpensesListResponse, { toasts, remove }, useAdminAction() (+8 more)

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

### Community 97 - "VerifyView.vue"
Cohesion: 0.20
Nodes (8): auth, route, router, selectError, selecting, storeChoices, verifyError, verifying

### Community 98 - "PackingSlipModal.vue"
Cohesion: 0.25
Nodes (5): emit, loading, ordersStore, props, text

### Community 99 - "SuppliersView.vue"
Cohesion: 0.18
Nodes (12): accessStore, cancelForm(), editingId, filteredSuppliers, form, openAddForm(), resetForm(), saveSupplier() (+4 more)

### Community 100 - "app/src/router/index.ts"
Cohesion: 0.18
Nodes (8): app, i18n, router, adminEmail, adminPassword, auth, error, router

### Community 101 - "worker-api/src/index.ts"
Cohesion: 0.09
Nodes (26): ALLOWED_ORIGINS, app, auditEntry, requireModule(), admin, ApprovalRequestRow, approvals, billing (+18 more)

### Community 102 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, @qesuite/types, @qesuite/types, main, name, types, version

### Community 103 - "delivery/HomeView.vue"
Cohesion: 0.20
Nodes (6): label, props, auth, geo, ordersStore, router

### Community 104 - "API Load and Stress Test Report"
Cohesion: 0.22
Nodes (8): API Load and Stress Test Report, Cloudflare Workers + D1 expectation, Executive result, Interpretation, Measured results, Recommended next tests, Reproducibility, Workload simulated

### Community 105 - "CategoryTabs.vue"
Cohesion: 0.32
Nodes (6): emit, props, scrollContainer, scrollToActive(), selectCategory(), tabRefs

### Community 106 - "ColorPicker.vue"
Cohesion: 0.67
Nodes (3): emit, handleHexInput(), props

### Community 107 - "useRealtime"
Cohesion: 0.33
Nodes (4): RealtimeStatus, useRealtime(), connect(), scheduleReconnect()

### Community 108 - "loadAll"
Cohesion: 0.43
Nodes (7): buildQs(), fetchChart(), fetchKpis(), fetchRecentOrders(), fetchStatus(), fetchTopProducts(), loadAll()

### Community 109 - "pointsFor"
Cohesion: 0.38
Nodes (7): chartY(), chartZeroY, expenseLinePath, linePath(), pointsFor(), salesLinePath, varianceLinePath

### Community 110 - "AcceptInviteView.vue"
Cohesion: 0.18
Nodes (11): apiAcceptInvitation(), InvitationPreview, accept(), accepted, confirmPassword, error, invitation, loading (+3 more)

### Community 111 - "ConfirmModal.vue"
Cohesion: 0.40
Nodes (5): confirmBlocked, confirmInput, emit, handleConfirm(), props

### Community 112 - "app/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

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

### Community 117 - "VoidSaleModal.vue"
Cohesion: 0.33
Nodes (6): emit, handleVoid(), posStore, props, reason, voiding

### Community 118 - "AssignRiderModal.vue"
Cohesion: 0.18
Nodes (10): assigning, emit, handleAssign(), loading, ordersStore, props, riders, selectedRiderId (+2 more)

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

### Community 124 - "delivery/OrderCard.vue"
Cohesion: 0.33
Nodes (5): AssignedOrder, badgeClass, props, statusLabel, AssignmentWithDistance

### Community 125 - "LoadingSpinner.vue"
Cohesion: 0.50
Nodes (3): heightClass, props, sizeClass

### Community 127 - "deviceIdentity.ts"
Cohesion: 0.31
Nodes (8): api, AES_ALGO, decryptCredential(), DeviceSessionResponse, encryptCredential(), ensureDeviceRegistered(), getValidDeviceCredential(), storeSession()

### Community 128 - "db.ts"
Cohesion: 0.14
Nodes (12): CustomerCacheRecord, DeviceMetaRecord, LocalSaleItem, LocalSaleRecord, OfflineDatabase, OutboxEntityType, OutboxMutationRecord, OutboxState (+4 more)

### Community 129 - "Pagination.vue"
Cohesion: 0.40
Nodes (4): endItem, pageNumbers, props, startItem

### Community 132 - "recentActivity"
Cohesion: 0.67
Nodes (3): recentActivity, statusLabel(), timeAgo()

### Community 136 - "DeliveryConfigStep.vue"
Cohesion: 0.38
Nodes (6): addRider(), emit, form, removeRider(), riderPhone, riderPhones

### Community 137 - "deliveryOrders.ts"
Cohesion: 0.43
Nodes (6): getMyOrders(), pingLocation(), updateAssignmentStatus(), updateStatus(), haversineKm(), useOrdersStore

### Community 141 - "storefront/src/composables/useToast.ts"
Cohesion: 0.18
Nodes (10): isDark, prefersDark, storedTheme, { toasts, dismiss }, dismiss(), show(), Toast, toasts (+2 more)

### Community 142 - "PosTill.vue"
Cohesion: 0.08
Nodes (31): apiCreateCustomer(), apiGetCustomer(), apiGetCustomers(), apiUpdateCustomer(), CustomerInput, availableCredit, customerResults, customerSearch (+23 more)

### Community 143 - "useGeolocation"
Cohesion: 0.60
Nodes (4): useGeolocation(), onError(), onSuccess(), start()

### Community 153 - "stores/suppliers.ts"
Cohesion: 0.50
Nodes (7): apiCreateSupplier(), apiDeactivateSupplier(), apiGetSuppliers(), apiUpdateSupplier(), SupplierInput, useSuppliersStore, Supplier

### Community 154 - "ConfirmationStep.vue"
Cohesion: 0.14
Nodes (8): cart, checkout, copied, order, slug, store, displayPhone, props

### Community 155 - "app/src/App.vue"
Cohesion: 0.20
Nodes (9): { state: confirm }, { toasts, removeToast }, ConfirmState, state, useConfirm(), confirm(), confirmDelete(), confirmDelete() (+1 more)

### Community 156 - "stores/stock.ts"
Cohesion: 0.41
Nodes (10): apiCloseStockTake(), apiGetStockMovements(), apiGetStockTakeSession(), apiGetStockTakeSessions(), apiOpenStockTake(), apiRecordStockTakeCounts(), apiRequestStockAdjustment(), useStockStore (+2 more)

### Community 157 - "storeFontStack"
Cohesion: 0.40
Nodes (5): fontOptions, fontOptions, applyPreview(), fontOptions, storeFontStack()

### Community 158 - "ModulesTab.vue"
Cohesion: 0.25
Nodes (7): updateStoreModules(), { loading: saving, run }, pending, props, stores, toggle(), STORE_MODULES

### Community 161 - "emit"
Cohesion: 0.29
Nodes (7): clear(), emit, onInput(), search(), selectGoogle(), useAsTyped(), fetch()

### Community 165 - "trackOrder"
Cohesion: 0.50
Nodes (4): trackOrder(), fetchTrackData(), manualRefresh(), submitTrackLookup()

## Knowledge Gaps
- **1376 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+1371 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `router` connect `app/src/router/index.ts` to `SalesTerminalView.vue`, `DashboardView.vue`, `OrdersView.vue`, `AnalyticsView.vue`, `StoreDetailView.vue`, `stores/auth.ts`, `PosTill.vue`, `SettingsView.vue`, `NotificationsView.vue`, `PlatformBillingView.vue`, `DeliveryTeamView.vue`, `StoresView.vue`, `PurchaseOrdersView.vue`, `DashboardLayout.vue`, `dashboard/OrderDetailView.vue`, `views/OnboardingView.vue`, `BillingView.vue`, `CategoriesView.vue`, `SubscriptionsView.vue`, `ApiResponse`, `ExpensesView.vue`, `delivery/OrderDetailView.vue`, `syncEngine.ts`, `StockManagementView.vue`, `LoginView.vue`, `RegisterView.vue`, `MetricsView.vue`, `ProductsView.vue`, `AdminLayout.vue`, `VerifyView.vue`, `SuppliersView.vue`, `delivery/HomeView.vue`, `AcceptInviteView.vue`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `DashboardView.vue`, `OrdersView.vue`, `stores/auth.ts`, `NotificationsView.vue`, `DeliveryTeamView.vue`, `dashboard/OrderDetailView.vue`, `api/orders.ts`, `views/OnboardingView.vue`, `stores/pos.ts`, `api/settings.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `ProductFormModal.vue`, `SubscriptionWall.vue`, `RegisterView.vue`, `app/src/api/index.ts`, `stores/categories.ts`, `useToast`, `AcceptInviteView.vue`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CatalogShareModal.vue`, `SalesTerminalView.vue`, `PosTill.vue`, `SettingsView.vue`, `UsersAccessPanel.vue`, `PlatformBillingView.vue`, `stores/suppliers.ts`, `DeliveryTeamView.vue`, `app/src/App.vue`, `stores/stock.ts`, `PurchaseOrdersView.vue`, `api/orders.ts`, `views/OnboardingView.vue`, `stores/pos.ts`, `BillingView.vue`, `layouts/OnboardingView.vue`, `api/settings.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `ApiResponse`, `ExpensesView.vue`, `ProductFormModal.vue`, `StockManagementView.vue`, `app/src/api/index.ts`, `stores/categories.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useToast()` (e.g. with `removeToast()` and `showToast()`) actually correct?**
  _`useToast()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `useAccessStore` (e.g. with `reset()` and `createInvitation()`) actually correct?**
  _`useAccessStore` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useAuthStore` (e.g. with `getAccessToken()` and `logout()`) actually correct?**
  _`useAuthStore` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _1376 weakly-connected nodes found - possible documentation gaps or missing edges._