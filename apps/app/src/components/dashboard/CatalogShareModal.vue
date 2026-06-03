<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
    <div class="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
      <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-primary">WhatsApp catalog</p>
          <h3 class="mt-1 text-2xl font-black tracking-tight text-slate-950">Share product catalog</h3>
          <p class="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Generate WhatsApp-ready catalog images from the products already in your store.
          </p>
        </div>
        <button class="owner-icon-button h-10 w-10 shrink-0" @click="emit('close')">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <div class="grid max-h-[calc(92vh-92px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_430px]">
        <div class="space-y-5 p-5">
          <section class="owner-soft-form">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 class="text-base font-black text-slate-950">Message to include</h4>
                <p class="mt-1 text-sm font-medium text-slate-500">This message opens in WhatsApp together with your catalog share.</p>
              </div>
              <button type="button" class="owner-secondary-action min-h-9 px-3 py-2 text-xs" @click="copyMessage">
                <DocumentDuplicateIcon class="h-4 w-4" />
                Copy
              </button>
            </div>
            <textarea
              v-model="message"
              rows="4"
              class="owner-input mt-4 resize-none leading-6"
              placeholder="Write a short WhatsApp message..."
            />
          </section>

          <section class="owner-panel">
            <div class="owner-panel-header mb-3">
              <div>
                <h4 class="owner-section-title">Catalog designs</h4>
                <p class="owner-section-copy">Choose one or more generated catalog layouts.</p>
              </div>
              <button type="button" class="owner-secondary-action min-h-9 px-3 py-2 text-xs" @click="toggleAllCatalogs">
                {{ allCatalogsSelected ? 'Clear all' : 'Select all' }}
              </button>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <button
                v-for="option in catalogOptions"
                :key="option.id"
                type="button"
                :class="[
                  'rounded-[22px] border p-3 text-left transition',
                  selectedCatalogs.includes(option.id)
                    ? 'owner-brand-selected'
                    : 'border-slate-100 bg-white hover:border-primary/30'
                ]"
                @click="toggleCatalog(option.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="grid h-10 w-10 place-items-center rounded-2xl owner-brand-surface text-primary">
                    <component :is="option.icon" class="h-5 w-5" />
                  </div>
                  <span
                    :class="[
                      'grid h-5 w-5 place-items-center rounded-full border text-[10px]',
                      selectedCatalogs.includes(option.id)
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 text-transparent'
                    ]"
                  >
                    <CheckIcon class="h-3.5 w-3.5" />
                  </span>
                </div>
                <p class="mt-3 text-sm font-black text-slate-950">{{ option.title }}</p>
                <p class="mt-1 text-xs font-medium leading-5 text-slate-500">{{ option.description }}</p>
              </button>
            </div>
          </section>

          <section class="owner-panel">
            <div class="owner-panel-header mb-3">
              <div>
                <h4 class="owner-section-title">Products to include</h4>
                <p class="owner-section-copy">{{ selectedProducts.length }} of {{ products.length }} selected</p>
              </div>
              <button type="button" class="owner-secondary-action min-h-9 px-3 py-2 text-xs" @click="toggleAllProducts">
                {{ allProductsSelected ? 'Clear all' : 'Select all products' }}
              </button>
            </div>

            <div v-if="products.length" class="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              <button
                v-for="product in products"
                :key="product.id"
                type="button"
                :class="[
                  'flex items-center gap-3 rounded-2xl border p-2 text-left transition',
                  selectedProductIds.includes(product.id)
                    ? 'owner-brand-selected'
                    : 'border-slate-100 bg-white hover:border-primary/30'
                ]"
                @click="toggleProduct(product.id)"
              >
                <div class="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                  <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
                  <div v-else class="grid h-full w-full place-items-center text-sm font-black text-slate-400">
                    {{ initials(product.name) }}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black text-slate-950">{{ product.name }}</p>
                  <p class="truncate text-xs font-semibold text-slate-500">{{ product.category?.name || 'General' }}</p>
                  <p class="mt-0.5 text-xs font-black text-primary">{{ formatPrice(productPrice(product)) }}</p>
                </div>
                <span
                  :class="[
                    'grid h-5 w-5 place-items-center rounded-full border text-[10px]',
                    selectedProductIds.includes(product.id)
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 text-transparent'
                  ]"
                >
                  <CheckIcon class="h-3.5 w-3.5" />
                </span>
              </button>
            </div>

            <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <PhotoIcon class="mx-auto h-8 w-8 text-slate-300" />
              <p class="mt-2 text-sm font-bold text-slate-700">Add products before creating a catalog.</p>
            </div>
          </section>
        </div>

        <aside class="border-t border-slate-100 bg-slate-50/60 p-5 lg:border-l lg:border-t-0">
          <div class="sticky top-4 space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h4 class="text-base font-black text-slate-950">Catalog previews</h4>
                <p class="text-sm font-medium text-slate-500">Generated from selected products.</p>
              </div>
              <button type="button" class="owner-secondary-action min-h-9 px-3 py-2 text-xs" :disabled="generating" @click="refreshPreviews">
                Refresh
              </button>
            </div>

            <div v-if="generating" class="owner-panel grid min-h-72 place-items-center text-center">
              <div>
                <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                <p class="mt-3 text-sm font-bold text-slate-600">Generating catalogs...</p>
              </div>
            </div>

            <div v-else-if="!selectedCatalogs.length || !selectedProducts.length" class="owner-panel grid min-h-72 place-items-center text-center">
              <div>
                <ClipboardDocumentListIcon class="mx-auto h-10 w-10 text-slate-300" />
                <p class="mt-3 text-sm font-bold text-slate-700">Select at least one product and one catalog design.</p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="catalogId in selectedCatalogs"
                :key="catalogId"
                class="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
              >
                <div class="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                  <p class="text-sm font-black text-slate-900">{{ catalogLabel(catalogId) }}</p>
                  <div class="flex items-center gap-2">
                    <button type="button" class="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-primary" @click="openPreview(catalogId)">
                      <EyeIcon class="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button type="button" class="text-xs font-black text-primary hover:underline" @click="downloadSingle(catalogId)">
                      Download
                    </button>
                  </div>
                </div>
                <img
                  v-if="previews[catalogId]"
                  :src="previews[catalogId]"
                  :alt="`${catalogLabel(catalogId)} preview`"
                  class="mx-auto max-h-72 w-full object-contain bg-white"
                />
              </div>
            </div>

            <div class="rounded-[24px] border border-primary/15 bg-white p-3">
              <p class="text-xs font-bold leading-5 text-slate-500">
                Native mobile share can attach the generated PNGs directly. On desktop, the images download first and WhatsApp opens with your message.
              </p>
            </div>

            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                type="button"
                class="owner-secondary-action w-full"
                :disabled="!canGenerate || sharing"
                @click="downloadSelected"
              >
                <ArrowDownTrayIcon class="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                class="owner-primary-action w-full"
                :disabled="!canGenerate || sharing"
                @click="shareSelected"
              >
                <ShareIcon class="h-4 w-4" />
                {{ sharing ? 'Preparing...' : 'Share to WhatsApp' }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <div
      v-if="previewCatalogId"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm"
      @click.self="previewCatalogId = null"
    >
      <div class="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-primary">Catalog preview</p>
            <h4 class="truncate text-lg font-black text-slate-950">{{ previewTitle }}</h4>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="owner-secondary-action min-h-10 px-3 py-2 text-xs"
              @click="previewCatalogId && downloadSingle(previewCatalogId)"
            >
              <ArrowDownTrayIcon class="h-4 w-4" />
              Download
            </button>
            <button type="button" class="owner-icon-button h-10 w-10" @click="previewCatalogId = null">
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
        <div class="overflow-auto bg-slate-100 p-4">
          <img
            v-if="previewImage"
            :src="previewImage"
            :alt="previewTitle"
            class="mx-auto w-full max-w-[720px] rounded-[24px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref, watch } from 'vue'
import {
  ArrowDownTrayIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  PhotoIcon,
  ShareIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import type { Product, Tenant } from '@qesuite/types'

type CatalogId = 'price-list' | 'basket-packages' | 'featured-offers'

const props = defineProps<{
  products: Product[]
  tenant: Tenant | null
}>()

const emit = defineEmits<{ close: [] }>()

const { showToast } = useToast()

const catalogOptions: { id: CatalogId; title: string; description: string; icon: unknown }[] = [
  {
    id: 'price-list',
    title: 'Price list',
    description: 'Dense product table for fast WhatsApp ordering.',
    icon: markRaw(TableCellsIcon),
  },
  {
    id: 'basket-packages',
    title: 'Basket packages',
    description: 'Package-style catalog similar to weekly basket offers.',
    icon: markRaw(ClipboardDocumentListIcon),
  },
  {
    id: 'featured-offers',
    title: 'Featured offers',
    description: 'Visual product cards for quick promotion.',
    icon: markRaw(Squares2X2Icon),
  },
]

const selectedCatalogs = ref<CatalogId[]>(['price-list', 'basket-packages'])
const selectedProductIds = ref<string[]>([])
const message = ref('')
const previews = ref<Partial<Record<CatalogId, string>>>({})
const previewCatalogId = ref<CatalogId | null>(null)
const generating = ref(false)
const sharing = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null

const selectedProducts = computed(() =>
  props.products.filter(product => selectedProductIds.value.includes(product.id))
)

const allProductsSelected = computed(() =>
  props.products.length > 0 && selectedProductIds.value.length === props.products.length
)

const allCatalogsSelected = computed(() =>
  selectedCatalogs.value.length === catalogOptions.length
)

const canGenerate = computed(() =>
  selectedProducts.value.length > 0 && selectedCatalogs.value.length > 0
)

const previewImage = computed(() =>
  previewCatalogId.value ? previews.value[previewCatalogId.value] : null
)

const previewTitle = computed(() =>
  previewCatalogId.value ? catalogLabel(previewCatalogId.value) : 'Catalog'
)

const storeName = computed(() => props.tenant?.name || 'My Store')
const primaryColor = computed(() => props.tenant?.primary_color || '#0b9818')
const accentColor = computed(() => props.tenant?.accent_color || '#0d9488')
const contactNumber = computed(() => props.tenant?.whatsapp_number || props.tenant?.phone || '')
const storefrontUrl = computed(() => {
  if (!props.tenant?.slug) return ''
  const url = new URL(window.location.origin)
  if (url.port === '3000') url.port = '5173'
  url.pathname = `/${props.tenant.slug}`
  return url.toString().replace(/\/$/, '')
})

function defaultMessage() {
  const link = storefrontUrl.value ? `\nShop online: ${storefrontUrl.value}` : ''
  return `Hello, here is the latest catalog from ${storeName.value}. Reply with the products and quantities you would like to order.${link}`
}

function initialiseSelections() {
  selectedProductIds.value = props.products.map(product => product.id)
  message.value = defaultMessage()
}

function toggleCatalog(id: CatalogId) {
  selectedCatalogs.value = selectedCatalogs.value.includes(id)
    ? selectedCatalogs.value.filter(item => item !== id)
    : [...selectedCatalogs.value, id]
}

function toggleAllCatalogs() {
  selectedCatalogs.value = allCatalogsSelected.value
    ? []
    : catalogOptions.map(option => option.id)
}

function toggleProduct(id: string) {
  selectedProductIds.value = selectedProductIds.value.includes(id)
    ? selectedProductIds.value.filter(item => item !== id)
    : [...selectedProductIds.value, id]
}

function toggleAllProducts() {
  selectedProductIds.value = allProductsSelected.value
    ? []
    : props.products.map(product => product.id)
}

function productPrice(product: Product) {
  return product.sale_price || product.price
}

function formatPrice(amount: number) {
  return `KES ${Math.round(amount).toLocaleString()}`
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'P'
}

function catalogLabel(id: CatalogId) {
  return catalogOptions.find(option => option.id === id)?.title || 'Catalog'
}

async function copyMessage() {
  await navigator.clipboard.writeText(message.value)
  showToast('Message copied', 'success')
}

function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => refreshPreviews(), 250)
}

