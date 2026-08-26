import type { App, Component } from 'vue';

// ─────────────────────────────────────────────────────────────
// Component type registry
// All shared UI components are listed here and exported for
// individual use or global registration via the plugin.
//
// This package is intentionally small: only components that are
// actually implemented belong here. Add new atoms/molecules as
// they're built rather than pre-declaring exports for files that
// don't exist yet.
// ─────────────────────────────────────────────────────────────

export { default as QeSelect } from './components/QeSelect.vue';
export type { QeSelectOption } from './components/QeSelect.vue';
export { default as QeDatePicker } from './components/QeDatePicker.vue';
export { default as QePhoneInput } from './components/QePhoneInput.vue';

// ─────────────────────────────────────────────────────────────
// Vue Plugin — registers all components globally
// Usage: app.use(QeSuiteUI)
// ─────────────────────────────────────────────────────────────

const components: Record<string, Component> = {};

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
