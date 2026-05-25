<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header bar -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
      <div class="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          v-if="!isConfirmation"
          class="p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="handleBack"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <span class="font-bold text-gray-900 dark:text-white text-base">
          {{ $t('checkout.title') }}
        </span>
      </div>
    </div>

    <div class="max-w-xl mx-auto px-4 pb-24">
      <!-- Progress indicator -->
      <CheckoutProgress
        :current-step="checkout.currentStep"
        @go-to-step="checkout.goToStep"
      />

      <!-- Empty cart guard -->
      <div
        v-if="cartStore.items.length === 0 && checkout.currentStep < 4"
        class="text-center py-16"
      >
        <ShoppingCartIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="font-semibold text-gray-600 dark:text-gray-400">Your cart is empty</p>
        <RouterLink
          :to="`/${slug}`"
          class="mt-4 inline-block text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all active:scale-95"
          :style="{ backgroundColor: 'var(--color-primary)' }"
        >
          {{ $t('cart.continue_shopping') }}
        </RouterLink>
      </div>

      <template v-else>
        <!-- Step content -->
        <Transition name="step" mode="out-in">
          <div :key="checkout.currentStep" class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <ContactStep v-if="checkout.currentStep === 1" />
            <DeliveryStep v-else-if="checkout.currentStep === 2" />
            <PaymentStep v-else-if="checkout.currentStep === 3" />
            <ConfirmationStep v-else-if="checkout.currentStep === 4" />
          </div>
        </Transition>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/vue/24/outline'
import { useCheckoutStore } from '@/stores/checkout'
import { useCartStore } from '@/stores/cart'
import { useStorefrontStore } from '@/stores/store'
import CheckoutProgress from '@/components/checkout/CheckoutProgress.vue'
import ContactStep from '@/components/checkout/ContactStep.vue'
import DeliveryStep from '@/components/checkout/DeliveryStep.vue'
import PaymentStep from '@/components/checkout/PaymentStep.vue'
import ConfirmationStep from '@/components/checkout/ConfirmationStep.vue'

const route = useRoute()
const checkout = useCheckoutStore()
const cartStore = useCartStore()
const storefrontStore = useStorefrontStore()
const slug = computed(() => route.params.slug as string)
const isConfirmation = computed(() => checkout.currentStep === 4)

function handleBack() {
  if (checkout.currentStep === 1) {
    window.history.back()
  } else {
    checkout.prevStep()
  }
}
</script>

<style scoped>
.step-enter-active, .step-leave-active { transition: all 0.2s ease; }
.step-enter-from { opacity: 0; transform: translateX(20px); }
.step-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
