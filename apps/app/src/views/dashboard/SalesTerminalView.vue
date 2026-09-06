<template>
  <div class="owner-page">
    <section class="owner-page-hero flex items-center justify-between gap-2 !rounded-2xl !p-3 sm:gap-4 sm:!rounded-[24px] sm:!p-4">
      <div class="owner-page-header min-w-0 sm:flex-1">
        <div class="min-w-0">
          <h1 class="owner-title !mt-0 !text-lg sm:!text-2xl">POS</h1>
          <p class="owner-subtitle hidden !mt-1 !text-sm !leading-6 sm:block">
            Ring up walk-in and dine-in sales, then track revenue against expenses.
          </p>
        </div>
      </div>

      <div class="owner-segmented shrink-0 !rounded-xl !p-0.5 sm:!rounded-2xl sm:!p-1" aria-label="POS tabs">
        <button
          v-for="t in visibleTabs"
          :key="t.key"
          @click="tab = t.key"
          :class="[
            'owner-segment-button !h-8 !min-w-0 !rounded-lg !px-3 !text-xs sm:!h-9 sm:!min-w-9 sm:!rounded-xl sm:!text-sm',
            tab === t.key ? 'owner-segment-button-active' : ''
          ]"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <!-- ─── Terminal ─────────────────────────────────────────────────── -->
    <div v-if="tab === 'terminal'" class="mt-3 sm:mt-5">
      <button
        v-if="posStore.till && accessStore.can('pos.manage_till')"
        type="button"
        class="mb-2 flex w-full items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left lg:hidden"
        @click="openCashManager"
      >
        <BanknotesIcon class="h-4 w-4 shrink-0 text-emerald-700" />
        <span class="min-w-0 flex-1 text-[11px] font-bold text-emerald-800">
          Expected in till <strong class="ml-1 text-xs font-black">KES {{ expectedTillFloat.toLocaleString() }}</strong>
        </span>
        <span class="text-[10px] font-extrabold text-emerald-700">Manage</span>
      </button>
      <div class="min-w-0 lg:pr-[360px]">
        <div class="owner-filter-bar mb-2.5">
          <button
            @click="selectedCategoryId = ''"
            :class="['owner-filter-pill', selectedCategoryId === '' ? 'owner-filter-pill-active' : '']"
          >
            All
          </button>
          <button
            v-for="cat in categoryTabs"
            :key="cat.id"
            @click="selectedCategoryId = cat.id"
            :class="['owner-filter-pill', selectedCategoryId === cat.id ? 'owner-filter-pill-active' : '']"
          >
            {{ cat.name }}
          </button>
        </div>

        <div v-if="posStore.loading" class="grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
          <div v-for="i in 20" :key="i" class="skeleton aspect-square rounded-xl" />
        </div>

        <div v-else-if="!filteredProducts.length" class="owner-empty">
          <CubeIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p class="text-base font-bold text-slate-800">No menu items</p>
          <p class="mt-1 text-sm text-slate-500">Add products in the Products page to sell them here.</p>
        </div>

        <div v-else class="grid grid-cols-4 gap-1.5 pb-20 sm:grid-cols-5 lg:grid-cols-4 lg:pb-0 xl:grid-cols-5">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            @click="addToCart(product)"
            :disabled="product.stock < 1"
            :class="[
              'owner-card group relative overflow-hidden p-0 text-left transition disabled:cursor-not-allowed disabled:opacity-40',
              cartQty(product.id) ? 'ring-2 ring-primary' : ''
            ]"
          >
            <div class="relative aspect-square bg-slate-50">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center">
                <CubeIcon class="h-6 w-6 text-slate-300" />
              </div>

              <span
                v-if="product.sale_price"
                class="absolute left-1 top-1 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-black leading-none text-white"
              >
                -{{ discountPct(product) }}%
              </span>
              <span
                v-if="product.stock < 5"
                class="absolute right-1 top-1 rounded-full bg-orange-100 px-1 py-0.5 text-[9px] font-black leading-none text-orange-700"
              >
                {{ product.stock }}
              </span>
              <span
                v-if="cartQty(product.id)"
                class="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg"
              >
                {{ cartQty(product.id) }}
              </span>
            </div>
            <div class="p-1.5">
              <p class="truncate text-[11px] font-bold leading-tight text-slate-950">{{ product.name }}</p>
              <div class="mt-0.5 flex flex-wrap items-baseline gap-1">
                <p class="text-xs font-black text-primary">{{ unitPrice(product).toLocaleString() }}</p>
                <p v-if="product.sale_price" class="text-[10px] font-medium text-slate-400 line-through">
                  {{ product.price.toLocaleString() }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Desktop: fixed floating till, with matching space reserved beside products. -->
      <PosTill
        v-model:form="tillForm"
        :cart="cart"
        :subtotal="subtotal"
        :cart-total="cartTotal"
        :change-due="changeDue"
        :can-charge="canCharge"
        :charging="charging"
        :opening-float="posStore.till?.opening_float ?? null"
        :running-float="posStore.till ? expectedTillFloat : null"
        :can-manage-till="accessStore.can('pos.manage_till')"
        class="hidden h-fit lg:fixed lg:right-8 lg:top-[13rem] lg:z-30 lg:flex lg:max-h-[calc(100vh-14rem)] lg:w-[340px] lg:shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        @increment="increment"
        @decrement="decrement"
        @remove="removeLine"
        @clear="resetTill"
        @charge="handleCharge"
        @manage-cash="openCashManager"
      />
    </div>

    <!-- ─── History ──────────────────────────────────────────────────── -->
    <div v-else-if="tab === 'history'" class="mt-5">
      <section v-if="posStore.tillHistory.length" class="owner-panel mb-3 overflow-hidden">
        <div class="owner-panel-header !py-2.5">
          <div>
            <h3 class="text-xs font-extrabold text-slate-950">Till history</h3>
            <p class="text-[10px] font-medium text-slate-500">Cash at the start, cash at closing, and any difference</p>
          </div>
        </div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="session in posStore.tillHistory"
            :key="session.id"
            class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[1.2fr_repeat(3,auto)]"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="truncate text-xs font-bold text-slate-900">{{ session.business_date }}</p>
                <span :class="['rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase', session.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                  {{ session.status }}
                </span>
              </div>
              <p class="text-[10px] font-medium text-slate-400">{{ session.movement_count }} cash changes</p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-bold uppercase text-slate-400">Opening</p>
              <p class="text-[11px] font-black text-slate-800">KES {{ session.opening_float.toLocaleString() }}</p>
            </div>
            <div class="hidden text-right sm:block">
              <p class="text-[9px] font-bold uppercase text-slate-400">{{ session.status === 'open' ? 'Expected now' : 'Expected at close' }}</p>
              <p class="text-[11px] font-black text-slate-800">KES {{ (session.status === 'open' ? session.running_float : session.expected_cash ?? 0).toLocaleString() }}</p>
            </div>
            <div v-if="session.status === 'closed'" class="col-span-2 flex items-center justify-end gap-1 text-[10px] sm:col-span-1 sm:block sm:text-right">
              <p class="font-bold uppercase text-slate-400">Difference</p>
              <p :class="['font-black', session.variance === 0 ? 'text-emerald-700' : (session.variance ?? 0) > 0 ? 'text-sky-700' : 'text-red-600']">
                {{ cashDifferenceLabel(session.variance ?? 0) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div v-if="posStore.loading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="skeleton h-16 rounded-2xl" />
      </div>

      <div v-else-if="!mergedSales.length" class="owner-empty">
        <ReceiptPercentIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No sales yet</p>
        <p class="mt-1 text-sm text-slate-500">Sales you ring up in POS will show up here.</p>
      </div>

      <div v-else class="owner-panel p-2">
        <div class="space-y-2">
          <div v-for="sale in mergedSales" :key="sale.id" class="owner-list-row flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-slate-950">
                #{{ sale.receipt_code }}
                <span v-if="sale.table_label" class="text-slate-400 font-medium">· {{ sale.table_label }}</span>
              </p>
              <p class="truncate text-xs font-medium text-slate-500">{{ sale.items_summary || '—' }}</p>
            </div>
            <div class="hidden shrink-0 text-xs font-medium text-slate-400 sm:block">{{ formatTime(sale.created_at) }}</div>
            <span
              v-if="sale.isPendingSync"
              class="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black uppercase text-amber-700"
              title="Saved on this device — hasn't reached the server yet"
            >
              Pending sync
            </span>
            <span
              :class="[
                'shrink-0 rounded-full px-2 py-1 text-[11px] font-black uppercase',
                PAYMENT_METHOD_BADGE_CLASS[sale.payment_method as keyof typeof PAYMENT_METHOD_BADGE_CLASS] ?? 'bg-sky-100 text-sky-700'
              ]"
            >
              {{ sale.payment_method }}
            </span>
            <span
              v-if="sale.status === 'voided'"
              class="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-black uppercase text-red-600"
            >
              Voided
            </span>
            <p class="w-24 shrink-0 text-right text-sm font-black text-slate-950">KES {{ sale.total.toLocaleString() }}</p>
            <button
              v-if="!sale.isPendingSync"
              :disabled="pdf.opening.value"
              @click="pdf.openPdf(`/api/pos/${sale.id}/receipt`)"
              class="owner-action-icon"
              title="Download receipt"
            >
              <ArrowDownTrayIcon class="h-4 w-4" />
            </button>
            <button
              v-if="!sale.isPendingSync && sale.status === 'completed' && accessStore.can('pos.void_sale')"
              @click="voidTarget = sale as unknown as PosSale"
              class="owner-action-icon hover:bg-red-50 hover:text-red-500"
              title="Void sale"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Reports ──────────────────────────────────────────────────── -->
    <div v-else class="mt-5">
      <div class="owner-segmented mb-4 self-start" aria-label="Report period">
        <button
          v-for="p in periods"
          :key="p.key"
          @click="period = p.key"
          :class="['owner-segment-button', period === p.key ? 'owner-segment-button-active' : '']"
        >
          {{ p.label }}
        </button>
      </div>

      <div v-if="posStore.loading" class="scrollbar-hide -mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
        <div v-for="i in 4" :key="i" class="skeleton h-20 w-[82vw] max-w-[19rem] shrink-0 rounded-2xl sm:h-24 sm:w-auto sm:max-w-none" />
      </div>

      <template v-else-if="posStore.report">
        <section>
          <div
            ref="reportCardScroller"
            class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4"
            role="region"
            aria-label="Sales and profit summary"
            @scroll.passive="updateActiveReportCard"
          >
          <div class="owner-stat-card w-[82vw] max-w-[19rem] shrink-0 snap-center !p-3 sm:w-auto sm:max-w-none sm:!p-4">
            <div class="owner-stat-icon"><BanknotesIcon class="h-5 w-5" /></div>
            <div>
              <p class="text-sm font-bold text-slate-950">KES {{ posStore.report.revenue.toLocaleString() }}</p>
              <p class="text-xs font-medium text-slate-500">Sales income</p>
            </div>
          </div>
          <div class="owner-stat-card w-[82vw] max-w-[19rem] shrink-0 snap-center !p-3 sm:w-auto sm:max-w-none sm:!p-4">
            <div class="owner-stat-icon bg-orange-50 text-orange-700 ring-orange-100"><ReceiptRefundIcon class="h-5 w-5" /></div>
            <div>
              <p class="text-sm font-bold text-slate-950">KES {{ expenseTotal.toLocaleString() }}</p>
              <p class="text-xs font-medium text-slate-500">Expenses</p>
            </div>
          </div>
          <div class="owner-stat-card w-[82vw] max-w-[19rem] shrink-0 snap-center !p-3 sm:w-auto sm:max-w-none sm:!p-4">
            <div :class="['owner-stat-icon', netTotal >= 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-red-50 text-red-600 ring-red-100']"><ChartBarIcon class="h-5 w-5" /></div>
            <div>
              <p :class="['text-sm font-bold', netTotal >= 0 ? 'text-emerald-700' : 'text-red-600']">KES {{ netTotal.toLocaleString() }}</p>
              <p class="text-xs font-medium text-slate-500">Estimated {{ netTotal >= 0 ? 'profit' : 'loss' }}</p>
            </div>
          </div>
          <div class="owner-stat-card w-[82vw] max-w-[19rem] shrink-0 snap-center !p-3 sm:w-auto sm:max-w-none sm:!p-4">
            <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100"><ShoppingCartIcon class="h-5 w-5" /></div>
            <div>
              <p class="text-sm font-bold text-slate-950">{{ posStore.report.sale_count }}</p>
              <p class="text-xs font-medium text-slate-500">Sales{{ posStore.report.voided_count ? ` (${posStore.report.voided_count} voided)` : '' }}</p>
            </div>
          </div>
          </div>
          <div class="mt-2 flex items-center justify-center gap-1.5 sm:hidden" aria-label="Report summary pages">
            <button
              v-for="i in 4"
              :key="i"
              type="button"
              :class="['h-1.5 rounded-full transition-all duration-200', activeReportCard === i - 1 ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300']"
              :aria-label="`Show report summary ${i} of 4`"
              :aria-current="activeReportCard === i - 1 ? 'true' : undefined"
              @click="scrollToReportCard(i - 1)"
            />
          </div>
        </section>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <section class="owner-panel overflow-hidden">
            <div class="owner-panel-header !py-2.5">
              <div>
                <h3 class="text-sm font-extrabold text-slate-950">Profit and loss</h3>
                <p class="text-[10px] font-medium text-slate-500">{{ posStore.report.date_from }} to {{ posStore.report.date_to }}</p>
              </div>
            </div>
            <div class="space-y-2 p-3">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-600">Sales income</span>
                <span class="font-black text-emerald-700">KES {{ posStore.report.revenue.toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-600">Less business expenses</span>
                <span class="font-black text-red-600">− KES {{ posStore.report.expenses.toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                <span class="font-black text-slate-950">Estimated {{ netTotal >= 0 ? 'profit' : 'loss' }}</span>
                <span :class="['font-black', netTotal >= 0 ? 'text-emerald-700' : 'text-red-600']">
                  KES {{ Math.abs(netTotal).toLocaleString() }}
                </span>
              </div>
              <p class="rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] leading-4 text-amber-900">
                This estimate is sales minus the expenses you recorded. Add every ingredient, supply, wage, rent, utility, and other business cost for a more accurate result.
              </p>
            </div>
          </section>

          <section class="owner-panel overflow-hidden">
            <div class="owner-panel-header !py-2.5">
              <div>
                <h3 class="text-sm font-extrabold text-slate-950">Where the money was spent</h3>
                <p class="text-[10px] font-medium text-slate-500">{{ posStore.report.expense_count }} recorded expense{{ posStore.report.expense_count === 1 ? '' : 's' }}</p>
              </div>
            </div>
            <div v-if="posStore.report.expenses_by_category.length" class="space-y-1.5 p-3">
              <div v-for="item in posStore.report.expenses_by_category" :key="item.category" class="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                <span class="text-xs font-bold text-slate-700">{{ expenseCategoryLabel(item.category) }}</span>
                <span class="text-xs font-black text-slate-950">KES {{ item.total.toLocaleString() }}</span>
              </div>
            </div>
            <p v-else class="p-5 text-center text-xs text-slate-400">No expenses recorded for this period.</p>
          </section>
        </div>

        <section class="owner-panel mt-4">
          <div class="owner-panel-header">
            <h3 class="text-sm font-extrabold text-slate-950">By payment method</h3>
          </div>
          <div class="space-y-2 p-3">
            <div
              v-for="m in posStore.report.by_payment_method"
              :key="m.payment_method"
              class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            >
              <span class="text-sm font-bold capitalize text-slate-800">{{ m.payment_method }}</span>
              <span class="text-sm font-medium text-slate-500">{{ m.sale_count }} sales</span>
              <span class="text-sm font-black text-slate-950">KES {{ m.revenue.toLocaleString() }}</span>
            </div>
            <p v-if="!posStore.report.by_payment_method.length" class="py-4 text-center text-sm text-slate-400">No sales in this period.</p>
          </div>
        </section>

        <section class="owner-panel mt-4">
          <div class="owner-panel-header">
            <h3 class="text-sm font-extrabold text-slate-950">Top selling items</h3>
          </div>
          <div class="space-y-2 p-3">
            <div
              v-for="item in posStore.report.top_items"
              :key="item.product_name"
              class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            >
              <span class="truncate text-sm font-bold text-slate-800">{{ item.product_name }}</span>
              <span class="text-sm font-medium text-slate-500">{{ item.total_quantity }} sold</span>
              <span class="text-sm font-black text-slate-950">KES {{ item.total_revenue.toLocaleString() }}</span>
            </div>
            <p v-if="!posStore.report.top_items.length" class="py-4 text-center text-sm text-slate-400">No items sold in this period.</p>
          </div>
        </section>
      </template>
    </div>

    <Teleport to="body">
      <!-- Mobile: floating "view till" button — fixed so it stays visible while browsing the menu, not just once scrolled to the bottom -->
      <button
        v-if="tab === 'terminal' && cart.length && !mobileTillOpen"
        @click="mobileTillOpen = true"
        class="fixed inset-x-4 z-30 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-white shadow-[0_12px_30px_rgba(15,23,42,0.3)] lg:hidden"
        style="bottom: calc(4rem + env(safe-area-inset-bottom, 0px))"
      >
        <span class="flex items-center gap-2 text-sm font-bold">
          <ShoppingCartIcon class="h-5 w-5" />
          {{ cart.length }} item{{ cart.length === 1 ? '' : 's' }}
        </span>
        <span class="text-sm font-black">View till · KES {{ cartTotal.toLocaleString() }}</span>
      </button>

      <!-- Mobile: till as a bottom sheet -->
      <div
        v-if="mobileTillOpen"
        class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm lg:hidden"
        @click.self="mobileTillOpen = false"
      >
        <div class="max-h-[85vh] w-full overflow-hidden rounded-t-[28px] pb-safe shadow-2xl animate-bounce-in">
          <PosTill
            v-model:form="tillForm"
            :cart="cart"
            :subtotal="subtotal"
            :cart-total="cartTotal"
            :change-due="changeDue"
            :can-charge="canCharge"
            :charging="charging"
            :opening-float="posStore.till?.opening_float ?? null"
            :running-float="posStore.till ? expectedTillFloat : null"
            :can-manage-till="accessStore.can('pos.manage_till')"
            class="!rounded-t-[28px] !rounded-b-none max-h-[85vh]"
            @increment="increment"
            @decrement="decrement"
            @remove="removeLine"
            @clear="resetTill"
            @charge="handleCharge"
            @manage-cash="openCashManager"
          >
            <template #header-extra>
              <button @click="mobileTillOpen = false" class="text-slate-400 hover:text-slate-600">
                <XMarkIcon class="h-4 w-4" />
              </button>
            </template>
          </PosTill>
        </div>
      </div>

      <!-- Every sale must belong to an explicitly opened operating till. -->
      <div
        v-if="tab === 'terminal' && posStore.tillLoaded && !posStore.till && accessStore.can('pos.manage_till')"
        class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      >
        <form class="owner-panel w-full max-w-sm overflow-hidden shadow-2xl" @submit.prevent="requestOpenOperatingTill">
          <div class="border-b border-slate-100 px-4 py-3">
            <div class="flex items-center gap-2">
              <div class="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <BanknotesIcon class="h-4 w-4" />
              </div>
              <div>
                <h2 class="text-sm font-black text-slate-950">Open POS till</h2>
                <p class="text-[11px] font-medium text-slate-500">{{ businessDate }}</p>
              </div>
            </div>
          </div>
          <div class="space-y-3 p-4">
            <div>
              <label for="opening-float" class="mb-1 block text-xs font-bold text-slate-700">Cash in the till at the start (KES)</label>
              <input
                id="opening-float"
                v-model.number="openingFloat"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                autofocus
                class="owner-input h-10 w-full text-sm font-bold"
                placeholder="e.g. 5,000"
              />
              <p class="mt-1.5 text-[11px] leading-4 text-slate-500">
                Count the cash already in the till. Cash sales and refunds will be added or removed automatically.
              </p>
            </div>
            <button
              type="submit"
              :disabled="!validOpeningFloat || posStore.tillSaving"
              class="owner-primary-action w-full justify-center py-2.5"
            >
              <span v-if="posStore.tillSaving">Opening…</span>
              <span v-else>Open till · KES {{ (openingFloat ?? 0).toLocaleString() }}</span>
            </button>
          </div>
        </form>
      </div>

      <div
        v-if="manageCashOpen && posStore.till"
        class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm"
        @click.self="closeCashManager"
      >
        <div class="owner-panel flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden shadow-2xl sm:max-w-xl lg:max-w-2xl">
          <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 class="text-sm font-black text-slate-950">
                {{ closeTillMode ? 'Close till' : cashAdjustmentOpen ? 'Adjust till cash' : 'Till cash' }}
              </h2>
              <p class="text-[11px] font-medium text-slate-500">Opened {{ formatTime(posStore.till.opened_at) }}</p>
            </div>
            <button class="owner-action-icon" type="button" @click="closeCashManager">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div class="grid grid-cols-2 gap-2 sm:gap-3">
              <div class="rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Cash at start</p>
                <p class="mt-0.5 text-sm font-black text-slate-950">KES {{ posStore.till.opening_float.toLocaleString() }}</p>
              </div>
              <div class="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100 sm:px-4 sm:py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Expected in till</p>
                <p class="mt-0.5 text-sm font-black text-emerald-800">KES {{ expectedTillFloat.toLocaleString() }}</p>
              </div>
            </div>

            <template v-if="!closeTillMode">
              <form v-if="cashAdjustmentOpen" class="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3" @submit.prevent="requestCashMovement">
                <p class="rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-medium leading-4 text-sky-800">
                  Cash sales and refunds update automatically. Use these options only when cash changes outside a sale.
                </p>
                <div class="owner-segmented !grid w-full grid-cols-3 !rounded-xl !p-0.5" aria-label="How did the cash change?">
                  <button
                    v-for="movement in movementOptions"
                    :key="movement.key"
                    type="button"
                    :class="['owner-segment-button w-full min-w-0 whitespace-nowrap !h-8 !rounded-lg !px-2 !text-[11px]', cashMovementType === movement.key ? 'owner-segment-button-active' : '']"
                    @click="cashMovementType = movement.key"
                  >
                    {{ movement.label }}
                  </button>
                </div>
                <p class="rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-4 text-slate-600">
                  {{ currentMovementOption.help }}
                </p>
                <div class="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-bold text-slate-600">{{ currentMovementOption.amountLabel }}</span>
                    <input
                      v-model.number="cashMovementAmount"
                      type="number"
                      inputmode="numeric"
                      :min="cashMovementType === 'correction' ? 0 : 1"
                      step="1"
                      class="owner-input h-9 w-full text-xs font-bold"
                      :placeholder="currentMovementOption.amountExample"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-bold text-slate-600">Why?</span>
                    <input
                      v-model="cashMovementReason"
                      type="text"
                      maxlength="300"
                      class="owner-input h-9 w-full text-xs"
                      :placeholder="currentMovementOption.reasonExample"
                    />
                  </label>
                </div>
                <div v-if="cashMovementType === 'paid_out'" class="rounded-xl border border-slate-200 p-2.5">
                  <label class="flex cursor-pointer items-start gap-2">
                    <input v-model="saveCashOutAsExpense" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    <span>
                      <span class="block text-[11px] font-extrabold text-slate-800">Also save this as a business expense</span>
                      <span class="mt-0.5 block text-[10px] leading-4 text-slate-500">
                        Turn this on for supplies, wages, repairs, or bills. Leave it off for a bank deposit, owner withdrawal, or cash transfer.
                      </span>
                    </span>
                  </label>
                  <label v-if="saveCashOutAsExpense" class="mt-2 block border-t border-slate-100 pt-2">
                    <span class="mb-1 block text-[10px] font-bold text-slate-600">What was the expense for?</span>
                    <QeSelect v-model="cashExpenseCategory" size="sm" :options="expenseCategoryOptions" />
                  </label>
                </div>
                <button
                  type="submit"
                  :disabled="!validCashMovement || posStore.tillSaving"
                  class="owner-primary-action w-full justify-center py-2"
                >
                  {{ posStore.tillSaving ? 'Saving…' : currentMovementOption.action }}
                </button>
              </form>

              <div class="mt-4 border-t border-slate-100 pt-3">
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-xs font-extrabold text-slate-800">Recent cash activity</h3>
                  <span class="text-[10px] font-bold text-slate-400">{{ posStore.till.movement_count }} changes</span>
                </div>
                <div v-if="posStore.till.recent_movements?.length" class="space-y-1">
                  <div
                    v-for="movement in posStore.till.recent_movements"
                    :key="movement.id"
                    class="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-[11px] font-bold text-slate-800">{{ movementLabel(movement.movement_type) }}</p>
                      <p class="truncate text-[10px] text-slate-500">{{ movement.reason }} · {{ formatTime(movement.created_at) }}</p>
                    </div>
                    <p :class="['shrink-0 text-xs font-black', movement.amount >= 0 ? 'text-emerald-700' : 'text-red-600']">
                      {{ movement.amount >= 0 ? '+' : '−' }} KES {{ Math.abs(movement.amount).toLocaleString() }}
                    </p>
                  </div>
                </div>
                <p v-else class="rounded-lg bg-slate-50 py-3 text-center text-[11px] text-slate-400">No cash changes yet.</p>
              </div>
            </template>

            <form v-else class="mt-4 space-y-3" @submit.prevent="requestTillClose">
              <div v-if="posStore.till.credit_sales?.length" class="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p class="text-[11px] font-extrabold uppercase tracking-wide text-rose-800">
                  KES {{ (posStore.till.credit_sales_total ?? 0).toLocaleString() }} given out on credit this session
                </p>
                <p class="mt-0.5 text-[11px] leading-4 text-rose-900">This didn't go into the till and isn't part of the cash count below — it's owed by these customers instead.</p>
                <ul class="mt-2 space-y-1">
                  <li v-for="sale in posStore.till.credit_sales" :key="sale.id" class="flex items-center justify-between text-[11px] font-semibold text-rose-900">
                    <span class="truncate">{{ sale.customer_name }} &middot; {{ sale.receipt_code }}</span>
                    <span class="shrink-0">KES {{ sale.total.toLocaleString() }}</span>
                  </li>
                </ul>
                <RouterLink :to="{ path: '/billing', query: { tab: 'ar' } }" class="mt-2 inline-block text-[11px] font-extrabold text-primary">
                  Go settle outstanding credit in Billing &rarr;
                </RouterLink>
              </div>
              <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-4 text-amber-900">
                Count all the cash in the till and enter it below. The app currently expects KES {{ expectedTillFloat.toLocaleString() }}.
              </div>
              <div>
                <label for="counted-cash" class="mb-1 block text-xs font-bold text-slate-700">Cash you counted (KES)</label>
                <input
                  id="counted-cash"
                  v-model.number="countedCash"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  step="1"
                  class="owner-input h-10 w-full text-sm font-bold"
                />
              </div>
              <div v-if="validCountedCash" class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span class="font-semibold text-slate-500">Difference</span>
                <span :class="['font-black', tillVariance === 0 ? 'text-emerald-700' : tillVariance > 0 ? 'text-sky-700' : 'text-red-600']">
                  {{ cashDifferenceLabel(tillVariance) }}
                </span>
              </div>
              <button
                type="submit"
                :disabled="!validCountedCash || posStore.tillSaving"
                class="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                {{ posStore.tillSaving ? 'Closing…' : 'Review and close till' }}
              </button>
            </form>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 sm:px-5 sm:py-3">
            <button v-if="closeTillMode" type="button" class="text-xs font-bold text-slate-500" @click="closeTillMode = false">Back to till</button>
            <span v-else class="text-[10px] font-medium text-slate-400">Need to reconcile before closing?</span>
            <div v-if="!closeTillMode" class="ml-auto flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-600 transition hover:border-primary/30 hover:text-primary"
                @click="cashAdjustmentOpen = !cashAdjustmentOpen"
              >
                {{ cashAdjustmentOpen ? 'Hide adjustments' : 'Adjust cash' }}
              </button>
              <button type="button" class="rounded-lg px-2 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-50" @click="beginTillClose">
                Close till
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Every till-changing action requires a deliberate confirmation. -->
      <div
        v-if="tillConfirmation"
        class="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        @click.self="cancelTillConfirmation"
      >
        <div class="owner-panel w-full max-w-sm overflow-hidden shadow-2xl">
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="text-sm font-black text-slate-950">{{ tillConfirmation.title }}</h2>
            <p class="mt-1 text-xs leading-5 text-slate-500">{{ tillConfirmation.message }}</p>
          </div>
          <div class="flex items-center gap-2 px-5 py-4">
            <button
              type="button"
              class="owner-secondary-action flex-1 justify-center"
              :disabled="posStore.tillSaving"
              @click="cancelTillConfirmation"
            >
              Go back
            </button>
            <button
              type="button"
              :class="[
                'flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-extrabold text-white transition disabled:opacity-50',
                tillConfirmation.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-accent',
              ]"
              :disabled="posStore.tillSaving"
              @click="confirmTillAction"
            >
              {{ posStore.tillSaving ? 'Saving…' : tillConfirmation.confirmLabel }}
            </button>
          </div>
        </div>
      </div>

      <VoidSaleModal
        v-if="voidTarget"
        :sale-id="voidTarget.id"
        :receipt-code="voidTarget.receipt_code"
        @close="voidTarget = null"
        @voided="posStore.fetchSales()"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  CubeIcon, XMarkIcon, BanknotesIcon, ReceiptPercentIcon,
  ReceiptRefundIcon, ChartBarIcon, ShoppingCartIcon, TrashIcon, ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import { QeSelect } from '@qesuite/ui'
import PosTill, { type TillForm } from '@/components/dashboard/PosTill.vue'
import VoidSaleModal from '@/components/dashboard/VoidSaleModal.vue'
import { usePosStore } from '@/stores/pos'
import { useSettingsStore } from '@/stores/settings'
import { useAccessStore } from '@/stores/access'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { ringSaleOffline } from '@/offline/localPos'
import { capabilityForPaymentMethod, canProceed, capabilityMessage } from '@/offline/capability'
import { offlineDb, type LocalSaleRecord, productCacheToDisplayProduct } from '@/offline/db'
import { onOutboxChanged } from '@/offline/outbox'
import { useDocumentPdf } from '@/composables/useDocumentPdf'
import { formatTime } from '@/composables/useDateFormat'
import { useSnapCarousel } from '@/composables/useSnapCarousel'
import { useRouter } from 'vue-router'
import type { ExpenseCategory, PosCashMovementType, Product, PosSale, PosPaymentMethod } from '@qesuite/types'
import { EXPENSE_CATEGORIES, todayNairobi } from '@qesuite/shared'

const PAYMENT_METHOD_BADGE_CLASS: Record<PosPaymentMethod, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  mpesa: 'bg-sky-100 text-sky-700',
  card: 'bg-violet-100 text-violet-700',
  split: 'bg-amber-100 text-amber-700',
  credit: 'bg-rose-100 text-rose-700',
}

const router = useRouter()
const posStore = usePosStore()
const settingsStore = useSettingsStore()
const accessStore = useAccessStore()
const authStore = useAuthStore()
const { showToast } = useToast()
const pdf = useDocumentPdf()

const tab = ref<'terminal' | 'history' | 'reports'>('terminal')
const tabs = [
  { key: 'terminal' as const, label: 'POS' },
  { key: 'history' as const, label: 'History' },
  { key: 'reports' as const, label: 'Reports' },
]
const visibleTabs = computed(() => tabs.filter(item => item.key !== 'terminal' || accessStore.can('pos.create_sale')))

const period = ref<'today' | 'week' | 'month'>('today')
const periods = [
  { key: 'today' as const, label: 'Today' },
  { key: 'week' as const, label: 'This week' },
  { key: 'month' as const, label: 'This month' },
]

const selectedCategoryId = ref('')
const cart = ref<Array<{ product: Product; quantity: number }>>([])
const voidTarget = ref<PosSale | null>(null)
const mobileTillOpen = ref(false)
const {
  scroller: reportCardScroller,
  activeIndex: activeReportCard,
  updateActiveIndex: updateActiveReportCard,
  scrollToIndex: scrollToReportCard,
} = useSnapCarousel()
const openingFloat = ref<number | null>(null)
const manageCashOpen = ref(false)
const closeTillMode = ref(false)
const cashAdjustmentOpen = ref(false)
const countedCash = ref<number | null>(null)
const cashMovementType = ref<Extract<PosCashMovementType, 'paid_in' | 'paid_out' | 'correction'>>('paid_in')
const cashMovementAmount = ref<number | null>(null)
const cashMovementReason = ref('')
const saveCashOutAsExpense = ref(false)
const cashExpenseCategory = ref<ExpenseCategory>('supplies')

type TillConfirmationAction = 'open' | 'movement' | 'close'
type TillConfirmation = {
  action: TillConfirmationAction
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
}

const tillConfirmation = ref<TillConfirmation | null>(null)

const movementOptions = [
  {
    key: 'paid_in' as const,
    label: 'Add cash',
    help: 'Choose this when you put extra cash into the till, for example to add more change.',
    amountLabel: 'Cash to add (KES)',
    amountExample: 'e.g. 1,000',
    reasonExample: 'e.g. Added change',
    action: 'Add cash to till',
  },
  {
    key: 'paid_out' as const,
    label: 'Take cash out',
    help: 'Choose this whenever cash leaves the till. You can mark it as a business expense below when needed.',
    amountLabel: 'Cash taken out (KES)',
    amountExample: 'e.g. 500',
    reasonExample: 'e.g. Bought milk',
    action: 'Take cash out',
  },
  {
    key: 'correction' as const,
    label: 'Fix balance',
    help: 'Count the till again, then enter the total cash you actually found. The app will correct its expected amount.',
    amountLabel: 'Cash actually in till (KES)',
    amountExample: 'e.g. 4,800',
    reasonExample: 'e.g. Recounted the till',
    action: 'Use counted amount',
  },
]

// Till state — payment is collected inline (PosTill) rather than in a separate checkout
// modal, so the whole sale (items, totals, tender) is managed on one dense screen, and
// bundled into one v-model so the same PosTill instance can be reused for desktop
// (inline aside) and mobile (bottom sheet) without duplicating five separate refs.
const tillForm = ref<TillForm>({
  discount: null,
  method: 'cash',
  amountTendered: null,
  mpesaReference: '',
  splitPayments: [],
  tableLabel: '',
  customerId: null,
})
const charging = ref(false)

const categoryTabs = computed(() => {
  const map = new Map<string, string>()
  for (const p of posStore.menuProducts) {
    if (p.category) map.set(p.category.id, p.category.name)
  }
  return Array.from(map, ([id, name]) => ({ id, name }))
})

const filteredProducts = computed(() =>
  selectedCategoryId.value
    ? posStore.menuProducts.filter(p => p.category_id === selectedCategoryId.value)
    : posStore.menuProducts
)

function unitPrice(product: Product): number {
  return product.sale_price ?? product.price
}

function discountPct(product: Product): number {
  if (!product.sale_price) return 0
  return Math.round((1 - product.sale_price / product.price) * 100)
}

function cartQty(productId: string): number {
  return cart.value.find(l => l.product.id === productId)?.quantity ?? 0
}

const subtotal = computed(() =>
  cart.value.reduce((sum, line) => sum + unitPrice(line.product) * line.quantity, 0)
)
const cartTotal = computed(() => Math.max(0, subtotal.value - (tillForm.value.discount ?? 0)))

const changeDue = computed(() => {
  if (tillForm.value.method !== 'cash' || tillForm.value.amountTendered === null) return null
  if (tillForm.value.amountTendered < cartTotal.value) return null
  return tillForm.value.amountTendered - cartTotal.value
})

const canCharge = computed(() => {
  if (!accessStore.can('pos.create_sale')) return false
  if (!posStore.till) return false
  if (!cart.value.length) return false
  if (tillForm.value.method === 'mpesa') return tillForm.value.mpesaReference.trim().length > 0
  if (tillForm.value.method === 'credit') return !!tillForm.value.customerId
  if (tillForm.value.method === 'split') {
    const legs = tillForm.value.splitPayments
    if (legs.length < 2) return false
    if (legs.some(leg => !leg.amount || leg.amount <= 0)) return false
    if (legs.some(leg => leg.method === 'mpesa' && !leg.reference.trim())) return false
    return legs.reduce((sum, leg) => sum + (leg.amount || 0), 0) === cartTotal.value
  }
  return tillForm.value.amountTendered === null || tillForm.value.amountTendered >= cartTotal.value
})

const businessDate = todayNairobi()
const currentMovementOption = computed(() =>
  movementOptions.find(option => option.key === cashMovementType.value) ?? movementOptions[0]
)
const validOpeningFloat = computed(() =>
  Number.isSafeInteger(openingFloat.value) && (openingFloat.value ?? -1) >= 0
)
const validCashMovement = computed(() => {
  const amount = cashMovementAmount.value
  if (!Number.isSafeInteger(amount) || amount === null) return false
  if (cashMovementType.value === 'correction') {
    if (amount < 0 || amount === expectedTillFloat.value) return false
  } else if (amount <= 0) return false
  return cashMovementReason.value.trim().length > 0
})
const validCountedCash = computed(() =>
  Number.isSafeInteger(countedCash.value) && (countedCash.value ?? -1) >= 0
)
const tillVariance = computed(() =>
  validCountedCash.value ? (countedCash.value ?? 0) - expectedTillFloat.value : 0
)

const expenseTotal = computed(() => posStore.report?.expenses ?? 0)
const netTotal = computed(() => posStore.report?.profit_loss ?? 0)

function addToCart(product: Product) {
  if (product.stock < 1) return
  const existing = cart.value.find(l => l.product.id === product.id)
  if (existing) {
    if (existing.quantity < product.stock) existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

function increment(line: { product: Product; quantity: number }) {
  if (line.quantity < line.product.stock) line.quantity++
}

function decrement(line: { product: Product; quantity: number }) {
  line.quantity--
  if (line.quantity <= 0) {
    cart.value = cart.value.filter(l => l.product.id !== line.product.id)
  }
}

function removeLine(line: { product: Product; quantity: number }) {
  cart.value = cart.value.filter(l => l.product.id !== line.product.id)
}

function resetTill() {
  cart.value = []
  tillForm.value = {
    discount: null,
    method: 'cash',
    amountTendered: null,
    mpesaReference: '',
    splitPayments: [],
    tableLabel: '',
    customerId: null,
  }
}

async function handleCharge() {
  if (!canCharge.value) return
  charging.value = true
  try {
    const form = tillForm.value
    const capability = capabilityForPaymentMethod(form.method)

    // Cash and credit are OFFLINE_ALLOWED / ONLINE_PREFERRED — these always
    // go through the local-first pipeline (validate + commit locally, queue
    // for background sync), online or not, per the offline-first design.
    // M-Pesa/card/split are ONLINE_REQUIRED (a live third-party round trip
    // can't be faked offline) and keep going straight to the server.
    if (form.method === 'cash' || form.method === 'credit') {
      const outcome = await ringSaleOffline({
        items: cart.value.map(l => ({ productId: l.product.id, quantity: l.quantity })),
        paymentMethod: form.method,
        discount: form.discount ?? undefined,
        tableLabel: form.tableLabel.trim() || undefined,
        customerId: form.method === 'credit' ? form.customerId ?? undefined : undefined,
      })
      if (!outcome.ok) {
        showToast(outcome.error, 'error')
        return
      }
      showToast(`Sale ${outcome.receiptCode} saved on this device — syncing in the background`, 'success')
      resetTill()
      mobileTillOpen.value = false
      // BroadcastChannel never delivers to the tab that sent it, only other
      // tabs — this tab needs its own direct refresh to see the sale it just
      // rang up reflected in history/the till float immediately.
      await refreshLocalSales()
      return
    }

    if (!canProceed(capability)) {
      showToast(capabilityMessage(capability) ?? 'This payment method needs a live connection', 'error')
      return
    }

    const result = await posStore.createSale({
      items: cart.value.map(l => ({ product_id: l.product.id, quantity: l.quantity })),
      payment_method: form.method,
      mpesa_reference: form.method === 'mpesa' ? form.mpesaReference.trim() : undefined,
      payments: form.method === 'split'
        ? form.splitPayments.map(leg => ({ method: leg.method, amount: leg.amount ?? 0, reference: leg.reference.trim() || undefined }))
        : undefined,
      discount: form.discount ?? undefined,
      table_label: form.tableLabel.trim() || undefined,
    })
    if (result) {
      // posStore.createSale() already toasts success — just reset the till and refresh state.
      resetTill()
      mobileTillOpen.value = false
      posStore.fetchMenuProducts()
      if (tab.value === 'history') posStore.fetchSales()
    }
  } finally {
    charging.value = false
  }
}

function requestOpenOperatingTill() {
  if (!validOpeningFloat.value || openingFloat.value === null) return
  tillConfirmation.value = {
    action: 'open',
    title: 'Open this till?',
    message: `Start today’s till with KES ${openingFloat.value.toLocaleString()} in cash? This amount will be saved as the opening balance.`,
    confirmLabel: 'Open till',
  }
}

async function openOperatingTill(): Promise<boolean> {
  if (!validOpeningFloat.value || openingFloat.value === null) return false
  const opened = await posStore.openTill(openingFloat.value, businessDate)
  if (opened) openingFloat.value = null
  return Boolean(opened)
}

function openCashManager() {
  if (!posStore.till) return
  mobileTillOpen.value = false
  closeTillMode.value = false
  cashAdjustmentOpen.value = false
  manageCashOpen.value = true
}

function closeCashManager() {
  if (posStore.tillSaving) return
  manageCashOpen.value = false
  closeTillMode.value = false
  cashAdjustmentOpen.value = false
}

function requestCashMovement() {
  if (!validCashMovement.value || cashMovementAmount.value === null) return
  const option = currentMovementOption.value
  // Deliberately the server's own float, not expectedTillFloat — a manual
  // cash correction is submitted straight to the server (online-only) and
  // must anchor to what the server itself currently thinks the till holds,
  // not a total that also folds in this device's own not-yet-synced sales.
  const expected = posStore.till?.running_float ?? 0
  const message = cashMovementType.value === 'correction'
    ? `Change the expected till balance from KES ${expected.toLocaleString()} to the counted amount of KES ${cashMovementAmount.value.toLocaleString()}? Reason: ${cashMovementReason.value.trim()}.`
    : `${option.action} — KES ${cashMovementAmount.value.toLocaleString()}? Reason: ${cashMovementReason.value.trim()}.${cashMovementType.value === 'paid_out' ? (saveCashOutAsExpense.value ? ' This will also be recorded as a business expense.' : ' This will not be recorded as a business expense.') : ''}`
  tillConfirmation.value = {
    action: 'movement',
    title: 'Save this cash change?',
    message,
    confirmLabel: option.action,
  }
}

async function submitCashMovement(): Promise<boolean> {
  if (!validCashMovement.value || cashMovementAmount.value === null) return false
  const amount = cashMovementType.value === 'correction'
    ? cashMovementAmount.value - (posStore.till?.running_float ?? 0)
    : cashMovementAmount.value
  const saved = await posStore.recordCashMovement(
    cashMovementType.value,
    amount,
    cashMovementReason.value.trim(),
    {
      recordAsExpense: cashMovementType.value === 'paid_out' && saveCashOutAsExpense.value,
      category: cashExpenseCategory.value,
    },
  )
  if (saved) {
    cashMovementAmount.value = null
    cashMovementReason.value = ''
    saveCashOutAsExpense.value = false
    cashAdjustmentOpen.value = false
  }
  return Boolean(saved)
}

function beginTillClose() {
  countedCash.value = posStore.till ? expectedTillFloat.value : null
  cashAdjustmentOpen.value = false
  closeTillMode.value = true
}

function requestTillClose() {
  if (!validCountedCash.value || countedCash.value === null || !posStore.till) return
  tillConfirmation.value = {
    action: 'close',
    title: 'Close this till?',
    message: `You counted KES ${countedCash.value.toLocaleString()}. The app expected KES ${expectedTillFloat.value.toLocaleString()} (${cashDifferenceLabel(tillVariance.value)}). Closing saves this final count and ends the till session.`,
    confirmLabel: 'Close till',
    danger: true,
  }
}

async function submitTillClose(): Promise<boolean> {
  if (!validCountedCash.value || countedCash.value === null) return false
  const result = await posStore.closeTill(countedCash.value)
  if (result) {
    manageCashOpen.value = false
    closeTillMode.value = false
    countedCash.value = null
    tab.value = 'history'
  }
  return Boolean(result)
}

function cancelTillConfirmation() {
  if (posStore.tillSaving) return
  tillConfirmation.value = null
}

async function confirmTillAction() {
  const action = tillConfirmation.value?.action
  if (!action || posStore.tillSaving) return
  const saved = action === 'open'
    ? await openOperatingTill()
    : action === 'movement'
      ? await submitCashMovement()
      : await submitTillClose()
  if (saved) tillConfirmation.value = null
}

function movementLabel(type: PosCashMovementType): string {
  return ({
    opening_float: 'Cash at start',
    cash_sale: 'Cash sale',
    cash_void: 'Cash refund',
    paid_in: 'Cash added',
    paid_out: 'Cash taken out',
    correction: 'Cash count corrected',
  })[type]
}

function cashDifferenceLabel(amount: number): string {
  if (amount === 0) return 'Matched'
  return `KES ${Math.abs(amount).toLocaleString()} ${amount > 0 ? 'more' : 'less'}`
}

function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORIES[category as ExpenseCategory]?.label ?? category
}

const expenseCategoryOptions = computed(() =>
  Object.entries(EXPENSE_CATEGORIES).map(([value, meta]) => ({ value, label: meta.label }))
)

watch(tab, (newTab) => {
  if (newTab === 'history') {
    posStore.fetchSales()
    posStore.fetchTillHistory()
  }
  if (newTab === 'reports') {
    posStore.fetchReport({ period: period.value })
  }
})

watch(period, (newPeriod) => {
  posStore.fetchReport({ period: newPeriod })
})

// --- Locally-pending (not yet synced) sales, merged into history/till math ---
// so the cashier's view of "today's sales" and "cash expected in the drawer"
// is correct even before the background sync engine has caught up.
const localSales = ref<LocalSaleRecord[]>([])

async function refreshLocalSales() {
  localSales.value = await offlineDb.salesLocal.where('status').notEqual('synced').toArray()
}

const pendingLocalCashTotal = computed(() =>
  localSales.value
    .filter(s => s.paymentMethod === 'cash' && s.status === 'pending_sync')
    .reduce((sum, s) => sum + s.total, 0)
)

// What's physically expected in the drawer right now — the server's own
// running float plus any cash sale rung up on this device that hasn't
// synced yet (so it isn't in the server's figure at all until it does).
const expectedTillFloat = computed(() => (posStore.till?.running_float ?? 0) + pendingLocalCashTotal.value)

interface DisplaySale {
  id: string
  receipt_code: string
  table_label: string | null
  items_summary: string
  created_at: string
  payment_method: string
  status: string
  total: number
  isPendingSync: boolean
}

const mergedSales = computed<DisplaySale[]>(() => {
  const local: DisplaySale[] = localSales.value.map(s => ({
    id: s.id,
    receipt_code: s.receiptCode,
    table_label: null,
    items_summary: s.items.map(i => `${i.productName} x${i.quantity}`).join(', '),
    created_at: s.createdAt,
    payment_method: s.paymentMethod,
    status: s.status === 'voided' ? 'voided' : 'completed',
    total: s.total,
    isPendingSync: true,
  }))
  const remote: DisplaySale[] = posStore.sales.map(s => ({
    id: s.id, receipt_code: s.receipt_code, table_label: s.table_label, items_summary: s.items_summary ?? '',
    created_at: s.created_at, payment_method: s.payment_method, status: s.status, total: s.total, isPendingSync: false,
  }))
  return [...local, ...remote].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
})

let unsubscribeOutbox: (() => void) | undefined
let localSalesPoll: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  if (!authStore.offlineDeviceMode && !settingsStore.tenant) await settingsStore.fetchTenant()
  if (!accessStore.can('pos.create_sale')) tab.value = 'history'

  if (authStore.offlineDeviceMode) {
    // No live product/till fetch is possible — render the till and product
    // grid straight from what this device already has cached locally.
    const cachedProducts = (await offlineDb.productsCache.toArray()).filter(p => p.isActive)
    posStore.menuProducts = cachedProducts.map(productCacheToDisplayProduct)
  } else {
    await Promise.all([posStore.fetchMenuProducts(), posStore.fetchTill()])
  }
  await refreshLocalSales()
  // Cross-tab changes (another tab ringing a sale, or another tab's sync
  // engine marking one synced) arrive via BroadcastChannel; this tab's own
  // sync cycle marking a mutation synced does not (a channel never delivers
  // to the sender), so a light poll catches that case too.
  unsubscribeOutbox = onOutboxChanged(refreshLocalSales)
  localSalesPoll = setInterval(refreshLocalSales, 5000)
})

onUnmounted(() => {
  unsubscribeOutbox?.()
  clearInterval(localSalesPoll)
})
</script>
