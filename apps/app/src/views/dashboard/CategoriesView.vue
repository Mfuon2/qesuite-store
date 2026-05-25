<template>
  <div class="p-3 sm:p-4 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div>
        <h2 class="text-base font-bold text-gray-900 dark:text-white">Categories</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ categoriesStore.categories.length }} categories</p>
      </div>
      <button @click="openAddForm" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
        <PlusIcon class="w-4 h-4" />
        Add Category
      </button>
    </div>

    <!-- Add / Edit form -->
    <Transition name="slide">
      <div v-if="showForm" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">{{ editingId ? 'Edit Category' : 'New Category' }}</h3>
        <div class="flex gap-3 flex-wrap">
          <input
            v-model="form.name"
            type="text"
            placeholder="Category name"
            required
            class="flex-1 min-w-40 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <input
            v-model="form.icon"
            type="text"
            placeholder="Emoji icon (optional)"
            class="w-36 px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <div class="flex gap-2">
            <button @click="cancelForm" class="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button @click="saveCategory" :disabled="!form.name || categoriesStore.saving"
              class="px-4 py-2.5 text-sm bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2">
              <svg v-if="categoriesStore.saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ editingId ? 'Save' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="categoriesStore.loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="!categoriesStore.categories.length" class="text-center py-10 text-gray-400 dark:text-gray-500">
      <TagIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="font-medium text-sm">No categories yet</p>
      <p class="text-xs mt-0.5">Add categories to organise your products</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-1.5">
      <div
        v-for="(cat, idx) in categoriesStore.categories"
        :key="cat.id"
        class="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
      >
        <!-- Reorder buttons -->
        <div class="flex flex-col gap-0.5 shrink-0">
          <button @click="moveUp(idx)" :disabled="idx === 0"
            class="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 transition-colors">
            <ChevronUpIcon class="w-3 h-3" />
          </button>
          <button @click="moveDown(idx)" :disabled="idx === categoriesStore.categories.length - 1"
            class="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-30 transition-colors">
            <ChevronDownIcon class="w-3 h-3" />
          </button>
        </div>

        <!-- Icon -->
        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-base shrink-0">
          {{ cat.icon || '📦' }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ cat.name }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">#{{ cat.sort_order }}</p>
        </div>

        <!-- Status -->
        <span :class="['px-1.5 py-0.5 rounded-full text-xs font-medium', cat.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400']">
          {{ cat.is_active ? 'Active' : 'Off' }}
        </span>

        <!-- Actions -->
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="toggleActive(cat)" class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" :title="cat.is_active ? 'Deactivate' : 'Activate'">
            <EyeIcon v-if="!cat.is_active" class="w-3.5 h-3.5" />
            <EyeSlashIcon v-else class="w-3.5 h-3.5" />
          </button>
          <button @click="editCategory(cat)" class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
            <PencilIcon class="w-3.5 h-3.5" />
          </button>
          <button @click="confirmDelete(cat.id)" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <TrashIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useCategoriesStore } from '@/stores/categories'
import { useConfirm } from '@/composables/useConfirm'
import type { Category } from '@qesuite/types'

const categoriesStore = useCategoriesStore()
const { confirm } = useConfirm()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', icon: '' })

function openAddForm() {
  editingId.value = null
  form.name = ''
  form.icon = ''
  showForm.value = true
}

function editCategory(cat: Category) {
  editingId.value = cat.id
  form.name = cat.name
  form.icon = cat.icon || ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  form.name = ''
  form.icon = ''
}

async function saveCategory() {
  if (!form.name) return
  if (editingId.value) {
    await categoriesStore.updateCategory(editingId.value, { name: form.name, icon: form.icon || undefined })
  } else {
    await categoriesStore.createCategory({ name: form.name, icon: form.icon || undefined })
  }
  cancelForm()
}

async function confirmDelete(id: string) {
  const ok = await confirm({
    title: 'Delete Category',
    message: 'Are you sure? Products in this category will become uncategorised.',
    confirmLabel: 'Delete',
    danger: true
  })
  if (ok) await categoriesStore.deleteCategory(id)
}

async function toggleActive(cat: Category) {
  await categoriesStore.updateCategory(cat.id, { is_active: !cat.is_active })
}

function moveUp(idx: number) {
  if (idx === 0) return
  const cats = [...categoriesStore.categories]
  ;[cats[idx - 1], cats[idx]] = [cats[idx], cats[idx - 1]]
  categoriesStore.reorder(cats.map(c => c.id))
}

function moveDown(idx: number) {
  const cats = categoriesStore.categories
  if (idx >= cats.length - 1) return
  const arr = [...cats]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  categoriesStore.reorder(arr.map(c => c.id))
}

onMounted(() => categoriesStore.fetchCategories())
</script>
