import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from './cart'
import { useStorefrontStore } from './store'
import { placeOrder, initiateMpesa, checkMpesaStatus } from '@/api/storefront'
import type { PaymentMethod, Order } from '@qesuite/types'

export interface CheckoutForm {
  // Step 1: Contact
  phone: string
  name: string
  // Step 2: Delivery
  deliveryType: 'delivery' | 'pickup'
  address: string
  lat: number | null
  lng: number | null
  notes: string
  // Step 3: Payment
  paymentMethod: PaymentMethod
  mpesaPhone: string
}

export const useCheckoutStore = defineStore('checkout', () => {
  const router = useRouter()
  const cartStore = useCartStore()
  const storefrontStore = useStorefrontStore()

  const currentStep = ref(1)
  const totalSteps = 4
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const placedOrder = ref<Order | null>(null)

  // M-Pesa polling
  const mpesaPolling = ref(false)
  const mpesaStatus = ref<'idle' | 'pending' | 'paid' | 'failed'>('idle')
  const mpesaMessage = ref('')
  let mpesaPollInterval: ReturnType<typeof setInterval> | null = null

  const form = ref<CheckoutForm>({
    phone: '',
    name: '',
    deliveryType: 'delivery',
    address: '',
    lat: null,
    lng: null,
    notes: '',
    paymentMethod: 'pay_on_delivery',
    mpesaPhone: '',
  })

  const isLastStep = computed(() => currentStep.value === totalSteps)
  const isFirstStep = computed(() => currentStep.value === 1)

  function nextStep() {
    if (currentStep.value < totalSteps) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--
    error.value = null
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) currentStep.value = step
  }

  function reset() {
    currentStep.value = 1
    error.value = null
    submitting.value = false
    placedOrder.value = null
    mpesaStatus.value = 'idle'
    mpesaMessage.value = ''
    stopMpesaPolling()
    form.value = {
      phone: '',
      name: '',
      deliveryType: 'delivery',
      address: '',
      lat: null,
      lng: null,
      notes: '',
      paymentMethod: 'pay_on_delivery',
      mpesaPhone: '',
    }
  }

  async function placeOrderAction() {
    submitting.value = true
    error.value = null

    try {
      const order = await placeOrder(storefrontStore.slug, {
        customer_name: form.value.name,
        customer_phone: form.value.phone,
        delivery_address: form.value.deliveryType === 'delivery' ? form.value.address : undefined,
        delivery_lat: form.value.lat ?? undefined,
        delivery_lng: form.value.lng ?? undefined,
        payment_method: form.value.paymentMethod,
        notes: form.value.notes || undefined,
        items: cartStore.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      })

      placedOrder.value = order

      // If M-Pesa, initiate STK push
      if (form.value.paymentMethod === 'mpesa') {
        await startMpesaFlow(order.id)
      }

      cartStore.clearCart()
      currentStep.value = 4
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to place order'
    } finally {
      submitting.value = false
    }
  }

  async function startMpesaFlow(orderId: string) {
    const phone = form.value.mpesaPhone || form.value.phone
    mpesaStatus.value = 'pending'
    mpesaPolling.value = true

    try {
      await initiateMpesa(storefrontStore.slug, phone, orderId)
      mpesaMessage.value = 'Check your phone for the M-Pesa prompt'
      startMpesaPolling(orderId)
    } catch (err: unknown) {
      mpesaStatus.value = 'failed'
      mpesaMessage.value = (err as Error).message || 'Failed to initiate M-Pesa payment'
    }
  }

  function startMpesaPolling(orderId: string) {
    let attempts = 0
    const maxAttempts = 20 // 60 seconds

    mpesaPollInterval = setInterval(async () => {
      attempts++
      try {
        const result = await checkMpesaStatus(orderId)
        if (result.status === 'paid') {
          mpesaStatus.value = 'paid'
          mpesaMessage.value = 'Payment received!'
          stopMpesaPolling()
        } else if (result.status === 'failed') {
          mpesaStatus.value = 'failed'
          mpesaMessage.value = result.message || 'Payment failed or was cancelled'
          stopMpesaPolling()
        } else if (attempts >= maxAttempts) {
          mpesaStatus.value = 'failed'
          mpesaMessage.value = 'Payment timeout — please try again'
          stopMpesaPolling()
        }
      } catch {
        // ignore transient errors
      }
    }, 3000)
  }

  function stopMpesaPolling() {
    mpesaPolling.value = false
    if (mpesaPollInterval) {
      clearInterval(mpesaPollInterval)
      mpesaPollInterval = null
    }
  }

  function goToSuccess() {
    const slug = storefrontStore.slug
    router.push({ name: 'order-success', params: { slug } })
  }

  return {
    currentStep,
    totalSteps,
    submitting,
    error,
    form,
    placedOrder,
    mpesaPolling,
    mpesaStatus,
    mpesaMessage,
    isLastStep,
    isFirstStep,
    nextStep,
    prevStep,
    goToStep,
    reset,
    placeOrderAction,
    startMpesaFlow,
    stopMpesaPolling,
    goToSuccess,
  }
})
