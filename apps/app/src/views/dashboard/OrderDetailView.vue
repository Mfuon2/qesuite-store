<template>
  <div class="p-3 sm:p-4 max-w-3xl mx-auto">
    <!-- Back -->
    <button @click="router.back()" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3 transition-colors">
      <ArrowLeftIcon class="w-3.5 h-3.5" /> Back to Orders
    </button>

    <!-- Loading state -->
    <div v-if="ordersStore.loadingDetail" class="space-y-3">
      <div class="skeleton h-20 rounded-xl" />
      <div class="skeleton h-24 rounded-xl" />
      <div class="skeleton h-36 rounded-xl" />
    </div>

    <template v-else-if="order">
      <!-- Header card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-3">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-gray-400 dark:text-gray-500">Order</span>
              <span class="font-mono font-bold text-gray-900 dark:text-white">#{{ order.tracking_code }}</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(order.created_at) }}</p>
          </div>
          <StatusBadge :status="order.status" size="md" />
        </div>

        <!-- Status action buttons -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="action in availableActions"
            :key="action.status"
            @click="handleStatusAction(action.status)"
            :disabled="updatingStatus"
            :class="['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all', action.class, 'disabled:opacity-60']"
          >
            <component v-if="action.icon" :is="action.icon" class="w-4 h-4" />
            {{ action.label }}
          </button>
          <button
            v-if="canAssignRider"
            @click="showAssignModal = true"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
          >
            <TruckIcon class="w-4 h-4" />
            Assign Rider
          </button>
          <button
            v-if="canCancel"
            @click="showCancelDropdown = !showCancelDropdown"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <XCircleIcon class="w-4 h-4" />
            Cancel Order
          </button>
        </div>

        <!-- Cancel dropdown -->
        <Transition name="fade">
          <div v-if="showCancelDropdown" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p class="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Cancellation reason</p>
            <select
              v-model="cancelReason"
              class="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400/50 mb-2"
            >
              <option value="">Select reason</option>
              <option value="Customer requested">Customer requested</option>
              <option value="Out of stock">Out of stock</option>
              <option value="Unable to deliver">Unable to deliver</option>
              <option value="Payment failed">Payment failed</option>
              <option value="Other">Other</option>
            </select>
            <button
              @click="handleCancel"
              :disabled="!cancelReason"
              class="w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              Confirm Cancellation
            </button>
          </div>
        </Transition>
      </div>

      <!-- Customer -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 mb-3">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Customer</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">{{ order.customer_name || 'Anonymous' }}</p>
            <a :href="`tel:${order.customer_phone}`" class="text-sm text-primary hover:text-accent font-mono transition-colors flex items-center gap-1.5 mt-0.5">
              <PhoneIcon class="w-4 h-4" />
              {{ order.customer_phone }}
            </a>
          </div>
          <a
            :href="`tel:${order.customer_phone}`"
            class="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <PhoneArrowUpRightIcon class="w-5 h-5" />
          </a>
        </div>
        <div v-if="order.delivery_address" class="mt-3 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPinIcon class="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          {{ order.delivery_address }}
        </div>
        <div v-if="order.notes" class="mt-3 text-sm text-gray-500 dark:text-gray-400 italic flex items-start gap-2">
          <ChatBubbleLeftIcon class="w-4 h-4 mt-0.5 shrink-0" />
          "{{ order.notes }}"
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 mb-3">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Items</h3>
        <div class="space-y-2">
          <div
            v-for="item in order.items || []"
            :key="item.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                <CubeIcon class="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.product_name }}</p>
                <p class="text-xs text-gray-400">× {{ item.quantity }}</p>
              </div>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              KES {{ (item.price * item.quantity).toLocaleString() }}
            </p>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 space-y-1.5">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>KES {{ order.subtotal.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Delivery fee</span>
            <span>KES {{ order.delivery_fee.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
            <span>Total</span>
            <span>KES {{ order.total.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Payment & Rider info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Payment</h3>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ paymentMethodLabel }}</span>
            <StatusBadge :status="order.payment_status" size="sm" />
          </div>
        </div>

        <div v-if="order.assignment" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Rider</h3>
          <p class="font-medium text-gray-900 dark:text-white text-sm">{{ order.assignment.staff?.name }}</p>
          <a :href="`tel:${order.assignment.staff?.phone}`" class="text-xs text-primary font-mono hover:text-accent transition-colors">
            {{ order.assignment.staff?.phone }}
          </a>
        </div>
      </div>

      <!-- Packing slip -->
      <div class="flex justify-end">
        <button
          @click="showPackingSlip = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <DocumentTextIcon class="w-4 h-4" />
          Packing Slip
        </button>
      </div>
    </template>

    <div v-else class="text-center py-16 text-gray-400">
      <p>Order not found.</p>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <AssignRiderModal
        v-if="showAssignModal"
        :order-id="orderId"
        @close="showAssignModal = false"
        @assigned="ordersStore.fetchOrder(orderId)"
      />
      <PackingSlipModal
        v-if="showPackingSlip"
        :order-id="orderId"
        @close="showPackingSlip = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, PhoneIcon, PhoneArrowUpRightIcon, MapPinIcon,
  CubeIcon, DocumentTextIcon, TruckIcon, XCircleIcon, ChatBubbleLeftIcon
} from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import AssignRiderModal from '@/components/dashboard/AssignRiderModal.vue'
import PackingSlipModal from '@/components/dashboard/PackingSlipModal.vue'
import { useOrdersStore } from '@/stores/orders'
import type { OrderStatus } from '@qesuite/types'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()

const orderId = route.params.id as string
const showAssignModal = ref(false)
const showPackingSlip = ref(false)
const showCancelDropdown = ref(false)
const cancelReason = ref('')
const updatingStatus = ref(false)

const order = computed(() => ordersStore.currentOrder)

const paymentMethodLabel = computed(() => {
  const m = order.value?.payment_method
  if (m === 'pay_on_delivery') return 'Pay on delivery'
  if (m === 'mpesa') return 'M-Pesa'
  if (m === 'stripe') return 'Card'
  return m || 'Unknown'
})

const statusActions: Record<OrderStatus, { status: OrderStatus; label: string; class: string; icon?: unknown }[]> = {
  NEW: [
    { status: 'CONFIRMED', label: 'Accept Order', class: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  ],
  CONFIRMED: [
    { status: 'PREPARING', label: 'Start Preparing', class: 'bg-amber-500 text-white hover:bg-amber-600' },
  ],
  PREPARING: [
    { status: 'READY', label: 'Mark Ready', class: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  ],
  READY: [],
  OUT_FOR_DELIVERY: [
    { status: 'DELIVERED', label: 'Mark Delivered', class: 'bg-green-500 text-white hover:bg-green-600' },
  ],
  DELIVERED: [],
  CANCELLED: []
}

const availableActions = computed(() => statusActions[order.value?.status || 'NEW'] || [])
const canAssignRider = computed(() => order.value?.status === 'READY')
const canCancel = computed(() => {
  const s = order.value?.status
  return s && !['DELIVERED', 'CANCELLED'].includes(s)
})

async function handleStatusAction(status: OrderStatus) {
  if (!order.value) return
  updatingStatus.value = true
  await ordersStore.updateOrderStatus(order.value.id, status)
  updatingStatus.value = false
}

async function handleCancel() {
  if (!order.value || !cancelReason.value) return
  updatingStatus.value = true
  await ordersStore.updateOrderStatus(order.value.id, 'CANCELLED', cancelReason.value)
  showCancelDropdown.value = false
  updatingStatus.value = false
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

onMounted(() => ordersStore.fetchOrder(orderId))
</script>