async function refreshPreviews() {
  if (!canGenerate.value) {
    previews.value = {}
    return
  }

  generating.value = true
  try {
    const next: Partial<Record<CatalogId, string>> = {}
    for (const id of selectedCatalogs.value) {
      next[id] = await createPreview(id)
    }
    previews.value = next
  } finally {
    generating.value = false
  }
}

async function createPreview(id: CatalogId) {
  try {
    const canvas = await renderCatalog(id, true)
    return canvas.toDataURL('image/png')
  } catch {
    const canvas = await renderCatalog(id, false)
    return canvas.toDataURL('image/png')
  }
}

async function downloadSingle(id: CatalogId) {
  const file = await createCatalogFile(id)
  downloadFile(file)
}

async function openPreview(id: CatalogId) {
  if (!previews.value[id]) {
    previews.value = {
      ...previews.value,
      [id]: await createPreview(id),
    }
  }
  previewCatalogId.value = id
}

async function downloadSelected() {
  sharing.value = true
  try {
    const files = await createSelectedFiles()
    files.forEach(downloadFile)
    showToast('Catalog images downloaded', 'success')
  } finally {
    sharing.value = false
  }
}

async function shareSelected() {
  if (!canGenerate.value) return
  sharing.value = true
  try {
    const files = await createSelectedFiles()
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean
      share?: (data: ShareData) => Promise<void>
    }

    if (nav.canShare?.({ files }) && nav.share) {
      await nav.share({
        title: `${storeName.value} catalog`,
        text: message.value,
        files,
      })
      showToast('Catalog shared', 'success')
      return
    }

    files.forEach(downloadFile)
    window.open(whatsappUrl(), '_blank', 'noopener,noreferrer')
    showToast('Catalog downloaded. Attach the images in WhatsApp Web.', 'success')
  } finally {
    sharing.value = false
  }
}

