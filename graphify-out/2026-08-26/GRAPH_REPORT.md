# Graph Report - store  (2026-08-26)

## Corpus Check
- 272 files · ~1,031,803 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2666 nodes · 4757 edges · 160 communities (142 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c0a8230`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CatalogShareModal.vue
- SalesTerminalView.vue
- dependencies
- QeDatePicker.vue
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
- app/src/router/index.ts
- ProductFormModal.vue
- useCart
- LocationSearch.vue
- stores/pos.ts
- StorefrontLayout.vue
- OrderSuccessView.vue
- overrides
- worker-api/package.json
- views/OnboardingView.vue
- CategoriesView.vue
- StorefrontHeader.vue
- jwt.ts
- api/analytics.ts
- SubscriptionsView.vue
- layouts/OnboardingView.vue
- routes/pos.ts
- ExpensesView.vue
- dashboard/OrderCard.vue
- CheckoutView.vue
- dependencies
- devDependencies
- delivery/OrderDetailView.vue
- ContactStep.vue
- routes/storefront.ts
- api/settings.ts
- StoreIdentityStep.vue
- SubscriptionWall.vue
- StockManagementView.vue
- DeliveryStep.vue
- routes/access.ts
- compilerOptions
- RegisterView.vue
- MetricsView.vue
- ImageUpload.vue
- LoginView.vue
- ConfirmationStep.vue
- views/HomeView.vue
- deploy.sh
- worker-api/src/index.ts
- ProductsView.vue
- HeroBanner.vue
- app/src/api/index.ts
- api/purchaseOrders.ts
- MpesaManualEntry.vue
- routes/orders.ts
- Areas requiring refinement
- stores/categories.ts
- useToast
- useCart.ts
- ui/package.json
- app/package.json
- storefront/src/composables/useToast.ts
- VerifyView.vue
- compilerOptions
- CLAUDE.md
- ResetPasswordModal.vue
- PaymentReferenceModal.vue
- compilerOptions
- AcceptInviteView.vue
- PackingSlipModal.vue
- SuppliersView.vue
- CategoryTabs.vue
- invoices.ts
- shared/package.json
- cron.ts
- API Load and Stress Test Report
- DeliveryConfigStep.vue
- VoidSaleModal.vue
- useRealtime
- loadAll
- pointsFor
- ui/src/index.ts
- ConfirmModal.vue
- PosTill.vue
- RealTimeIndicator.vue
- useModal.ts
- pctChange
- DataTable.vue
- LeafletMap
- trackOrder
- TrialBanner.vue
- LeafletMarker
- styles/package.json
- types/package.json
- admin/KpiCard.vue
- admin/StatusBadge.vue
- LoadingSpinner.vue
- chart.js
- delivery/HomeView.vue
- useSnapCarousel
- confirmTillAction
- PageHeader.vue
- dashboard/KpiCard.vue
- recentActivity
- app/src/vite-env.d.ts
- storefront/src/vite-env.d.ts
- cashDifferenceLabel
- @qesuite/shared
- @qesuite/styles
- vue
- vue-router
- app/src/shims-vue.d.ts
- paymentChartData
- stores/suppliers.ts
- deliveryOrders.ts
- FailureReasonModal.vue
- storefront/src/shims-vue.d.ts
- app/src/App.vue
- handleCharge
- delivery/OrderCard.vue
- Pagination.vue
- useGeolocation
- subtotal
- confirm

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 90 edges
2. `useToast()` - 40 edges
3. `showToast()` - 36 edges
4. `useAccessStore` - 35 edges
5. `router` - 34 edges
6. `useAuthStore` - 34 edges
7. `Env` - 33 edges
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

## Communities (160 total, 18 thin omitted)

### Community 0 - "CatalogShareModal.vue"
Cohesion: 0.06
Nodes (66): accentColor, allCatalogsSelected, allProductsSelected, canGenerate, canvasToBlob(), CatalogId, catalogLabel(), catalogOptions (+58 more)

### Community 1 - "SalesTerminalView.vue"
Cohesion: 0.03
Nodes (44): accessStore, businessDate, canCharge, cart, cartTotal, cashAdjustmentOpen, cashExpenseCategory, cashMovementAmount (+36 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, @heroicons/vue, pinia, @qesuite/shared, @qesuite/styles, @qesuite/types, @qesuite/ui, vue (+39 more)

### Community 3 - "QeDatePicker.vue"
Cohesion: 0.08
Nodes (41): cells, displayFormatter, displayLabel, emit, monthFormatter, monthLabel, onTriggerClick(), onTriggerKeydown() (+33 more)

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
Cohesion: 0.21
Nodes (13): auditEntry, authMiddleware(), restaurantGuard(), tenantGuard(), ApprovalRequestRow, CATEGORIES, ItemInput, ALLOWED_TYPES (+5 more)

### Community 10 - "AnalyticsView.vue"
Cohesion: 0.06
Nodes (27): DateRange, accessStore, analyticsStore, barOptions, baseChartOptions, cancelChange, customFrom, customTo (+19 more)

### Community 11 - "shared/src/index.ts"
Cohesion: 0.07
Nodes (14): ACCESS_PERMISSION_GROUPS, ACCESS_PRESETS, AccessPermissionKey, APP_CONSTANTS, CATEGORY_ICON_PRESETS, CURRENCY_SYMBOLS, NAIROBI_CENTER, ORDER_STATUSES (+6 more)

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
Cohesion: 0.08
Nodes (26): getStores(), adStyle, enabled, props, activeCategory, categoryFilters, categoryIcon(), categoryLabel() (+18 more)

### Community 16 - "api/admin.ts"
Cohesion: 0.12
Nodes (29): AdminLoginResponse, AdminUser, deleteStore(), extendTrial(), getGMVChart(), getImpersonationToken(), getPlatformMetrics(), getStore() (+21 more)

### Community 17 - "AddressSearch.vue"
Cohesion: 0.08
Nodes (26): api, ApiError, clear(), close(), emit, googleMode, GooglePrediction, googleResults (+18 more)

### Community 18 - "types/src/index.ts"
Cohesion: 0.05
Nodes (43): AnalyticsDaily, ApiError, ApprovalStatus, ArAgingRow, AssignDeliveryRequest, AuditAction, AuditLog, AuthTokens (+35 more)

### Community 19 - "apiFetch"
Cohesion: 0.30
Nodes (17): apiCreateInvitation(), apiGetAccessCatalog(), apiGetCurrentAccess(), apiGetInvitation(), apiGetInvitations(), apiGetMembers(), apiRenewInvitation(), apiRevokeInvitation() (+9 more)

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
Cohesion: 0.06
Nodes (42): apiCreateDeliveryStaff(), apiDeleteDeliveryStaff(), apiGetActiveAssignments(), apiGetDeliveryStaff(), apiSendMagicLink(), apiUpdateDeliveryStaff(), RiderStoreSelectionData, VerifyResponse (+34 more)

### Community 26 - "StoresView.vue"
Cohesion: 0.08
Nodes (17): dayOptions, selected, reason, useDebounce(), debounce(), StoreFilter, { debounce }, deleteTarget (+9 more)

### Community 27 - "components/LiveMap.vue"
Cohesion: 0.15
Nodes (9): destIcon(), initMap(), LeafletPolyline, map(), mapEl, mapReady, props, riderIcon() (+1 more)

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
Cohesion: 0.14
Nodes (22): checkMpesaStatus(), getCategories(), getProducts(), getStore(), initiateMpesa(), MpesaCodeResponse, MpesaInitResponse, MpesaStatusResponse (+14 more)

### Community 33 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+17 more)

### Community 34 - "Progress"
Cohesion: 0.08
Nodes (25): 1. Prerequisites, 2. Install dependencies, 3. Set up Cloudflare resources, 4. Run migrations, 5. Configure environment, 6. Start development, 7. Deploy, Apps (+17 more)

### Community 35 - "parseAppTimestamp"
Cohesion: 0.13
Nodes (21): getStoreBillingHistory(), StoreBillingHistory, loading, props, records, isExpiringSoon(), daysRemaining, previewEnd() (+13 more)

### Community 36 - "dashboard/LiveMap.vue"
Cohesion: 0.11
Nodes (9): icon(), LeafletMap, LeafletMarker, LeafletPolyline, mapEl, mapReady, props, recenter() (+1 more)

### Community 37 - "api/orders.ts"
Cohesion: 0.16
Nodes (21): apiAssignRider(), apiGetOrder(), apiGetOrders(), apiGetPackingSlip(), apiUpdateOrderStatus(), RawOrderDetailResponse, RawOrdersResponse, RawPackingSlipResponse (+13 more)

### Community 38 - "app/src/router/index.ts"
Cohesion: 0.10
Nodes (15): auth, bottomNavItems, navItems, route, router, sidebarOpen, userInitial, app (+7 more)

### Community 39 - "ProductFormModal.vue"
Cohesion: 0.14
Nodes (22): apiBulkImportProducts(), apiCreateProduct(), apiDeleteProduct(), apiGetProduct(), apiGetProducts(), apiGetUploadUrl(), apiUpdateProduct(), categories (+14 more)

### Community 40 - "useCart"
Cohesion: 0.12
Nodes (15): discountPct, displayPrice, { formatPrice, addToCart, increment, decrement, getQuantity }, handleAdd(), imgError, isOutOfStock, props, quantity (+7 more)

### Community 41 - "LocationSearch.vue"
Cohesion: 0.07
Nodes (36): apiApproveRequest(), apiGetApprovals(), apiRejectRequest(), api, clear(), close(), confirmedAddress, emit (+28 more)

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
Cohesion: 0.09
Nodes (21): dependencies, hono, @qesuite/shared, @qesuite/types, devDependencies, @cloudflare/workers-types, typescript, wrangler (+13 more)

### Community 47 - "views/OnboardingView.vue"
Cohesion: 0.09
Nodes (18): authStore, canProceed, currentStep, deliveryConfig, isComplete, nextStep(), prefilling, products (+10 more)

### Community 48 - "CategoriesView.vue"
Cohesion: 0.10
Nodes (14): accessStore, activeCategories, cancelForm(), categoriesStore, CATEGORY_ICON_COMPONENTS, { confirm }, editingId, form (+6 more)

### Community 49 - "StorefrontHeader.vue"
Cohesion: 0.10
Nodes (14): cartStore, config, isDark, { locale }, locationGranted, locationLabel, locationOpen, manualAddress (+6 more)

### Community 50 - "jwt.ts"
Cohesion: 0.12
Nodes (21): generateId(), generateOTP(), generateTrackingCode(), signJWT(), verifyJWT(), deriveKey(), enc, fromHex() (+13 more)

### Community 51 - "api/analytics.ts"
Cohesion: 0.24
Nodes (18): AnalyticsParams, apiGetAnalyticsSummary(), apiGetEmployeePerformance(), apiGetFinancialPerformance(), apiGetPaymentMethods(), apiGetPeakHours(), apiGetRevenueChart(), apiGetTopProducts() (+10 more)

### Community 52 - "SubscriptionsView.vue"
Cohesion: 0.10
Nodes (17): apiGetBillingHistory(), apiSubmitMpesaReference(), accessStore, canSubmitReference, history, loading, monthlyAmount, mpesaReference (+9 more)

### Community 53 - "layouts/OnboardingView.vue"
Cohesion: 0.10
Nodes (19): apiCompleteOnboarding(), authStore, canProceed, currentStep, deliveryConfig, isComplete, nextStep(), prefilling (+11 more)

### Community 54 - "routes/pos.ts"
Cohesion: 0.11
Nodes (14): inclusiveDateRange(), analytics, DateRange, datesBetween(), ExpenseTotalRow, parseDateRange(), SalesSummaryRow, parseDateRange() (+6 more)

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
Nodes (17): dependencies, @heroicons/vue, pinia, @qesuite/types, @qesuite/ui, @supabase/supabase-js, vue-chartjs, vue-i18n (+9 more)

### Community 59 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, postcss, tailwindcss, typescript, vite, vite-plugin-pwa, @vitejs/plugin-vue (+9 more)

### Community 60 - "delivery/OrderDetailView.vue"
Cohesion: 0.12
Nodes (13): actionLoading, assignment, assignmentId, googleMapsUrl, navTarget(), ordersStore, osmUrl, route (+5 more)

### Community 61 - "ContactStep.vue"
Cohesion: 0.15
Nodes (13): checkout, errors, handleNext(), onPhoneInput(), phoneValid, { t }, validateName(), validatePhone() (+5 more)

### Community 62 - "routes/storefront.ts"
Cohesion: 0.27
Nodes (13): handleQueue(), logNotification(), NotificationMessage, processNotification(), getDeliveredSMS(), getNewOrderSMS(), getOrderConfirmedSMS(), getOutForDeliverySMS() (+5 more)

### Community 63 - "api/settings.ts"
Cohesion: 0.24
Nodes (15): apiGetStoreSettings(), apiGetSubscription(), apiGetTenant(), apiUpdateStoreSettings(), apiUpdateTenant(), OnboardingPayload, OnboardingProductRow, TenantUpdate (+7 more)

### Community 64 - "StoreIdentityStep.vue"
Cohesion: 0.12
Nodes (18): apiCheckSlug(), apiGetUploadUrl(), emit, handleHexInput(), props, bannerUploadRef, categories, checkSlug() (+10 more)

### Community 65 - "SubscriptionWall.vue"
Cohesion: 0.13
Nodes (14): apiInitiateMpesaPayment(), activePlan, authStore, isExpired, logout(), mpesaPhone, mpesaSuccess, payError (+6 more)

### Community 66 - "StockManagementView.vue"
Cohesion: 0.08
Nodes (33): apiCloseStockTake(), apiGetStockMovements(), apiGetStockTakeSession(), apiGetStockTakeSessions(), apiOpenStockTake(), apiRecordStockTakeCounts(), apiRequestStockAdjustment(), useStockStore (+25 more)

### Community 67 - "DeliveryStep.vue"
Cohesion: 0.12
Nodes (12): addressError, cart, cartStore, checkout, deliveryEnabled, deliveryFeeDisplay, deliveryFeeLabel, estimatedMinutes (+4 more)

### Community 68 - "routes/access.ts"
Cohesion: 0.16
Nodes (13): hashToken(), AccessRule, accessRules, enforceAccessPolicy(), normalizePermissions(), ownerOnly(), PermissionKey, requirePermissions() (+5 more)

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

### Community 73 - "LoginView.vue"
Cohesion: 0.14
Nodes (9): auth, error, identifier, ownerPassword, resolving, router, selectingTenantId, step (+1 more)

### Community 74 - "ConfirmationStep.vue"
Cohesion: 0.14
Nodes (8): cart, checkout, copied, order, slug, store, displayPhone, props

### Community 75 - "views/HomeView.vue"
Cohesion: 0.14
Nodes (10): address, phone, slug, store, storeName, whatsappNumber, whatsappUrl, activeCategory (+2 more)

### Community 76 - "deploy.sh"
Cohesion: 0.26
Nodes (13): abort(), BUILD_STATUS, DEPLOY_STATUS, fail(), hr(), info(), ok(), print_summary() (+5 more)

### Community 77 - "worker-api/src/index.ts"
Cohesion: 0.08
Nodes (25): ALLOWED_ORIGINS, app, BUSINESS_TIME_ZONE, businessDate(), D1_NAIROBI_MODIFIER, nairobiCompactTimestamp(), approvals, billing (+17 more)

### Community 78 - "ProductsView.vue"
Cohesion: 0.09
Nodes (20): accessStore, canManageProducts, categoriesStore, categoryFilterOptions, { confirm }, editingProduct, featuredCount, handleCsvImport() (+12 more)

### Community 79 - "HeroBanner.vue"
Cohesion: 0.17
Nodes (12): deliveryEnabled, distanceLabel, estimatedMinutes, hasOwnerBanner, haversineKm(), heroImage, loading, logoUrl (+4 more)

### Community 80 - "app/src/api/index.ts"
Cohesion: 0.19
Nodes (15): apiUpload(), clearTokens(), doRefresh(), getRoleFromToken(), labelForRequest(), refreshAccessToken(), setTokens(), { isActive, label } (+7 more)

### Community 81 - "api/purchaseOrders.ts"
Cohesion: 0.29
Nodes (15): apiApprovePurchaseOrder(), apiCancelPurchaseOrder(), apiCreatePurchaseOrder(), apiGetPurchaseOrder(), apiGetPurchaseOrders(), apiReceivePurchaseOrder(), apiRejectPurchaseOrder(), apiSendPurchaseOrder() (+7 more)

### Community 82 - "MpesaManualEntry.vue"
Cohesion: 0.18
Nodes (11): accountRef, cart, checkout, formattedTotal, handleSubmit(), localError, settings, store (+3 more)

### Community 83 - "routes/orders.ts"
Cohesion: 0.15
Nodes (12): orders, OrderStatus, TRANSITIONS, validatePhone(), displayValue, emit, focused, inputRef (+4 more)

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
Cohesion: 0.18
Nodes (12): cart, cartStore, deliveryFeeDisplay, slug, storefrontStore, cart, cartStore, route (+4 more)

### Community 88 - "ui/package.json"
Cohesion: 0.18
Nodes (10): dependencies, @qesuite/shared, @qesuite/shared, vue, main, name, peerDependencies, vue (+2 more)

### Community 89 - "app/package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, preview, type-check, type (+1 more)

### Community 90 - "storefront/src/composables/useToast.ts"
Cohesion: 0.18
Nodes (10): isDark, prefersDark, storedTheme, { toasts, dismiss }, dismiss(), show(), Toast, toasts (+2 more)

### Community 91 - "VerifyView.vue"
Cohesion: 0.20
Nodes (8): auth, route, router, selectError, selecting, storeChoices, verifyError, verifying

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

### Community 97 - "AcceptInviteView.vue"
Cohesion: 0.18
Nodes (11): apiAcceptInvitation(), InvitationPreview, accept(), accepted, confirmPassword, error, invitation, loading (+3 more)

### Community 98 - "PackingSlipModal.vue"
Cohesion: 0.25
Nodes (5): emit, loading, ordersStore, props, text

### Community 99 - "SuppliersView.vue"
Cohesion: 0.18
Nodes (12): accessStore, cancelForm(), editingId, filteredSuppliers, form, openAddForm(), resetForm(), saveSupplier() (+4 more)

### Community 100 - "CategoryTabs.vue"
Cohesion: 0.32
Nodes (6): emit, props, scrollContainer, scrollToActive(), selectCategory(), tabRefs

### Community 101 - "invoices.ts"
Cohesion: 0.22
Nodes (5): nextSequenceNumber(), INVOICE_NUMBER_PREFIX, InvoiceBody, invoices, ItemInput

### Community 102 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, @qesuite/types, @qesuite/types, main, name, types, version

### Community 103 - "cron.ts"
Cohesion: 0.39
Nodes (8): fib(), handleCron(), maybeSendReminder(), runDailyAnalyticsSnapshot(), runSubscriptionReminders(), snapshotTenantDay(), businessDateDaysAgo(), SMS_TEMPLATES

### Community 104 - "API Load and Stress Test Report"
Cohesion: 0.22
Nodes (8): API Load and Stress Test Report, Cloudflare Workers + D1 expectation, Executive result, Interpretation, Measured results, Recommended next tests, Reproducibility, Workload simulated

### Community 105 - "DeliveryConfigStep.vue"
Cohesion: 0.38
Nodes (6): addRider(), emit, form, removeRider(), riderPhone, riderPhones

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

### Community 110 - "ui/src/index.ts"
Cohesion: 0.16
Nodes (12): apiUpdateMe(), authStore, changePassword(), form, initial, passwordAction, passwordForm, profileAction (+4 more)

### Community 111 - "ConfirmModal.vue"
Cohesion: 0.40
Nodes (5): confirmBlocked, confirmInput, emit, handleConfirm(), props

### Community 112 - "PosTill.vue"
Cohesion: 0.40
Nodes (4): emit, form, TillForm, PosPaymentMethod

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
Cohesion: 0.50
Nodes (3): badgeClass, label, props

### Community 125 - "LoadingSpinner.vue"
Cohesion: 0.50
Nodes (3): heightClass, props, sizeClass

### Community 127 - "delivery/HomeView.vue"
Cohesion: 0.20
Nodes (6): label, props, auth, geo, ordersStore, router

### Community 129 - "confirmTillAction"
Cohesion: 0.50
Nodes (4): confirmTillAction(), openOperatingTill(), submitCashMovement(), submitTillClose()

### Community 132 - "recentActivity"
Cohesion: 0.67
Nodes (3): recentActivity, statusLabel(), timeAgo()

### Community 142 - "stores/suppliers.ts"
Cohesion: 0.50
Nodes (7): apiCreateSupplier(), apiDeactivateSupplier(), apiGetSuppliers(), apiUpdateSupplier(), SupplierInput, useSuppliersStore, Supplier

### Community 143 - "deliveryOrders.ts"
Cohesion: 0.43
Nodes (6): getMyOrders(), pingLocation(), updateAssignmentStatus(), updateStatus(), haversineKm(), useOrdersStore

### Community 144 - "FailureReasonModal.vue"
Cohesion: 0.29
Nodes (6): canConfirm, customReason, emit, handleConfirm(), reasons, selected

### Community 153 - "app/src/App.vue"
Cohesion: 0.33
Nodes (5): { state: confirm }, { toasts, removeToast }, ConfirmState, state, useConfirm()

### Community 155 - "delivery/OrderCard.vue"
Cohesion: 0.33
Nodes (5): AssignedOrder, badgeClass, props, statusLabel, AssignmentWithDistance

### Community 156 - "Pagination.vue"
Cohesion: 0.40
Nodes (4): endItem, pageNumbers, props, startItem

### Community 157 - "useGeolocation"
Cohesion: 0.60
Nodes (4): useGeolocation(), onError(), onSuccess(), start()

### Community 159 - "confirm"
Cohesion: 0.50
Nodes (4): confirm(), confirmDelete(), confirmDelete(), confirmDelete()

## Knowledge Gaps
- **1271 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+1266 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `router` connect `app/src/router/index.ts` to `SalesTerminalView.vue`, `DashboardView.vue`, `OrdersView.vue`, `AnalyticsView.vue`, `StoreDetailView.vue`, `SettingsView.vue`, `NotificationsView.vue`, `PlatformBillingView.vue`, `DeliveryTeamView.vue`, `StoresView.vue`, `PurchaseOrdersView.vue`, `DashboardLayout.vue`, `dashboard/OrderDetailView.vue`, `LocationSearch.vue`, `views/OnboardingView.vue`, `CategoriesView.vue`, `SubscriptionsView.vue`, `ExpensesView.vue`, `delivery/OrderDetailView.vue`, `StockManagementView.vue`, `RegisterView.vue`, `MetricsView.vue`, `LoginView.vue`, `ProductsView.vue`, `VerifyView.vue`, `AcceptInviteView.vue`, `SuppliersView.vue`, `ui/src/index.ts`, `delivery/HomeView.vue`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CatalogShareModal.vue`, `SalesTerminalView.vue`, `stores/suppliers.ts`, `SettingsView.vue`, `UsersAccessPanel.vue`, `PlatformBillingView.vue`, `app/src/App.vue`, `DeliveryTeamView.vue`, `api/orders.ts`, `ProductFormModal.vue`, `LocationSearch.vue`, `stores/pos.ts`, `views/OnboardingView.vue`, `api/analytics.ts`, `SubscriptionsView.vue`, `layouts/OnboardingView.vue`, `ExpensesView.vue`, `api/settings.ts`, `StockManagementView.vue`, `api/purchaseOrders.ts`, `stores/categories.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `apiFetch` to `DashboardView.vue`, `OrdersView.vue`, `stores/auth.ts`, `NotificationsView.vue`, `DeliveryTeamView.vue`, `dashboard/OrderDetailView.vue`, `api/orders.ts`, `ProductFormModal.vue`, `stores/pos.ts`, `api/analytics.ts`, `SubscriptionsView.vue`, `layouts/OnboardingView.vue`, `api/settings.ts`, `StoreIdentityStep.vue`, `SubscriptionWall.vue`, `RegisterView.vue`, `app/src/api/index.ts`, `stores/categories.ts`, `useToast`, `AcceptInviteView.vue`, `ui/src/index.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useToast()` (e.g. with `removeToast()` and `showToast()`) actually correct?**
  _`useToast()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `useAccessStore` (e.g. with `reset()` and `createInvitation()`) actually correct?**
  _`useAccessStore` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _1271 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CatalogShareModal.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.061569416498993966 - nodes in this community are weakly interconnected._