import type { App, Component } from 'vue';

// ─────────────────────────────────────────────────────────────
// Component type registry
// All shared UI components are listed here and exported for
// individual use or global registration via the plugin.
// ─────────────────────────────────────────────────────────────

// -- Atoms --
export { default as QeButton } from './components/QeButton.vue';
export { default as QeInput } from './components/QeInput.vue';
export { default as QeTextarea } from './components/QeTextarea.vue';
export { default as QeSelect } from './components/QeSelect.vue';
export { default as QeCheckbox } from './components/QeCheckbox.vue';
export { default as QeToggle } from './components/QeToggle.vue';
export { default as QeBadge } from './components/QeBadge.vue';
export { default as QeAvatar } from './components/QeAvatar.vue';
export { default as QeSpinner } from './components/QeSpinner.vue';
export { default as QeIcon } from './components/QeIcon.vue';
export { default as QeDivider } from './components/QeDivider.vue';

// -- Molecules --
export { default as QeCard } from './components/QeCard.vue';
export { default as QeModal } from './components/QeModal.vue';
export { default as QeDrawer } from './components/QeDrawer.vue';
export { default as QeAlert } from './components/QeAlert.vue';
export { default as QeToast } from './components/QeToast.vue';
export { default as QeDropdown } from './components/QeDropdown.vue';
export { default as QeSearchInput } from './components/QeSearchInput.vue';
export { default as QeEmptyState } from './components/QeEmptyState.vue';
export { default as QeConfirmDialog } from './components/QeConfirmDialog.vue';
export { default as QeImageUpload } from './components/QeImageUpload.vue';

// -- Layout --
export { default as QePageHeader } from './components/QePageHeader.vue';
export { default as QeSidebar } from './components/QeSidebar.vue';
export { default as QeTopbar } from './components/QeTopbar.vue';
export { default as QeContainer } from './components/QeContainer.vue';
export { default as QeSection } from './components/QeSection.vue';

// -- Data display --
export { default as QeTable } from './components/QeTable.vue';
export { default as QePagination } from './components/QePagination.vue';
export { default as QeStat } from './components/QeStat.vue';
export { default as QeStatGrid } from './components/QeStatGrid.vue';
export { default as QeProductCard } from './components/QeProductCard.vue';
export { default as QeOrderCard } from './components/QeOrderCard.vue';
export { default as QeOrderStatusBadge } from './components/QeOrderStatusBadge.vue';

// -- Composables --
export { useToast } from './composables/useToast';
export { useModal } from './composables/useModal';
export { useConfirm } from './composables/useConfirm';
export { useDebounce } from './composables/useDebounce';
export { useIntersectionObserver } from './composables/useIntersectionObserver';
export { useLocalStorage } from './composables/useLocalStorage';
export { useClipboard } from './composables/useClipboard';

// -- Types re-exported for consumers --
export type { ButtonVariant, ButtonSize } from './components/QeButton.vue';
export type { BadgeVariant } from './components/QeBadge.vue';
export type { AlertType } from './components/QeAlert.vue';
export type { TableColumn } from './components/QeTable.vue';
export type { ToastOptions } from './composables/useToast';

// ─────────────────────────────────────────────────────────────
// Vue Plugin — registers all components globally
// Usage: app.use(QeSuiteUI)
// ─────────────────────────────────────────────────────────────

const components: Record<string, Component> = {};

// All component names are derived from their export names above.
// The plugin dynamically imports them at registration time so
// tree-shaking still works for direct named imports.

export const QeSuiteUI = {
  install(app: App) {
    const modules = import.meta.glob('./components/*.vue', { eager: true }) as Record<
      string,
      { default: Component }
    >;
    for (const path in modules) {
      const component = modules[path].default;
      const name = path.replace('./components/', '').replace('.vue', '');
      app.component(name, component);
      components[name] = component;
    }
  },
};

export default QeSuiteUI;