async function createSelectedFiles() {
  const files: File[] = []
  for (const id of selectedCatalogs.value) {
    files.push(await createCatalogFile(id))
  }
  return files
}

async function createCatalogFile(id: CatalogId) {
  let canvas = await renderCatalog(id, true)
  let blob: Blob
  try {
    blob = await canvasToBlob(canvas)
  } catch {
    canvas = await renderCatalog(id, false)
    blob = await canvasToBlob(canvas)
  }
  const name = `${slugify(storeName.value)}-${id}-${new Date().toISOString().slice(0, 10)}.png`
  return new File([blob], name, { type: 'image/png' })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Could not generate catalog image'))
      }, 'image/png')
    } catch (err) {
      reject(err)
    }
  })
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function whatsappUrl() {
  const digits = contactNumber.value.replace(/\D/g, '')
  const query = encodeURIComponent(message.value)
  return digits
    ? `https://wa.me/${digits}?text=${query}`
    : `https://wa.me/?text=${query}`
}

async function renderCatalog(id: CatalogId, allowImages: boolean) {
  await document.fonts?.ready
  if (id === 'basket-packages') return renderBasketPackages(allowImages)
  if (id === 'featured-offers') return renderFeaturedOffers(allowImages)
  return renderPriceList(allowImages)
}

