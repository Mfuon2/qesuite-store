<template>
  <div class="sticky top-[6.15rem] z-30 border-b border-slate-100 bg-white/95 backdrop-blur-xl md:top-14 lg:static">
    <div
      ref="scrollContainer"
      class="flex gap-2 overflow-x-auto px-0.5 py-3 scrollbar-hide sm:gap-2.5"
      style="scrollbar-width: none; -ms-overflow-style: none;"
    >
      <!-- All tab -->
      <button
        :ref="(el) => setTabRef('all', el)"
        class="flex min-w-[5rem] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2.5 py-2 text-center text-[11px] font-bold transition-all active:scale-95 sm:min-w-0 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:text-xs"
        :class="
          activeCategory === null
            ? 'text-white shadow-md'
            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
        "
        :style="activeCategory === null ? { backgroundColor: 'var(--color-primary)' } : {}"
        @click="selectCategory(null)"
      >
        <Squares2X2Icon class="h-4 w-4" />
        <span class="leading-tight">{{ $t('product.all_categories') }}</span>
      </button>

      <!-- Category tabs -->
      <button
        v-for="cat in categories"
        :key="cat.id"
        :ref="(el) => setTabRef(cat.id, el)"
        class="flex min-w-[5rem] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2.5 py-2 text-center text-[11px] font-bold transition-all active:scale-95 sm:min-w-0 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3.5 sm:text-xs"
        :class="
          activeCategory === cat.id
            ? 'text-white shadow-md'
            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
        "
        :style="activeCategory === cat.id ? { backgroundColor: 'var(--color-primary)' } : {}"
        @click="selectCategory(cat.id)"
      >
        <span v-if="cat.icon" class="text-lg sm:text-base">{{ cat.icon }}</span>
        <span class="max-w-[4.7rem] leading-tight sm:max-w-none">{{ cat.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Squares2X2Icon } from '@heroicons/vue/24/outline'
import type { Category } from '@qesuite/types'

const props = defineProps<{
  categories: Category[]
  activeCategory: string | null
}>()

const emit = defineEmits<{
  'update:activeCategory': [value: string | null]
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement | null>>({})

function setTabRef(id: string, el: unknown) {
  tabRefs.value[id] = el as HTMLElement | null
}

function selectCategory(id: string | null) {
  emit('update:activeCategory', id)
  nextTick(() => scrollToActive(id))
}

function scrollToActive(id: string | null) {
  const key = id ?? 'all'
  const tab = tabRefs.value[key]
  const container = scrollContainer.value
  if (!tab || !container) return
  const tabLeft = tab.offsetLeft
  const tabWidth = tab.offsetWidth
  const containerWidth = container.offsetWidth
  container.scrollTo({
    left: tabLeft - containerWidth / 2 + tabWidth / 2,
    behavior: 'smooth',
  })
}

watch(() => props.activeCategory, (id) => {
  nextTick(() => scrollToActive(id))
})
</script>
