<template>
  <div v-bind="$attrs" class="qe-date" :class="[`qe-date--${size}`, { 'qe-date--open': open, 'qe-date--disabled': disabled }]">
    <button
      :id="id"
      ref="triggerRef"
      type="button"
      class="qe-date__trigger"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <span class="qe-date__value" :class="{ 'qe-date__value--placeholder': !modelValue }">
        {{ modelValue ? displayLabel : placeholder }}
      </span>
      <svg class="qe-date__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" stroke-width="1.5" />
        <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="qe-date-panel">
        <div v-if="open" ref="panelRef" class="qe-date__panel" role="dialog" aria-label="Choose date" :style="panelStyle">
          <div class="qe-date__header">
            <button type="button" class="qe-date__nav" aria-label="Previous month" @click="shiftMonth(-1)">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
            <span class="qe-date__title">{{ monthLabel }}</span>
            <button type="button" class="qe-date__nav" aria-label="Next month" @click="shiftMonth(1)">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </div>

          <div class="qe-date__weekdays">
            <span v-for="d in weekdayLabels" :key="d">{{ d }}</span>
          </div>

          <div class="qe-date__grid">
            <button
              v-for="cell in cells"
              :key="cell.iso"
              type="button"
              class="qe-date__day"
              :class="{
                'qe-date__day--muted': !cell.inMonth,
                'qe-date__day--today': cell.isToday,
                'qe-date__day--selected': cell.iso === modelValue,
              }"
              @click="selectDate(cell.iso)"
            >
              {{ cell.day }}
            </button>
          </div>

          <button v-if="modelValue" type="button" class="qe-date__today-link" @click="selectDate(todayIso)">
            Today
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFloatingPanel } from '../composables/useFloatingPanel';

const props = withDefaults(
  defineProps<{
    modelValue: string | null | undefined;
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    id?: string;
    ariaLabel?: string;
  }>(),
  {
    placeholder: 'Select date',
    disabled: false,
    size: 'md',
    id: undefined,
    ariaLabel: undefined,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

defineOptions({ inheritAttrs: false });

const { triggerRef, panelRef, open, panelStyle, show, hide, focusTrigger } = useFloatingPanel(360, {
  matchTriggerWidth: false,
});

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const displayFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

const today = new Date();
const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth());

function syncViewToModelValue() {
  const parsed = props.modelValue ? parseIso(props.modelValue) : null;
  viewYear.value = parsed ? parsed.year : today.getFullYear();
  viewMonth.value = parsed ? parsed.month : today.getMonth();
}

const monthLabel = computed(() => monthFormatter.format(new Date(viewYear.value, viewMonth.value, 1)));

const displayLabel = computed(() => {
  const parsed = props.modelValue ? parseIso(props.modelValue) : null;
  if (!parsed) return '';
  return displayFormatter.format(new Date(parsed.year, parsed.month, parsed.day));
});

const cells = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear.value, viewMonth.value, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
    return {
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === viewMonth.value,
      isToday: iso === todayIso,
    };
  });
});

function shiftMonth(delta: number) {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = next.getFullYear();
  viewMonth.value = next.getMonth();
}

function selectDate(iso: string) {
  if (iso !== props.modelValue) {
    emit('update:modelValue', iso);
    emit('change', iso);
  }
  hide();
  focusTrigger();
}

function onTriggerClick() {
  if (props.disabled) return;
  if (open.value) {
    hide();
    return;
  }
  syncViewToModelValue();
  show();
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (!open.value) onTriggerClick();
  } else if (e.key === 'Escape' && open.value) {
    e.preventDefault();
    hide();
  }
}
</script>

<style scoped>
.qe-date {
  position: relative;
  display: block;
  width: 100%;
}

.qe-date__trigger {
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

.qe-date__trigger:hover {
  border-color: color-mix(in srgb, var(--color-primary, #148447) 35%, #e2e8f0);
}

.qe-date--open .qe-date__trigger,
.qe-date__trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary, #148447);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary, #148447) 14%, transparent);
}

.qe-date--disabled .qe-date__trigger {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f8fafc;
}

.qe-date__value--placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.qe-date__icon {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  color: #94a3b8;
}

.qe-date--open .qe-date__icon {
  color: var(--color-primary, #148447);
}

.qe-date--sm .qe-date__trigger {
  min-height: 2rem;
  padding: 0.3125rem 0.625rem;
  font-size: 0.6875rem;
  border-radius: var(--radius-md, 0.625rem);
}

.qe-date--lg .qe-date__trigger {
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

/* Panel (teleported to body) */
.qe-date__panel {
  z-index: 1000;
  min-width: 22rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: var(--shadow-md, 0 14px 42px rgba(15, 23, 42, 0.12));
}

.qe-date__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.qe-date__title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0f172a;
}

.qe-date__nav {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md, 0.625rem);
  color: #64748b;
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease), color var(--transition-fast, 150ms ease);
}

.qe-date__nav:hover {
  background: color-mix(in srgb, var(--color-primary, #148447) 8%, white);
  color: var(--color-primary, #148447);
}

.qe-date__nav svg {
  width: 1.125rem;
  height: 1.125rem;
}

.qe-date__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.125rem;
}

.qe-date__weekdays span {
  display: grid;
  place-items: center;
  height: 1.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #94a3b8;
}

.qe-date__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

.qe-date__day {
  display: grid;
  place-items: center;
  min-height: 2.75rem;
  min-width: 2.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  border-radius: var(--radius-md, 0.625rem);
  cursor: pointer;
  transition: background var(--transition-fast, 150ms ease), color var(--transition-fast, 150ms ease);
}

.qe-date__day:hover {
  background: color-mix(in srgb, var(--color-primary, #148447) 10%, white);
}

.qe-date__day--muted {
  color: #cbd5e1;
}

.qe-date__day--today {
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--color-primary, #148447) 45%, transparent);
}

.qe-date__day--selected {
  background: var(--color-primary, #148447);
  color: #ffffff;
}

.qe-date__day--selected:hover {
  background: var(--color-primary, #148447);
}

.qe-date__today-link {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.4375rem 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  color: var(--color-primary, #148447);
  border-top: 1px solid #f1f5f9;
  cursor: pointer;
}

.qe-date__today-link:hover {
  background: color-mix(in srgb, var(--color-primary, #148447) 6%, white);
  border-radius: var(--radius-md, 0.625rem);
}

.qe-date-panel-enter-active,
.qe-date-panel-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.qe-date-panel-enter-from,
.qe-date-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
