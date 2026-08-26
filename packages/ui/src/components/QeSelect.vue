<template>
  <div v-bind="$attrs" class="qe-select" :class="[`qe-select--${size}`, `qe-select--${tone}`, { 'qe-select--open': open, 'qe-select--disabled': disabled }]">
    <button
      :id="id"
      ref="triggerRef"
      type="button"
      class="qe-select__trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-labelledby="id ? `${id}-label` : undefined"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="qe-select__value" :style="selectedOption?.style" :class="{ 'qe-select__value--placeholder': !selectedOption }">
        <component :is="selectedOption.icon" v-if="selectedOption?.icon" class="qe-select__option-icon" />
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <svg class="qe-select__chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="qe-select-panel">
        <ul
          v-if="open"
          ref="panelRef"
          class="qe-select__panel"
          role="listbox"
          :aria-activedescendant="activeIndex >= 0 ? `${panelId}-opt-${activeIndex}` : undefined"
          :style="panelStyle"
          @keydown="onPanelKeydown"
        >
          <li v-if="options.length === 0" class="qe-select__empty">No options</li>
          <li
            v-for="(opt, i) in options"
            :id="`${panelId}-opt-${i}`"
            :key="String(opt.value)"
            role="option"
            :aria-selected="opt.value === modelValue"
            class="qe-select__option"
            :style="opt.style"
            :class="{
              'qe-select__option--active': i === activeIndex,
              'qe-select__option--selected': opt.value === modelValue,
              'qe-select__option--disabled': opt.disabled,
            }"
            @click="selectOption(opt)"
            @mousemove="activeIndex = i"
          >
            <span class="qe-select__option-label">
              <component :is="opt.icon" v-if="opt.icon" class="qe-select__option-icon" />
              {{ opt.label }}
            </span>
            <svg v-if="opt.value === modelValue" class="qe-select__check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useId, type Component } from 'vue';
import { useFloatingPanel } from '../composables/useFloatingPanel';

export interface QeSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  /** Leading icon component rendered before the label, in both the trigger and the option row. */
  icon?: Component;
  /** Inline style applied to the option (and the trigger label when selected) — e.g. font previews. */
  style?: Record<string, string>;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined;
    options: QeSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    tone?: 'default' | 'danger';
    id?: string;
    ariaLabel?: string;
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
    size: 'md',
    tone: 'default',
    id: undefined,
    ariaLabel: undefined,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'change', value: string | number | null): void;
}>();

defineOptions({ inheritAttrs: false });

const panelId = useId();
const { triggerRef, panelRef, open, panelStyle, show, hide, focusTrigger } = useFloatingPanel(288);
const activeIndex = ref(-1);

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue));

async function toggle() {
  if (props.disabled) return;
  if (open.value) {
    hide();
    return;
  }
  const currentIndex = props.options.findIndex((o) => o.value === props.modelValue);
  activeIndex.value = currentIndex >= 0 ? currentIndex : 0;
  await show();
}

function selectOption(opt: QeSelectOption) {
  if (opt.disabled) return;
  if (opt.value !== props.modelValue) {
    emit('update:modelValue', opt.value);
    emit('change', opt.value);
  }
  hide();
  focusTrigger();
}

function moveActive(delta: number) {
  const enabled = props.options.map((o, i) => ({ o, i })).filter((x) => !x.o.disabled);
  if (enabled.length === 0) return;
  const currentPos = enabled.findIndex((x) => x.i === activeIndex.value);
  const nextPos = ((currentPos < 0 ? -delta : currentPos + delta) + enabled.length) % enabled.length;
  activeIndex.value = enabled[nextPos].i;
  panelRef.value
    ?.querySelector(`#${panelId}-opt-${activeIndex.value}`)
    ?.scrollIntoView({ block: 'nearest' });
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    if (!open.value) toggle();
    else if (e.key === 'ArrowDown') moveActive(1);
    else if (e.key === 'ArrowUp') moveActive(-1);
  }
}

function onPanelKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    hide();
    focusTrigger();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveActive(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveActive(-1);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const opt = props.options[activeIndex.value];
    if (opt) selectOption(opt);
  } else if (e.key === 'Tab') {
    hide();
  }
}
</script>

<style scoped>
.qe-select {
  position: relative;
  display: block;
  width: 100%;
}

.qe-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: var(--qs-control-height, 2.25rem);
  padding: 0.4375rem 0.75rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: left;
  color: #334155;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: border-color var(--transition-fast, 150ms ease), box-shadow var(--transition-fast, 150ms ease);
}

.qe-select__trigger:hover {
  border-color: color-mix(in srgb, var(--color-primary, #148447) 35%, #e2e8f0);
}

.qe-select--open .qe-select__trigger,
.qe-select__trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary, #148447);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary, #148447) 14%, transparent);
}

.qe-select--disabled .qe-select__trigger {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f8fafc;
}

.qe-select--danger .qe-select__trigger {
  border-color: #fecaca;
}
.qe-select--danger.qe-select--open .qe-select__trigger,
.qe-select--danger .qe-select__trigger:focus-visible {
  border-color: #f87171;
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.16);
}

.qe-select__value {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qe-select__option-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.7;
}

.qe-select__value--placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.qe-select__chevron {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  color: #94a3b8;
  transition: transform var(--transition-fast, 150ms ease);
}

.qe-select--open .qe-select__chevron {
  transform: rotate(180deg);
  color: var(--color-primary, #148447);
}

/* Sizes */
.qe-select--sm .qe-select__trigger {
  min-height: 2rem;
  padding: 0.3125rem 0.625rem;
  font-size: 0.6875rem;
  border-radius: var(--radius-md, 0.625rem);
}

.qe-select--lg .qe-select__trigger {
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

/* Panel (teleported to body) */
.qe-select__panel {
  z-index: 1000;
  overflow-y: auto;
  margin: 0;
  padding: 0.375rem;
  list-style: none;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: var(--shadow-md, 0 14px 42px rgba(15, 23, 42, 0.12));
}

.qe-select__empty {
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
}

.qe-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  border-radius: var(--radius-md, 0.625rem);
  cursor: pointer;
}

.qe-select__option-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qe-select__option--active {
  background: color-mix(in srgb, var(--color-primary, #148447) 8%, white);
}

.qe-select__option--selected {
  color: var(--color-primary, #148447);
}

.qe-select__option--disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.qe-select__check {
  flex-shrink: 0;
  width: 0.9rem;
  height: 0.9rem;
  color: var(--color-primary, #148447);
}

.qe-select-panel-enter-active,
.qe-select-panel-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.qe-select-panel-enter-from,
.qe-select-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
