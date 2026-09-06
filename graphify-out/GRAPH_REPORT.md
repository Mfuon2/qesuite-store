# Graph Report - store  (2026-09-06)

## Corpus Check
- 308 files · ~968,855 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2936 nodes · 5365 edges · 160 communities (148 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31e99ec8`
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
- ApprovalsView.vue
- routes/pos.ts
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
- jwt.ts
- MpesaManualEntry.vue
- StorefrontFooter.vue
- deploy.sh
- Pharmacy compliance features: P1–P5
- ProductsView.vue
- HeroBanner.vue
- app/src/api/index.ts
- time.ts
- routes/access.ts
- QePhoneInput.vue
- Areas requiring refinement
- stores/categories.ts
- capability.ts
- useCart.ts
- ui/package.json
- scripts
- useToast
- api/expenses.ts
- compilerOptions
- CLAUDE.md
- ResetPasswordModal.vue
- PaymentReferenceModal.vue
- compilerOptions
- DeliveryStep.vue
- PackingSlipModal.vue
- SuppliersView.vue
- app/src/router/index.ts
- worker-api/src/index.ts
- shared/package.json
- delivery/HomeView.vue
- API Load and Stress Test Report
- CategoryTabs.vue
- StoreIdentityStep.vue
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
- metrics.ts
- LoadingSpinner.vue
- EmptyState.vue
- ApiResponse
- db.ts
- confirm
- PageHeader.vue
- dashboard/KpiCard.vue
- recentActivity
- app/src/vite-env.d.ts
- storefront/src/vite-env.d.ts
- @supabase/supabase-js
- DeliveryConfigStep.vue
- api/delivery.ts
- chart.js
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
- ModulesTab.vue
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

## Communities (160 total, 12 thin omitted)

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
Nodes (36): trackOrder(), cart, code, currentStatusDescription, currentStatusIndex, currentStatusTitle, deliveryAddress, error (+28 more)

### Community 9 - "types.ts"
Cohesion: 0.17
Nodes (20): auditEntry, authMiddleware(), deviceSessionMiddleware(), riderMiddleware(), parseDisabledModules(), requireModule(), tenantGuard(), ApprovalRequestRow (+12 more)

### Community 10 - "AnalyticsView.vue"
Cohesion: 0.06
Nodes (28): accessStore, analyticsStore, barOptions, baseChartOptions, cancelChange, customFrom, customTo, doughnutOptions (+20 more)

### Community 11 - "shared/src/index.ts"
Cohesion: 0.07
Nodes (8): analytics, DateRange, datesBetween(), ExpenseTotalRow, parseDateRange(), SalesSummaryRow, addDays(), APP_TIME_ZONE_OFFSET

### Community 12 - "StoreDetailView.vue"
Cohesion: 0.06
Nodes (26): updateStoreProfile(), dayOptions, selected, badgeClass, label, props, reason, activeTab (+18 more)

### Community 13 - "stores/auth.ts"
Cohesion: 0.11
Nodes (32): adminLogin(), apiGetMe(), apiLogin(), apiLogout(), apiRegister(), apiResolveIdentifier(), apiSelectStore(), apiUpdateMe() (+24 more)

### Community 14 - "ProductCatalogStep.vue"
Cohesion: 0.15
Nodes (10): cancelForm(), editingIdx, emit, imageUploading, imageUploadRef, localProducts, newProduct, props (+2 more)

### Community 15 - "MarketplaceView.vue"
Cohesion: 0.08
Nodes (26): getStores(), adStyle, enabled, props, activeCategory, categoryFilters, categoryIcon(), categoryLabel() (+18 more)

### Community 16 - "api/admin.ts"
Cohesion: 0.13
Nodes (25): AdminLoginResponse, AdminUser, deleteStore(), extendTrial(), getImpersonationToken(), getStore(), getStoreBillingHistory(), getStores() (+17 more)

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
Nodes (31): fontOptions, fontOptions, accessStore, activeTab, activeTabMeta, applyPreview(), authStore, bannerRef (+23 more)

### Community 21 - "UsersAccessPanel.vue"
Cohesion: 0.07
Nodes (26): AccessEditor, accessStore, activeCount, closeDraft(), createInvitation(), Draft, draftActive, filteredInvitations (+18 more)

### Community 22 - "NotificationsView.vue"
Cohesion: 0.07
Nodes (21): accessStore, CHANNEL_FILTERS, channelFilter, currentPage, fetchSummary(), limit, loading, Meta (+13 more)

### Community 23 - "cloudflare.d.ts"
Cohesion: 0.07
Nodes (9): D1Database, D1ExecResult, D1PreparedStatement, D1Result, Queue, R2Bucket, R2Object, R2ObjectBody (+1 more)

### Community 24 - "PlatformBillingView.vue"
Cohesion: 0.08
Nodes (27): getPlatformBilling(), PlatformBillingRecord, verifyBillingReference(), endItem, pageNumbers, props, startItem, useDebounce() (+19 more)

### Community 25 - "DeliveryTeamView.vue"
Cohesion: 0.09
Nodes (25): apiCreateDeliveryStaff(), apiGetDeliveryStaff(), apiSendMagicLink(), apiUpdateDeliveryStaff(), accessStore, activeRiders, addingRider, addRider() (+17 more)

### Community 26 - "StoresView.vue"
Cohesion: 0.08
Nodes (22): useAdminAction(), run(), StoreFilter, handleExtend(), handleImpersonate(), handleResetPassword(), handleSuspend(), handleUnsuspend() (+14 more)

### Community 27 - "components/LiveMap.vue"
Cohesion: 0.11
Nodes (12): destIcon(), initMap(), LeafletMap, LeafletMarker, LeafletPolyline, map(), mapEl, mapReady (+4 more)

### Community 28 - "PurchaseOrdersView.vue"
Cohesion: 0.06
Nodes (38): apiApprovePurchaseOrder(), apiCancelPurchaseOrder(), apiCreatePurchaseOrder(), apiGetPurchaseOrder(), apiGetPurchaseOrders(), apiReceivePurchaseOrder(), apiRejectPurchaseOrder(), apiSendPurchaseOrder() (+30 more)

### Community 29 - "DashboardLayout.vue"
Cohesion: 0.08
Nodes (26): accessStore, authStore, currentPageTitle, disabledModules, filteredNavStructure, isActiveNav(), mobileMenuOpen, moduleEnabled() (+18 more)

### Community 30 - "dashboard/OrderDetailView.vue"
Cohesion: 0.08
Nodes (23): apiRecordPayment(), accessStore, availableActions, canAssignRider, canCancel, cancelReason, cancelReasonOptions, handlePaymentConfirm() (+15 more)

### Community 31 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+19 more)

### Community 32 - "stores/store.ts"
Cohesion: 0.13
Nodes (24): checkMpesaStatus(), getCategories(), getProducts(), getStore(), initiateMpesa(), MpesaCodeResponse, MpesaInitResponse, MpesaStatusResponse (+16 more)

### Community 33 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 34 - "Progress"
Cohesion: 0.08
Nodes (25): 1. Prerequisites, 2. Install dependencies, 3. Set up Cloudflare resources, 4. Run migrations, 5. Configure environment, 6. Start development, 7. Deploy, Apps (+17 more)

### Community 35 - "parseAppTimestamp"
Cohesion: 0.19
Nodes (16): isExpiringSoon(), daysRemaining, previewEnd(), trialDaysLeft, daysSinceActive, formatDate(), formatDateTime(), formatTime() (+8 more)

### Community 36 - "dashboard/LiveMap.vue"
Cohesion: 0.11
Nodes (9): icon(), LeafletMap, LeafletMarker, LeafletPolyline, mapEl, mapReady, props, recenter() (+1 more)

### Community 37 - "api/orders.ts"
Cohesion: 0.16
Nodes (21): apiAssignRider(), apiGetOrder(), apiGetOrders(), apiGetPackingSlip(), apiUpdateOrderStatus(), RawOrderDetailResponse, RawOrdersResponse, RawPackingSlipResponse (+13 more)

### Community 38 - "views/OnboardingView.vue"
Cohesion: 0.10
Nodes (17): authStore, canProceed, currentStep, deliveryConfig, isComplete, prefilling, products, progressPct (+9 more)

### Community 39 - "stores/pos.ts"
Cohesion: 0.21
Nodes (22): apiCloseTill(), apiCreatePosSale(), apiGetCurrentTill(), apiGetPosReport(), apiGetPosSale(), apiGetPosSales(), apiGetTillHistory(), apiOpenTill() (+14 more)

### Community 40 - "BillingView.vue"
Cohesion: 0.05
Nodes (50): apiCreateInvoice(), apiGetArAging(), apiGetInvoice(), apiGetInvoices(), apiIssueCreditNote(), apiRecordInvoicePayment(), apiRequestWriteOff(), apiSendInvoice() (+42 more)

### Community 41 - "LocationSearch.vue"
Cohesion: 0.09
Nodes (26): clear(), close(), confirmedAddress, emit, googleMode, GooglePrediction, googleResults, highlighted (+18 more)

### Community 42 - "constants.ts"
Cohesion: 0.12
Nodes (16): ACCESS_PRESETS, AccessPermissionKey, ALL_STORE_MODULE_KEYS, APP_CONSTANTS, CATEGORY_ICON_PRESETS, CURRENCY_SYMBOLS, NAIROBI_CENTER, ORDER_STATUSES (+8 more)

### Community 43 - "StorefrontLayout.vue"
Cohesion: 0.10
Nodes (17): dismissed, status, store, visible, applySEO(), cartStore, goToMarketplace(), redirectCountdown (+9 more)

### Community 44 - "OrderSuccessView.vue"
Cohesion: 0.08
Nodes (17): app, i18n, router, activeCategory, productsSection, store, isRoot, route (+9 more)

### Community 45 - "overrides"
Cohesion: 0.09
Nodes (22): devDependencies, typescript, typescript, name, overrides, brace-expansion, fast-uri, nanoid (+14 more)

### Community 46 - "worker-api/package.json"
Cohesion: 0.08
Nodes (23): dependencies, hono, pdf-lib, @qesuite/shared, @qesuite/types, devDependencies, @cloudflare/workers-types, typescript (+15 more)

### Community 47 - "layouts/OnboardingView.vue"
Cohesion: 0.09
Nodes (20): apiCompleteOnboarding(), authStore, canProceed, currentStep, deliveryConfig, isComplete, nextStep(), prefilling (+12 more)

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
Cohesion: 0.21
Nodes (19): AnalyticsParams, apiGetAnalyticsSummary(), apiGetEmployeePerformance(), apiGetFinancialPerformance(), apiGetPaymentMethods(), apiGetPeakHours(), apiGetRevenueChart(), apiGetTopProducts() (+11 more)

### Community 52 - "SubscriptionsView.vue"
Cohesion: 0.10
Nodes (17): apiGetBillingHistory(), apiSubmitMpesaReference(), accessStore, canSubmitReference, history, loading, monthlyAmount, mpesaReference (+9 more)

### Community 53 - "ApprovalsView.vue"
Cohesion: 0.24
Nodes (10): apiApproveRequest(), apiGetApprovals(), apiRejectRequest(), api, useApprovalsStore, ACTION_ICON, approvalsStore, notes (+2 more)

### Community 54 - "routes/pos.ts"
Cohesion: 0.12
Nodes (25): generateId(), buildCreditBookingStatements(), buildVoidStatements(), OpenTill, PosPaymentMethod, PosSaleInput, PosSaleOutcome, PosSplitLeg (+17 more)

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
Nodes (19): dependencies, dexie, @heroicons/vue, @qesuite/shared, @qesuite/styles, @qesuite/types, @qesuite/ui, vue (+11 more)

### Community 59 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, bun-types, fake-indexeddb, postcss, tailwindcss, typescript, vite (+13 more)

### Community 60 - "delivery/OrderDetailView.vue"
Cohesion: 0.12
Nodes (13): actionLoading, assignment, assignmentId, googleMapsUrl, navTarget(), ordersStore, osmUrl, route (+5 more)

### Community 61 - "syncEngine.ts"
Cohesion: 0.21
Nodes (12): ensureDeviceRegistered(), onOutboxChanged(), doSyncCycle(), initSyncEngine(), isSyncing, lastSyncAttemptAt, lastSyncError, lastSyncSuccessAt (+4 more)

### Community 62 - "routes/storefront.ts"
Cohesion: 0.17
Nodes (19): handleQueue(), logNotification(), NotificationMessage, processNotification(), b64(), enc, escapeHtml(), renderOwnerAlertEmail() (+11 more)

### Community 63 - "localPos.ts"
Cohesion: 0.16
Nodes (10): offlineDb, generateReceiptCode(), LocalSaleCartItem, LocalSaleInput, LocalSaleOutcome, ringSaleOffline(), voidSaleOffline(), notifyOutboxChanged() (+2 more)

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
Cohesion: 0.12
Nodes (15): useSnapCarousel(), barChartOptions, baseChartOptions, donutData, donutOptions, formatMoney(), gmvChartData, growthChartData (+7 more)

### Community 72 - "ImageUpload.vue"
Cohesion: 0.19
Nodes (12): emit, fileInput, handleChange(), handleDrop(), isDragging, preview, processFile(), progress (+4 more)

### Community 73 - "jwt.ts"
Cohesion: 0.13
Nodes (20): generateOTP(), generateTrackingCode(), signJWT(), verifyJWT(), deriveKey(), enc, fromHex(), hashPassword() (+12 more)

### Community 74 - "MpesaManualEntry.vue"
Cohesion: 0.08
Nodes (24): checkout, errors, handleNext(), onPhoneInput(), phoneValid, { t }, validateName(), validatePhone() (+16 more)

### Community 75 - "StorefrontFooter.vue"
Cohesion: 0.25
Nodes (7): address, phone, slug, store, storeName, whatsappNumber, whatsappUrl

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
Cohesion: 0.18
Nodes (18): apiFetchBlob(), apiUpload(), clearTokens(), doRefresh(), getAccessToken(), getRoleFromToken(), labelForRequest(), refreshAccessToken() (+10 more)

### Community 81 - "time.ts"
Cohesion: 0.12
Nodes (21): fib(), handleCron(), maybeSendReminder(), runDailyAnalyticsSnapshot(), runSubscriptionReminders(), snapshotTenantDay(), BUSINESS_TIME_ZONE, businessDate() (+13 more)

### Community 82 - "routes/access.ts"
Cohesion: 0.16
Nodes (14): AccessRule, accessRules, enforceAccessPolicy(), normalizePermissions(), ownerOnly(), PermissionKey, requirePermissions(), rulesByMethod (+6 more)

### Community 83 - "QePhoneInput.vue"
Cohesion: 0.20
Nodes (8): displayValue, emit, focused, inputRef, onInput(), props, showError, touched

### Community 84 - "Areas requiring refinement"
Cohesion: 0.10
Nodes (20): 10. End-to-end financial control, 1. Tax-ready receipts and invoices, 2. Payment collection and reconciliation, 3. Profit, cash-flow, and performance reporting, 4. Customer credit and receivables control, 5. Accurate stock costing and valuation, 6. Expiry and low-stock workflows, 7. Controlled access and complete accountability (+12 more)

### Community 85 - "stores/categories.ts"
Cohesion: 0.42
Nodes (9): apiCreateCategory(), apiDeleteCategory(), apiGetCategories(), apiReorderCategories(), apiUpdateCategory(), useCategoriesStore, Category, CategoryCreate (+1 more)

### Community 86 - "capability.ts"
Cohesion: 0.18
Nodes (16): TillForm, canProceed(), Capability, capabilityForPaymentMethod(), capabilityMessage(), PAYMENT_METHOD_CAPABILITY, isReachable, reportReachable() (+8 more)

### Community 87 - "useCart.ts"
Cohesion: 0.08
Nodes (27): cart, cartStore, deliveryFeeDisplay, slug, storefrontStore, discountPct, displayPrice, { formatPrice, addToCart, increment, decrement, getQuantity } (+19 more)

### Community 88 - "ui/package.json"
Cohesion: 0.18
Nodes (10): dependencies, @qesuite/shared, @qesuite/shared, vue, main, name, peerDependencies, vue (+2 more)

### Community 89 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, preview, test, type-check

### Community 90 - "useToast"
Cohesion: 0.14
Nodes (16): { toasts, remove }, copyMessage(), copyInvite(), saveMember(), useDocumentPdf(), openPdf(), removeToast(), showToast() (+8 more)

### Community 91 - "api/expenses.ts"
Cohesion: 0.40
Nodes (9): apiCreateExpense(), apiDeleteExpense(), apiGetExpenses(), apiGetExpenseSummary(), ExpenseSummary, RawExpensesListResponse, useExpensesStore, Expense (+1 more)

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

### Community 97 - "DeliveryStep.vue"
Cohesion: 0.12
Nodes (12): addressError, cart, cartStore, checkout, deliveryEnabled, deliveryFeeDisplay, deliveryFeeLabel, estimatedMinutes (+4 more)

### Community 98 - "PackingSlipModal.vue"
Cohesion: 0.25
Nodes (5): emit, loading, ordersStore, props, text

### Community 99 - "SuppliersView.vue"
Cohesion: 0.18
Nodes (12): accessStore, cancelForm(), editingId, filteredSuppliers, form, openAddForm(), resetForm(), saveSupplier() (+4 more)

### Community 100 - "app/src/router/index.ts"
Cohesion: 0.07
Nodes (23): auth, bottomNavItems, navItems, route, router, sidebarOpen, userInitial, app (+15 more)

### Community 101 - "worker-api/src/index.ts"
Cohesion: 0.09
Nodes (19): ALLOWED_ORIGINS, app, billing, categories, customers, delivery, notifications, onboarding (+11 more)

### Community 102 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, @qesuite/types, @qesuite/types, main, name, types, version

### Community 103 - "delivery/HomeView.vue"
Cohesion: 0.14
Nodes (9): label, props, badgeClass, props, statusLabel, auth, geo, ordersStore (+1 more)

### Community 104 - "API Load and Stress Test Report"
Cohesion: 0.22
Nodes (8): API Load and Stress Test Report, Cloudflare Workers + D1 expectation, Executive result, Interpretation, Measured results, Recommended next tests, Reproducibility, Workload simulated

### Community 105 - "CategoryTabs.vue"
Cohesion: 0.32
Nodes (6): emit, props, scrollContainer, scrollToActive(), selectCategory(), tabRefs

### Community 106 - "StoreIdentityStep.vue"
Cohesion: 0.13
Nodes (16): apiCheckSlug(), emit, handleHexInput(), props, bannerUploadRef, categories, checkSlug(), form (+8 more)

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

### Community 124 - "metrics.ts"
Cohesion: 0.31
Nodes (8): getGMVChart(), getPlatformMetrics(), getStoreGrowthChart(), ChartDataPoint, PlatformMetrics, StatusBreakdown, StoreGrowthPoint, useMetricsStore

### Community 125 - "LoadingSpinner.vue"
Cohesion: 0.50
Nodes (3): heightClass, props, sizeClass

### Community 126 - "EmptyState.vue"
Cohesion: 0.33
Nodes (5): iconPath, ICONS, iconSizeClass, props, sizeClass

### Community 127 - "ApiResponse"
Cohesion: 0.32
Nodes (7): AES_ALGO, decryptCredential(), DeviceSessionResponse, encryptCredential(), getValidDeviceCredential(), storeSession(), ApiResponse

### Community 128 - "db.ts"
Cohesion: 0.14
Nodes (12): CustomerCacheRecord, DeviceMetaRecord, LocalSaleItem, LocalSaleRecord, OfflineDatabase, OutboxEntityType, OutboxMutationRecord, OutboxState (+4 more)

### Community 129 - "confirm"
Cohesion: 0.50
Nodes (4): confirm(), confirmDelete(), confirmDelete(), confirmDelete()

### Community 132 - "recentActivity"
Cohesion: 0.67
Nodes (3): recentActivity, statusLabel(), timeAgo()

### Community 136 - "DeliveryConfigStep.vue"
Cohesion: 0.38
Nodes (6): addRider(), emit, form, removeRider(), riderPhone, riderPhones

### Community 137 - "api/delivery.ts"
Cohesion: 0.19
Nodes (14): apiDeleteDeliveryStaff(), apiGetActiveAssignments(), AssignedOrder, getMyOrders(), pingLocation(), RiderStoreSelectionData, updateAssignmentStatus(), VerifyResponse (+6 more)

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
Cohesion: 0.33
Nodes (5): { state: confirm }, { toasts, removeToast }, ConfirmState, state, useConfirm()

### Community 156 - "stores/stock.ts"
Cohesion: 0.41
Nodes (10): apiCloseStockTake(), apiGetStockMovements(), apiGetStockTakeSession(), apiGetStockTakeSessions(), apiOpenStockTake(), apiRecordStockTakeCounts(), apiRequestStockAdjustment(), useStockStore (+2 more)

### Community 158 - "ModulesTab.vue"
Cohesion: 0.25
Nodes (7): updateStoreModules(), { loading: saving, run }, pending, props, stores, toggle(), STORE_MODULES

## Knowledge Gaps
- **1375 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+1370 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `router` connect `app/src/router/index.ts` to `SalesTerminalView.vue`, `DashboardView.vue`, `OrdersView.vue`, `AnalyticsView.vue`, `StoreDetailView.vue`, `stores/auth.ts`, `PosTill.vue`, `SettingsView.vue`, `NotificationsView.vue`, `PlatformBillingView.vue`, `DeliveryTeamView.vue`, `StoresView.vue`, `PurchaseOrdersView.vue`, `DashboardLayout.vue`, `dashboard/OrderDetailView.vue`, `views/OnboardingView.vue`, `BillingView.vue`, `CategoriesView.vue`, `SubscriptionsView.vue`, `ApprovalsView.vue`, `ExpensesView.vue`, `delivery/OrderDetailView.vue`, `syncEngine.ts`, `StockManagementView.vue`, `LoginView.vue`, `RegisterView.vue`, `MetricsView.vue`, `ProductsView.vue`, `SuppliersView.vue`, `delivery/HomeView.vue`, `AcceptInviteView.vue`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CatalogShareModal.vue`, `SalesTerminalView.vue`, `PosTill.vue`, `SettingsView.vue`, `UsersAccessPanel.vue`, `PlatformBillingView.vue`, `stores/suppliers.ts`, `StoresView.vue`, `app/src/App.vue`, `stores/stock.ts`, `PurchaseOrdersView.vue`, `DeliveryTeamView.vue`, `api/orders.ts`, `views/OnboardingView.vue`, `stores/pos.ts`, `BillingView.vue`, `layouts/OnboardingView.vue`, `api/settings.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `ApprovalsView.vue`, `ExpensesView.vue`, `ProductFormModal.vue`, `StockManagementView.vue`, `stores/categories.ts`, `api/expenses.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `DashboardView.vue`, `OrdersView.vue`, `api/delivery.ts`, `stores/auth.ts`, `NotificationsView.vue`, `DeliveryTeamView.vue`, `dashboard/OrderDetailView.vue`, `api/orders.ts`, `stores/pos.ts`, `layouts/OnboardingView.vue`, `api/settings.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `ProductFormModal.vue`, `SubscriptionWall.vue`, `RegisterView.vue`, `app/src/api/index.ts`, `stores/categories.ts`, `api/expenses.ts`, `StoreIdentityStep.vue`, `AcceptInviteView.vue`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useToast()` (e.g. with `removeToast()` and `showToast()`) actually correct?**
  _`useToast()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `useAccessStore` (e.g. with `reset()` and `createInvitation()`) actually correct?**
  _`useAccessStore` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `useAuthStore` (e.g. with `getAccessToken()` and `logout()`) actually correct?**
  _`useAuthStore` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _1375 weakly-connected nodes found - possible documentation gaps or missing edges._