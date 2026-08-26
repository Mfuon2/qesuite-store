<template>
  <div class="owner-panel flex flex-col">
    <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2">
      <h3 class="text-xs font-extrabold uppercase tracking-wide text-slate-500">
        Till · {{ cart.length }} item{{ cart.length === 1 ? '' : 's' }}
      </h3>
      <div class="flex items-center gap-3">
        <button v-if="cart.length" @click="emit('clear')" class="text-xs font-bold text-slate-400 hover:text-red-500">Clear</button>
        <slot name="header-extra" />
      </div>
    </div>

    <div v-if="runningFloat !== null" class="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-3 py-1.5">
      <BanknotesIcon class="h-4 w-4 shrink-0 text-emerald-700" />
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Expected in till</p>
        <p class="text-xs font-black text-slate-950">KES {{ runningFloat.toLocaleString() }}</p>
      </div>
      <p v-if="openingFloat !== null" class="hidden text-[10px] font-semibold text-slate-500 sm:block">
        Started with {{ openingFloat.toLocaleString() }}
      </p>
      <button
        v-if="canManageTill"
        type="button"
        class="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-extrabold text-emerald-700 hover:bg-emerald-100"
        @click="emit('manage-cash')"
      >
        Manage
      </button>
    </div>

    <div v-if="!cart.length" class="p-5 text-center text-sm text-slate-400">
      Tap a menu item to add it to the sale.
    </div>

    <template v-else>
      <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5">
        <div v-for="line in cart" :key="line.product.id" class="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-slate-50">
          <div class="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-slate-50">
            <img v-if="line.product.image_url" :src="line.product.image_url" :alt="line.product.name" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center">
              <CubeIcon class="h-3.5 w-3.5 text-slate-300" />
            </div>
          </div>
          <p class="min-w-0 flex-1 truncate text-xs font-bold text-slate-950">{{ line.product.name }}</p>
          <div class="flex shrink-0 items-center gap-0.5">
            <button @click="emit('decrement', line)" class="grid h-5 w-5 place-items-center rounded bg-slate-100 text-slate-600 hover:text-primary">
              <MinusIcon class="h-3 w-3" />
            </button>
            <span class="w-5 text-center text-xs font-bold text-slate-950">{{ line.quantity }}</span>
            <button
              @click="emit('increment', line)"
              :disabled="line.quantity >= line.product.stock"
              class="grid h-5 w-5 place-items-center rounded bg-slate-100 text-slate-600 hover:text-primary disabled:opacity-40"
            >
              <PlusIcon class="h-3 w-3" />
            </button>
          </div>
          <p class="w-16 shrink-0 text-right text-xs font-black text-slate-950">
            {{ (unitPrice(line.product) * line.quantity).toLocaleString() }}
          </p>
          <button @click="emit('remove', line)" class="shrink-0 text-slate-300 hover:text-red-500">
            <XMarkIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div class="shrink-0 space-y-2 border-t border-slate-100 p-2.5">
        <div class="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Subtotal</span>
          <span>KES {{ subtotal.toLocaleString() }}</span>
        </div>
        <div class="flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
          <span>Discount</span>
          <input
            v-model.number="form.discount"
            type="number"
            min="0"
            :max="subtotal"
            placeholder="0"
            class="owner-input h-7 w-24 px-2 py-0 text-right text-xs"
          />
        </div>
        <div class="flex items-center justify-between text-sm font-black text-slate-950">
          <span>Total</span>
          <span>KES {{ cartTotal.toLocaleString() }}</span>
        </div>

        <div class="owner-segmented" aria-label="Payment method">
          <button
            @click="form.method = 'cash'"
            :class="['owner-segment-button flex-1 py-1.5 text-xs', form.method === 'cash' ? 'owner-segment-button-active' : '']"
          >
            Cash
          </button>
          <button
            @click="form.method = 'mpesa'"
            :class="['owner-segment-button flex-1 py-1.5 text-xs', form.method === 'mpesa' ? 'owner-segment-button-active' : '']"
          >
            M-Pesa
          </button>
        </div>

        <div v-if="form.method === 'cash'" class="flex items-center gap-2">
          <input
            v-model.number="form.amountTendered"
            type="number"
            min="0"
            placeholder="Cash tendered"
            class="owner-input h-8 flex-1 text-xs"
          />
          <span v-if="changeDue !== null" class="shrink-0 text-xs font-bold text-emerald-700">
            Change {{ changeDue.toLocaleString() }}
          </span>
        </div>
        <input
          v-else
          v-model="form.mpesaReference"
          type="text"
          placeholder="M-Pesa reference *"
          class="owner-input h-8 w-full text-xs uppercase"
        />

        <input v-model="form.tableLabel" type="text" placeholder="Table / note (optional)" class="owner-input h-8 w-full text-xs" />

        <button
          @click="emit('charge')"
          :disabled="!canCharge || charging"
          class="owner-primary-action w-full justify-center py-2.5"
        >
          <svg v-if="charging" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <BanknotesIcon v-else class="h-4 w-4" />
          Charge KES {{ cartTotal.toLocaleString() }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CubeIcon, PlusIcon, MinusIcon, XMarkIcon, BanknotesIcon } from '@heroicons/vue/24/outline'
import type { Product, PosPaymentMethod } from '@qesuite/types'

export interface TillForm {
  discount: number | null
  method: PosPaymentMethod
  amountTendered: number | null
  mpesaReference: string
  tableLabel: string
}

defineProps<{
  cart: Array<{ product: Product; quantity: number }>
  subtotal: number
  cartTotal: number
  changeDue: number | null
  canCharge: boolean
  charging: boolean
  openingFloat: number | null
  runningFloat: number | null
  canManageTill: boolean
}>()

const emit = defineEmits<{
  increment: [line: { product: Product; quantity: number }]
  decrement: [line: { product: Product; quantity: number }]
  remove: [line: { product: Product; quantity: number }]
  clear: []
  charge: []
  'manage-cash': []
}>()

const form = defineModel<TillForm>('form', { required: true })

function unitPrice(product: Product): number {
  return product.sale_price ?? product.price
}
</script>