async function renderPriceList(allowImages: boolean) {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const products = selectedProducts.value.slice(0, 22)

  paintBackground(ctx)
  await drawHero(ctx, allowImages, 'TODAY\'S CATALOG PRICE LIST', 'Fresh products, clear prices, easy ordering')

  const startY = 385
  drawRounded(ctx, 54, startY, 972, 810, 28, '#ffffff', '#dfe9df')
  drawTableHeader(ctx, 78, startY + 32, 440, 'ITEM', 'PRICE')
  drawTableHeader(ctx, 560, startY + 32, 390, 'ITEM', 'PRICE')

  const rowH = 62
  for (let i = 0; i < products.length; i++) {
    const column = i % 2
    const row = Math.floor(i / 2)
    const x = column === 0 ? 78 : 560
    const y = startY + 88 + row * rowH
    await drawPriceRow(ctx, products[i], x, y, column === 0 ? 424 : 390, rowH - 8, allowImages)
  }

  drawDeliveryBand(ctx, 54, 1230, 972)
  drawFooter(ctx)
  return canvas
}

async function renderBasketPackages(allowImages: boolean) {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const products = selectedProducts.value.slice(0, 18)
  const groups = makeProductGroups(products, 3)
  const colors = [primaryColor.value, '#d99a00', '#0f5f9f']
  const titles = ['Quick Basket', 'Family Basket', 'Weekly Package']
  const subtitles = ['Perfect for 1-2 people', 'Most popular', 'Full weekly stock']

  paintBackground(ctx)
  await drawHero(ctx, allowImages, 'FRESH BASKET PACKAGES', 'Ready bundles generated from your catalog')

  for (let i = 0; i < 3; i++) {
    const x = 54 + i * 324
    const group = groups[i]
    drawRounded(ctx, x, 410, 298, 710, 26, '#ffffff', '#dfe9df')
    drawRounded(ctx, x + 18, 430, 262, 72, 22, colors[i], colors[i])
    drawText(ctx, titles[i], x + 149, 462, 30, '900', '#ffffff', 'center')
    drawText(ctx, subtitles[i].toUpperCase(), x + 149, 492, 16, '900', '#ffffff', 'center')
    await drawPackageCollage(ctx, group, x + 28, 528, 242, 190, allowImages)
    drawText(ctx, 'INCLUDES', x + 30, 760, 18, '900', colors[i])
    group.slice(0, 6).forEach((product, index) => {
      drawDot(ctx, x + 34, 792 + index * 34, colors[i])
      drawText(ctx, product.name, x + 52, 798 + index * 34, 17, '800', '#243044', 'left', 200)
    })
    const price = group.reduce((sum, product) => sum + productPrice(product), 0)
    drawRounded(ctx, x + 28, 1010, 242, 76, 18, colors[i], colors[i])
    drawText(ctx, 'PRICE', x + 149, 1034, 16, '900', '#ffffff', 'center')
    drawText(ctx, formatPrice(price || productPrice(products[0])), x + 149, 1070, 30, '950', '#ffffff', 'center')
  }

  drawDeliveryBand(ctx, 54, 1160, 972)
  drawFooter(ctx)
  return canvas
}

