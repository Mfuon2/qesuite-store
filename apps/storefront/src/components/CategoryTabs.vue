<template>
  <div class="bg-white dark:bg-gray-900 sticky top-12 z-30 border-b border-gray-100 dark:border-gray-800">
    <div
      ref="scrollContainer"
      class="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2"
      style="scrollbar-width: none; -ms-overflow-style: none;"
    >
      <!-- All tab -->
      <button
        :ref="(el) => setTabRef('all', el)"
        class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
        :class="
          activeCategory === null
            ? 'text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        "
        :style="activeCategory === null ? { backgroundColor: 'var(--color-primary)' } : {}"
        @click="selectCategory(null)"
      >
        <Squares2X2Icon class="w-4 h-4" />
        <span>{{ $t('product.all_categories') }}</span>
      </button>

      <!-- Category tabs -->
      <button
        v-for="cat in categories"
        :key="cat.id"
        :ref="(el) => setTabRef(cat.id, el)"
        class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
        :class="
          activeCategory === cat.id
            ? 'text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        "
        :style="activeCategory === cat.id ? { backgroundColor: 'var(--color-primary)' } : {}"
        @click="selectCategory(cat.id)"
      >
        <span v-if="cat.icon" class="text-base">{{ cat.icon }}</span>
        <span>{{ cat.name }}</span>
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
