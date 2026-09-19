<template>
  <div class="space-y-4">
    <!-- Quick amounts: a printed tier grid -->
    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <label class="input-label mb-0">
          {{ t('payment.quickAmounts') }}
        </label>
        <div v-if="currencyOptions.length > 1" class="inline-flex border border-border-strong">
          <button
            v-for="code in currencyOptions"
            :key="code"
            type="button"
            :class="[
              'min-h-[32px] px-2.5 py-1 text-meta font-semibold transition-colors',
              code === currency
                ? 'bg-accent text-white dark:text-surface-sunken'
                : 'text-fg-muted hover:text-accent-strong',
            ]"
            @click="emit('update:currency', code)"
          >
            {{ code }}
          </button>
        </div>
      </div>
      <div class="grid grid-cols-3 border-l border-t border-border">
        <button
          v-for="amt in filteredAmounts"
          :key="amt"
          type="button"
          :class="[
            'min-h-[48px] border-b border-r border-border px-3 py-3 text-center text-body font-semibold tabular-nums transition-colors',
            modelValue === amt
              ? 'bg-accent-weak text-accent-strong ring-2 ring-inset ring-accent'
              : 'bg-surface text-fg hover:bg-accent-weak/50',
          ]"
          @click="selectAmount(amt)"
        >
          {{ formatQuickAmount(amt) }}
        </button>
      </div>
    </div>

    <!-- Custom Amount Input -->
    <div>
      <label class="input-label">
        {{ t('payment.customAmount') }}
      </label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
          {{ currencySymbol(currency) }}
        </span>
        <input
          type="text"
          inputmode="decimal"
          :value="customText"
          :placeholder="placeholderText"
          class="input w-full py-3 pl-8 pr-4 text-h3 font-semibold tabular-nums"
          @input="handleInput"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DEFAULT_PAYMENT_CURRENCY,
  currencySymbol,
  formatPaymentAmount,
  paymentCurrencyFractionDigits,
} from './currency'

const props = withDefaults(defineProps<{
  amounts?: number[]
  modelValue: number | null
  min?: number
  max?: number
  /** Currency the typed amount is in. Drives the symbol and the decimals allowed. */
  currency?: string
  /** Currencies the user may switch between. One entry hides the switch. */
  currencyOptions?: string[]
}>(), {
  amounts: () => [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  min: 0,
  max: 0,
  currency: DEFAULT_PAYMENT_CURRENCY,
  currencyOptions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:currency': [value: string]
}>()

const i18n = useI18n()
const { t } = i18n

const customText = ref('')

// 0 = no limit
const filteredAmounts = computed(() =>
  props.amounts.filter((a) => (props.min <= 0 || a >= props.min) && (props.max <= 0 || a <= props.max))
)

const placeholderText = computed(() => {
  const min = formatQuickAmount(props.min)
  const max = formatQuickAmount(props.max)
  if (props.min > 0 && props.max > 0) return `${min} - ${max}`
  if (props.min > 0) return `≥ ${min}`
  if (props.max > 0) return `≤ ${max}`
  return t('payment.enterAmount')
})

// Zero-decimal currencies (VND) must not accept a fractional part at all.
const amountPattern = computed(() => {
  const digits = paymentCurrencyFractionDigits(props.currency)
  return digits > 0 ? new RegExp(String.raw`^\d*(\.\d{0,${digits}})?$`) : /^\d*$/
})

// 1000000 读起来要数零；带分隔符的 ₫1,000,000 才看得出是一百万。
function formatQuickAmount(amt: number): string {
  return formatPaymentAmount(amt, props.currency, i18n.locale?.value ?? 'en')
}

function selectAmount(amt: number) {
  customText.value = String(amt)
  emit('update:modelValue', amt)
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value
  if (!amountPattern.value.test(val)) {
    input.value = customText.value
    return
  }
  customText.value = val
  if (val === '') {
    emit('update:modelValue', null)
    return
  }
  const num = parseFloat(val)
  if (!isNaN(num) && num > 0) {
    emit('update:modelValue', num)
  } else {
    emit('update:modelValue', null)
  }
}

watch(() => props.modelValue, (v) => {
  if (v !== null && String(v) !== customText.value) {
    customText.value = String(v)
  }
}, { immediate: true })
</script>
