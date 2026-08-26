<template>
  <div class="owner-page owner-page-dense">
    <section class="owner-page-hero">
      <div class="owner-page-header">
        <div class="min-w-0">
          <h1 class="owner-title">Categories</h1>
          <p class="owner-subtitle">
            Organise products into simple browsing groups so customers can scan the store quickly.
          </p>
        </div>
        <button v-if="accessStore.can('categories.manage')" type="button" @click="openAddForm" class="owner-primary-action">
          <PlusIcon class="h-4 w-4" />
          <span class="hidden sm:inline">Add category</span>
          <span class="sm:hidden">Manage categories</span>
        </button>
      </div>
    </section>

    <section class="owner-stat-grid hidden sm:grid">
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <TagIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ categoriesStore.categories.length }}</p>
          <p class="text-xs font-medium text-slate-500">Total categories</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon">
          <EyeIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ activeCategories }}</p>
          <p class="text-xs font-medium text-slate-500">Visible</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-slate-50 text-slate-600 ring-slate-100">
          <EyeSlashIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">{{ inactiveCategories }}</p>
          <p class="text-xs font-medium text-slate-500">Hidden</p>
        </div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-icon bg-sky-50 text-sky-700 ring-sky-100">
          <ChevronUpIcon class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-slate-950">Drag-free</p>
          <p class="text-xs font-medium text-slate-500">Use arrows to sort</p>
        </div>
      </div>
    </section>

    <section class="mt-3">
      <div v-if="categoriesStore.loading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-2xl" />
      </div>

      <div v-else-if="!categoriesStore.categories.length" class="owner-empty">
        <TagIcon class="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p class="text-base font-bold text-slate-800">No categories yet</p>
        <p class="mt-1 text-sm text-slate-500">Add categories to organise your products.</p>
      </div>

      <div v-else class="owner-panel space-y-1.5 !p-1.5">
        <div
          v-for="(cat, idx) in categoriesStore.categories"
          :key="cat.id"
          class="owner-list-row group flex items-center gap-2"
        >
          <div v-if="accessStore.can('categories.manage')" class="flex shrink-0 flex-col gap-0.5">
            <button @click="moveUp(idx)" :disabled="idx === 0" class="rounded-lg p-0.5 text-slate-300 transition hover:bg-slate-50 hover:text-slate-500 disabled:opacity-30">
              <ChevronUpIcon class="h-3.5 w-3.5" />
            </button>
            <button @click="moveDown(idx)" :disabled="idx === categoriesStore.categories.length - 1" class="rounded-lg p-0.5 text-slate-300 transition hover:bg-slate-50 hover:text-slate-500 disabled:opacity-30">
              <ChevronDownIcon class="h-3.5 w-3.5" />
            </button>
          </div>

          <div class="owner-brand-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-primary ring-1">
            <component :is="resolveCategoryIcon(cat.icon)" v-if="resolveCategoryIcon(cat.icon)" class="h-4 w-4" />
            <span v-else>{{ cat.name.charAt(0).toUpperCase() }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-950">{{ cat.name }}</p>
            <p class="text-xs font-medium text-slate-400">Sort order {{ cat.sort_order }}</p>
          </div>

          <span :class="['rounded-full px-2 py-0.5 text-[10px] font-bold', cat.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500']">
            {{ cat.is_active ? 'Active' : 'Off' }}
          </span>

          <div v-if="accessStore.can('categories.manage')" class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button @click="toggleActive(cat)" class="owner-action-icon" :title="cat.is_active ? 'Deactivate' : 'Activate'">
              <EyeIcon v-if="!cat.is_active" class="h-4 w-4" />
              <EyeSlashIcon v-else class="h-4 w-4" />
            </button>
            <button @click="editCategory(cat)" class="owner-action-icon">
              <PencilIcon class="h-4 w-4" />
            </button>
            <button @click="confirmDelete(cat.id)" class="owner-action-icon hover:bg-red-50 hover:text-red-500">
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showForm"
          class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          @click.self="cancelForm"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            class="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
          >
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 id="category-dialog-title" class="text-base font-black text-slate-950">{{ editingId ? 'Edit category' : 'New category' }}</h2>
                <p class="mt-0.5 text-xs text-slate-500">Keep category names short and easy to recognize.</p>
              </div>
              <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close category dialog" @click="cancelForm">
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <form class="space-y-3 p-4" @submit.prevent="saveCategory">
              <label class="block">
                <span class="admin-label">Category name</span>
                <input v-model="form.name" type="text" maxlength="100" placeholder="Category name" required class="owner-input mt-1.5" />
              </label>
              <label class="block">
                <span class="admin-label">Icon</span>
                <QeSelect v-model="form.icon" class="mt-1.5" placeholder="No icon" :options="iconOptions" />
              </label>

              <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" class="owner-secondary-action" @click="cancelForm">Cancel</button>
                <button type="submit" :disabled="!form.name || categoriesStore.saving" class="owner-primary-action">
                  <svg v-if="categoriesStore.saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {{ categoriesStore.saving ? 'Saving…' : editingId ? 'Save changes' : 'Add category' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, type Component } from 'vue'
import {
  PlusIcon, PencilIcon, TrashIcon, TagIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, XMarkIcon,
  SparklesIcon, CakeIcon, BeakerIcon, CubeIcon, FireIcon, ArchiveBoxIcon, ShoppingBagIcon, HomeIcon, HeartIcon,
  ClipboardDocumentListIcon, GiftIcon, BriefcaseIcon, SwatchIcon, StarIcon, DevicePhoneMobileIcon,
  ComputerDesktopIcon, TvIcon, SpeakerWaveIcon, DeviceTabletIcon, CameraIcon, PuzzlePieceIcon, BoltIcon,
  ShieldCheckIcon, SunIcon, ScissorsIcon, HomeModernIcon, WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'
import { QeSelect } from '@qesuite/ui'
import { categoryIconOptions } from '@qesuite/shared'
import { useCategoriesStore } from '@/stores/categories'
import { useAccessStore } from '@/stores/access'
import { useSettingsStore } from '@/stores/settings'
import { useConfirm } from '@/composables/useConfirm'
import type { Category } from '@qesuite/types'

const categoriesStore = useCategoriesStore()
const accessStore = useAccessStore()
const settingsStore = useSettingsStore()
const { confirm } = useConfirm()

// Maps the Heroicons component-name strings stored in CATEGORY_ICON_PRESETS
// (see @qesuite/shared) to the actual imported icon components.
const CATEGORY_ICON_COMPONENTS: Record<string, Component> = {
  SparklesIcon, CakeIcon, BeakerIcon, CubeIcon, FireIcon, ArchiveBoxIcon, ShoppingBagIcon, HomeIcon, HeartIcon,
  ClipboardDocumentListIcon, GiftIcon, BriefcaseIcon, SwatchIcon, StarIcon, DevicePhoneMobileIcon,
  ComputerDesktopIcon, TvIcon, SpeakerWaveIcon, DeviceTabletIcon, CameraIcon, PuzzlePieceIcon, BoltIcon,
  ShieldCheckIcon, SunIcon, ScissorsIcon, HomeModernIcon, WrenchScrewdriverIcon,
}

function resolveCategoryIcon(iconName: string | null | undefined): Component | undefined {
  return iconName ? CATEGORY_ICON_COMPONENTS[iconName] : undefined
}

const iconOptions = computed(() =>
  categoryIconOptions(settingsStore.tenant?.store_category ?? 'other').map(opt => ({
    value: opt.value,
    label: opt.label,
    icon: CATEGORY_ICON_COMPONENTS[opt.value],
  }))
)

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', icon: '' })
const activeCategories = computed(() => categoriesStore.categories.filter(cat => cat.is_active).length)
const inactiveCategories = computed(() => categoriesStore.categories.length - activeCategories.value)

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