async function renderFeaturedOffers(allowImages: boolean) {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const products = selectedProducts.value.slice(0, 8)

  paintBackground(ctx)
  await drawHero(ctx, allowImages, 'FEATURED OFFERS', 'Customer-ready product picks from your store')

  const cardW = 466
  const cardH = 200
  const rowStep = 220  // cardH + 20px gap
  for (let i = 0; i < products.length; i++) {
    const x = i % 2 === 0 ? 54 : 560
    const y = 410 + Math.floor(i / 2) * rowStep
    drawRounded(ctx, x, y, cardW, cardH, 26, '#ffffff', '#dfe9df')
    await drawProductImage(ctx, products[i], x + 20, y + 20, 170, 150, allowImages)
    drawText(ctx, products[i].name, x + 210, y + 56, 26, '900', '#07111f', 'left', 230)
    drawText(ctx, products[i].category?.name || 'General', x + 210, y + 90, 17, '800', '#718096', 'left', 210)
    if (products[i].sale_price) {
      // Sale price (green, prominent)
      drawText(ctx, formatPrice(productPrice(products[i])), x + 210, y + 128, 26, '950', primaryColor.value, 'left', 160)
      // Original price grayed + strikethrough, then discount badge beside it
      drawStrikethroughText(ctx, `KES ${products[i].price.toLocaleString()}`, x + 210, y + 157, 15, '600', '#94a3b8', 'left', 110)
      const pct = Math.round((1 - products[i].sale_price! / products[i].price) * 100)
      drawRounded(ctx, x + 332, y + 140, 76, 26, 12, '#fee2e2', '#fee2e2')
      drawText(ctx, `-${pct}%`, x + 370, y + 159, 14, '950', '#dc2626', 'center')
    } else {
      drawText(ctx, formatPrice(products[i].price), x + 210, y + 138, 30, '950', primaryColor.value, 'left', 220)
    }
  }

  // Single "Available now" strip placed once below all product cards
  const rows = Math.ceil(products.length / 2)
  const stripY = 410 + (rows - 1) * rowStep + cardH + 10
  drawRounded(ctx, 54, stripY, 972, 44, 16, '#effaf2', '#effaf2')
  drawText(ctx, 'Available now. Order on WhatsApp or storefront.', 540, stripY + 29, 18, '850', primaryColor.value, 'center')

  drawFooter(ctx)
  return canvas
}

function makeCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1500
  return canvas
}

function paintBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 1500)
  gradient.addColorStop(0, '#f6fff7')
  gradient.addColorStop(0.45, '#ffffff')
  gradient.addColorStop(1, '#f9fbf8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1500)
  ctx.fillStyle = 'rgba(15, 118, 70, 0.05)'
  ctx.beginPath()
  ctx.arc(940, 120, 190, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(90, 1260, 260, 0, Math.PI * 2)
  ctx.fill()
}

async function drawHero(ctx: CanvasRenderingContext2D, allowImages: boolean, title: string, subtitle: string) {
  drawRounded(ctx, 54, 54, 972, 282, 34, '#ffffff', '#dfe9df')
  const bannerX = 620
  const bannerY = 78
  const bannerW = 376
  const bannerH = 178

  if (props.tenant?.logo_url) {
    const logo = allowImages ? await loadImage(props.tenant.logo_url) : null
    if (logo) drawImageCover(ctx, logo, 84, 86, 100, 100, 24)
    else drawLogoFallback(ctx, 84, 86, 100)
  } else {
    drawLogoFallback(ctx, 84, 86, 100)
  }

  drawText(ctx, storeName.value.toUpperCase(), 210, 118, 48, '950', '#073b1d', 'left', 360)
  drawText(ctx, 'Fresh catalog. Clear pricing. Easy ordering.', 212, 158, 22, '800', '#5f6e7d', 'left', 350)
  drawText(ctx, title, 86, 258, 46, '950', primaryColor.value, 'left', 520)
  drawText(ctx, subtitle, 88, 294, 21, '800', '#6b7788', 'left', 500)

  const banner = allowImages && props.tenant?.banner_url ? await loadImage(props.tenant.banner_url) : null
  if (banner) {
    drawRounded(ctx, bannerX, bannerY, bannerW, bannerH, 30, '#f4fbf5', '#e2eadf')
    drawImageCover(ctx, banner, bannerX, bannerY, bannerW, bannerH, 30)
    const fade = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW * 0.36, bannerY)
    fade.addColorStop(0, 'rgba(255,255,255,0.82)')
    fade.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = fade
    roundedPath(ctx, bannerX, bannerY, bannerW, bannerH, 30)
    ctx.fill()
  } else {
    const heroProducts = selectedProducts.value.filter(product => product.image_url).slice(0, 4)
    for (let i = 0; i < 4; i++) {
      const product = heroProducts[i] || selectedProducts.value[i]
      const x = 690 + (i % 2) * 134
      const y = 86 + Math.floor(i / 2) * 104
      if (product) await drawProductImage(ctx, product, x, y, 116, 88, allowImages)
    }
  }

  drawRounded(ctx, 802, 248, 178, 50, 22, primaryColor.value, primaryColor.value)
  drawText(ctx, 'ORDER NOW', 891, 280, 19, '950', '#ffffff', 'center')
}

function drawLogoFallback(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  drawRounded(ctx, x, y, size, size, 24, primaryColor.value, primaryColor.value)
  drawText(ctx, initials(storeName.value), x + size / 2, y + 64, 42, '950', '#ffffff', 'center')
}

function drawTableHeader(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, left: string, right: string) {
  drawRounded(ctx, x, y, width, 42, 12, primaryColor.value, primaryColor.value)
  drawText(ctx, left, x + 24, y + 28, 16, '950', '#ffffff')
  drawText(ctx, right, x + width - 24, y + 28, 16, '950', '#ffffff', 'right')
}

async function drawPriceRow(ctx: CanvasRenderingContext2D, product: Product, x: number, y: number, width: number, height: number, allowImages: boolean) {
  drawRounded(ctx, x, y, width, height, 14, '#fbfdfb', '#e4ebe4')
  await drawProductImage(ctx, product, x + 8, y + 6, 52, height - 12, allowImages)
  drawText(ctx, product.name.toUpperCase(), x + 72, y + 25, 16, '900', '#1f2a37', 'left', width - 168)
  drawText(ctx, product.category?.name || 'General', x + 72, y + 46, 12, '800', '#7b8794', 'left', width - 168)
  drawText(ctx, formatPrice(productPrice(product)).replace('KES ', ''), x + width - 20, y + 38, 22, '950', '#172033', 'right')
}

async function drawPackageCollage(ctx: CanvasRenderingContext2D, products: Product[], x: number, y: number, width: number, height: number, allowImages: boolean) {
  drawRounded(ctx, x, y, width, height, 22, '#f4fbf5', '#e4ebe4')
  const picks = products.length ? products.slice(0, 4) : selectedProducts.value.slice(0, 4)
  for (let i = 0; i < picks.length; i++) {
    const imgX = x + 16 + (i % 2) * 106
    const imgY = y + 18 + Math.floor(i / 2) * 78
    await drawProductImage(ctx, picks[i], imgX, imgY, 92, 66, allowImages)
  }
}

