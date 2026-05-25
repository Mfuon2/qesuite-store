import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStorefrontStore } from './store'
import type { CartItem } from '@qesuite/types'

function getStorageKey(slug: string) {
  return `cart_${slug}`
}

function loadCart(slug: string): CartItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(slug))
    if (raw) return JSON.parse(raw) as CartItem[]
  } catch {
    // ignore
  }
  return []
}

function saveCart(slug: string, items: CartItem[]) {
  try {
    localStorage.setItem(getStorageKey(slug), JSON.stringify(items))
  } catch {
    // ignore
  }
}

export const useCartStore = defineStore('cart', () => {
  const storefrontStore = useStorefrontStore()
  const items = ref<CartItem[]>([])
  const isDrawerOpen = ref(false)

  // Load cart for current slug
  function initCart(slug: string) {
    items.value = loadCart(slug)
  }

  // Persist cart whenever items change
  watch(
    items,
    (newItems) => {
      if (storefrontStore.slug) {
        saveCart(storefrontStore.slug, newItems)
      }
    },
    { deep: true }
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, i) => {
      const price = i.sale_price !== null ? i.sale_price : i.price
      return sum + price * i.quantity
    }, 0)
  )

  const deliveryFee = computed(() => storefrontStore.deliveryFee)

  const total = computed(() => subtotal.value + deliveryFee.value)

  function addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const qty = item.quantity ?? 1
    const existing = items.value.find((i) => i.product_id === item.product_id)
    if (existing) {
      const newQty = existing.quantity + qty
      existing.quantity = Math.min(newQty, item.stock)
    } else {
      items.value.push({ ...item, quantity: Math.min(qty, item.stock) })
    }
  }

  function removeItem(productId: string) {
    items.value = items.value.filter((i) => i.product_id !== productId)
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    const item = items.value.find((i) => i.product_id === productId)
    if (item) {
      item.quantity = Math.min(quantity, item.stock)
    }
  }

  function clearCart() {
    items.value = []
  }

  function getItemQuantity(productId: string): number {
    return items.value.find((i) => i.product_id === productId)?.quantity ?? 0
  }

  function openDrawer() {
    isDrawerOpen.value = true
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  return {
    items,
    isDrawerOpen,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    initCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    openDrawer,
    closeDrawer,
  }
})
