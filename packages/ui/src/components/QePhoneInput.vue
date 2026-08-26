<template>
  <div v-bind="$attrs" class="qe-phone" :class="[`qe-phone--${size}`, { 'qe-phone--invalid': showError, 'qe-phone--disabled': disabled }]">
    <div class="qe-phone__field" :class="{ 'qe-phone__field--focused': focused }">
      <svg class="qe-phone__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M6.5 3.5h-2A1.5 1.5 0 0 0 3 5v1.5c0 6.075 4.925 11 11 11H15.5A1.5 1.5 0 0 0 17 16v-2c0-.474-.316-.89-.772-1.017l-2.788-.774a1.5 1.5 0 0 0-1.6.508l-.435.58a9.06 9.06 0 0 1-3.93-3.93l.58-.436a1.5 1.5 0 0 0 .508-1.6L7.79 4.272A1.5 1.5 0 0 0 6.5 3.5Z"
          stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"
        />
      </svg>
      <input
        :id="id"
        ref="inputRef"
        v-model="displayValue"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        class="qe-phone__input"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-label="ariaLabel"
        :aria-invalid="showError"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
    <p v-if="showError" class="qe-phone__error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { validatePhone, normalizeKenyaPhone, displayPhone } from '@qesuite/shared';

const props = withDefaults(
  defineProps<{
    modelValue: string | null | undefined;
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    required?: boolean;
    errorMessage?: string;
    id?: string;
    ariaLabel?: string;
  }>(),
  {
    placeholder: '0712 345 678',
    disabled: false,
    size: 'md',
    required: false,
    errorMessage: 'Enter a valid Kenyan phone number, e.g. 0712345678',
    id: undefined,
    ariaLabel: undefined,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

defineOptions({ inheritAttrs: false });

const inputRef = ref<HTMLInputElement | null>(null);
const displayValue = ref(props.modelValue ? displayPhone(props.modelValue) : '');
const focused = ref(false);
const touched = ref(false);

// Resync from an externally-changed modelValue (e.g. form reset/prefill) —
// but never while the user is actively typing, or we'd clobber their input.
watch(
  () => props.modelValue,
  (value) => {
    if (focused.value) return;
    displayValue.value = value ? displayPhone(value) : '';
  }
);

const showError = computed(() => {
  if (!touched.value) return false;
  if (displayValue.value === '') return props.required;
  return !validatePhone(displayValue.value);
});

function onInput() {
  if (displayValue.value === '') {
    emit('update:modelValue', '');
  } else if (validatePhone(displayValue.value)) {
    emit('update:modelValue', normalizeKenyaPhone(displayValue.value));
  }
  // Invalid mid-typing: don't push a half-typed number up as if it were valid.
  // The parent's modelValue simply stays at its last valid value until this
  // input either clears or becomes valid.
}

function onFocus() {
  focused.value = true;
}

function onBlur() {
  focused.value = false;
  touched.value = true;
}
</script>

<style scoped>
.qe-phone {
  display: block;
  width: 100%;
}

.qe-phone__field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: var(--qs-control-height, 2.25rem);
  padding: 0.4375rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color var(--transition-fast, 150ms ease), box-shadow var(--transition-fast, 150ms ease);
}

.qe-phone__field:hover {
  border-color: color-mix(in srgb, var(--color-primary, #148447) 35%, #e2e8f0);
}

.qe-phone__field--focused {
  border-color: var(--color-primary, #148447);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary, #148447) 14%, transparent);
}

.qe-phone--invalid .qe-phone__field {
  border-color: #fecaca;
}
.qe-phone--invalid .qe-phone__field--focused {
  border-color: #f87171;
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.16);
}

.qe-phone--disabled .qe-phone__field {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f8fafc;
}

.qe-phone__icon {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  color: #94a3b8;
}

.qe-phone--invalid .qe-phone__icon {
  color: #f87171;
}

.qe-phone__input {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
}

.qe-phone__input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.qe-phone__input:disabled {
  cursor: not-allowed;
}

.qe-phone__error {
  margin: 0.3125rem 0 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #ef4444;
}

/* Sizes */
.qe-phone--sm .qe-phone__field {
  min-height: 2rem;
  padding: 0.3125rem 0.625rem;
  border-radius: var(--radius-md, 0.625rem);
}
.qe-phone--sm .qe-phone__input {
  font-size: 0.6875rem;
}

.qe-phone--lg .qe-phone__field {
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
}
.qe-phone--lg .qe-phone__input {
  font-size: 0.875rem;
}
</style>