async function drawProductImage(ctx: CanvasRenderingContext2D, product: Product, x: number, y: number, width: number, height: number, allowImages: boolean) {
  drawRounded(ctx, x, y, width, height, 18, '#f3f8f4', '#edf2ef')
  const image = allowImages && product.image_url ? await loadImage(product.image_url) : null
  if (image) {
    drawImageCover(ctx, image, x, y, width, height, 18)
  } else {
    drawText(ctx, initials(product.name), x + width / 2, y + height / 2 + 12, Math.min(32, width / 3), '950', primaryColor.value, 'center')
  }
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, radius: number) {
  ctx.save()
  roundedPath(ctx, x, y, width, height, radius)
  ctx.clip()
  const scale = Math.max(width / image.width, height / image.height)
  const drawW = image.width * scale
  const drawH = image.height * scale
  ctx.drawImage(image, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH)
  ctx.restore()
}

function drawDeliveryBand(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  drawRounded(ctx, x, y, width, 86, 18, '#0f3d1f', '#0f3d1f')
  drawText(ctx, 'WE DELIVER FRESHNESS TO YOUR DOORSTEP', x + 32, y + 35, 24, '950', '#ffffff')
  drawText(ctx, props.tenant?.address || 'Delivery available within your area', x + 32, y + 64, 17, '800', '#d5f5df')
  if (contactNumber.value) drawText(ctx, contactNumber.value, x + width - 32, y + 55, 28, '950', '#ffffff', 'right')
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  drawRounded(ctx, 54, 1360, 972, 86, 20, primaryColor.value, primaryColor.value)
  drawText(ctx, 'ORDER NOW', 86, 1392, 20, '950', '#ffffff')
  drawText(ctx, contactNumber.value || 'WhatsApp available', 86, 1428, 30, '950', '#ffffff')
  drawRounded(ctx, 760, 1380, 220, 48, 18, accentColor.value, accentColor.value)
  drawText(ctx, 'SHOP ONLINE', 870, 1410, 18, '950', '#ffffff', 'center')
}

function drawRounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) {
  ctx.save()
  roundedPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: string,
  color: string,
  align: CanvasTextAlign = 'left',
  maxWidth?: number
) {
  ctx.save()
  ctx.font = `${weight} ${size}px ${props.tenant?.font_family || 'Poppins'}, Inter, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  if (maxWidth) {
    const clipped = fitText(ctx, text, maxWidth)
    ctx.fillText(clipped, x, y)
  } else {
    ctx.fillText(text, x, y)
  }
  ctx.restore()
}

function drawStrikethroughText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: string,
  color: string,
  align: CanvasTextAlign = 'left',
  maxWidth?: number
) {
  ctx.save()
  ctx.font = `${weight} ${size}px ${props.tenant?.font_family || 'Poppins'}, Inter, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  const display = maxWidth ? fitText(ctx, text, maxWidth) : text
  ctx.fillText(display, x, y)
  const textWidth = ctx.measureText(display).width
  const lineY = y - size * 0.35
  const startX = align === 'center' ? x - textWidth / 2 : align === 'right' ? x - textWidth : x
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.09)
  ctx.beginPath()
  ctx.moveTo(startX, lineY)
  ctx.lineTo(startX + textWidth, lineY)
  ctx.stroke()
  ctx.restore()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let output = text
  while (output.length > 3 && ctx.measureText(`${output}...`).width > maxWidth) {
    output = output.slice(0, -1)
  }
  return `${output}...`
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function makeProductGroups(products: Product[], count: number) {
  const source = products.length ? products : selectedProducts.value
  return Array.from({ length: count }, (_, groupIndex) => {
    const group = source.filter((_, index) => index % count === groupIndex)
    return group.length ? group : source.slice(0, Math.min(4, source.length))
  })
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'catalog'
}

onMounted(() => {
  initialiseSelections()
  refreshPreviews()
})

watch(() => props.products, () => {
  const available = new Set(props.products.map(product => product.id))
  selectedProductIds.value = selectedProductIds.value.filter(id => available.has(id))
  if (!selectedProductIds.value.length) selectedProductIds.value = props.products.map(product => product.id)
  schedulePreview()
}, { deep: true })

watch([selectedCatalogs, selectedProductIds], schedulePreview, { deep: true })
</script>
