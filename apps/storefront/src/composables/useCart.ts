import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useStorefrontStore } from '@/stores/store'
import { formatCurrency } from '@qesuite/shared'
import type { Product } from '@qesuite/types'

export function useCart() {
  const cartStore = useCartStore()
  const storefrontStore = useStorefrontStore()

  const currency = computed(() => storefrontStore.currency)

  function formatPrice(amount: number) {
    return formatCurrency(amount, currency.value)
  }

  function addToCart(product: Product) {
    if (!product.is_active || product.stock <= 0) return
    cartStore.addItem({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      sale_price: product.sale_price,
      image_url: product.image_url,
      stock: product.stock,
    })
  }

  function increment(productId: string) {
    const qty = cartStore.getItemQuantity(productId)
    cartStore.updateQuantity(productId, qty + 1)
  }

  function decrement(productId: string) {
    const qty = cartStore.getItemQuantity(productId)
    cartStore.updateQuantity(productId, qty - 1)
  }

  function isInCart(productId: string) {
    return cartStore.getItemQuantity(productId) > 0
  }

  function getQuantity(productId: string) {
    return cartStore.getItemQuantity(productId)
  }

  const formattedSubtotal = computed(() => formatPrice(cartStore.subtotal))
  const formattedDeliveryFee = computed(() => formatPrice(cartStore.deliveryFee))
  const formattedTotal = computed(() => formatPrice(cartStore.total))

  return {
    cartStore,
    currency,
    formatPrice,
    addToCart,
    increment,
    decrement,
    isInCart,
    getQuantity,
    formattedSubtotal,
    formattedDeliveryFee,
    formattedTotal,
  }
}
