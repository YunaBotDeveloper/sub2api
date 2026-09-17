<template>
  <!-- One column of a printed tier table: header band (name + price), ruled terms, action -->
  <div class="-ml-px -mt-px flex flex-col border border-border bg-surface">
    <!-- Header: name + badge + price -->
    <div class="flex items-start justify-between gap-2 border-b-2 border-accent bg-accent-weak px-4 py-3">
      <div class="min-w-0 flex-1">
        <h3
          :title="plan.name"
          class="h-12 min-w-0 break-words [overflow-wrap:anywhere] text-base font-bold leading-6 text-accent-strong line-clamp-2"
        >
          {{ plan.name }}
        </h3>
        <p v-if="plan.description" class="mt-0.5 text-meta text-fg-muted line-clamp-2">
          {{ plan.description }}
        </p>
      </div>
      <div class="shrink-0 text-right">
        <div class="flex items-baseline justify-end gap-1">
          <span class="text-meta text-fg-muted">{{ planCurrencySymbol }}</span>
          <span class="text-h1 font-bold tabular-nums tracking-tight text-fg">{{ plan.price }}</span>
          <span v-if="plan.currency" class="text-meta font-medium text-fg-muted">{{ plan.currency }}</span>
        </div>
        <div class="mt-0.5 flex items-center justify-end gap-1">
          <span class="badge shrink-0">
            {{ pLabel }}
          </span>
          <span class="text-meta text-fg-muted">/ {{ validitySuffix }}</span>
        </div>
        <div v-if="plan.original_price" class="mt-0.5 flex items-center justify-end gap-1.5">
          <span class="text-meta tabular-nums text-fg-subtle line-through">{{ planCurrencySymbol }}{{ plan.original_price }}<template v-if="plan.currency"> {{ plan.currency }}</template></span>
          <span v-if="discountText" class="badge badge-success">{{ discountText }}</span>
        </div>
      </div>
    </div>

    <!-- Tier terms: ruled rows -->
    <dl class="divide-y divide-border border-b border-border text-label">
      <div class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.rate') }}</dt>
        <dd class="font-semibold tabular-nums text-fg">{{ rateDisplay }}</dd>
      </div>
      <div v-if="hasPeakRate" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.peakRate') }}</dt>
        <dd class="text-right font-semibold text-warning">{{ peakRateDisplay }}</dd>
      </div>
      <div v-if="plan.daily_limit_usd != null" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.dailyLimit') }}</dt>
        <dd class="font-semibold tabular-nums text-fg">${{ plan.daily_limit_usd }}</dd>
      </div>
      <div v-if="plan.weekly_limit_usd != null" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.weeklyLimit') }}</dt>
        <dd class="font-semibold tabular-nums text-fg">${{ plan.weekly_limit_usd }}</dd>
      </div>
      <div v-if="plan.monthly_limit_usd != null" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.monthlyLimit') }}</dt>
        <dd class="font-semibold tabular-nums text-fg">${{ plan.monthly_limit_usd }}</dd>
      </div>
      <div v-if="plan.daily_limit_usd == null && plan.weekly_limit_usd == null && plan.monthly_limit_usd == null" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.quota') }}</dt>
        <dd class="font-semibold text-fg">{{ t('payment.planCard.unlimited') }}</dd>
      </div>
      <div v-if="modelScopeLabels.length > 0" class="flex items-center justify-between gap-3 px-4 py-1.5">
        <dt class="text-fg-muted">{{ t('payment.planCard.models') }}</dt>
        <dd class="flex flex-wrap justify-end gap-1">
          <span v-for="scope in modelScopeLabels" :key="scope" class="badge">
            {{ scope }}
          </span>
        </dd>
      </div>
    </dl>

    <!-- Features list -->
    <ul v-if="plan.features.length > 0" class="space-y-1 px-4 pt-3">
      <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-1.5">
        <svg class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span class="text-meta text-fg">{{ feature }}</span>
      </li>
    </ul>

    <div class="flex-1" />

    <!-- Subscribe Button -->
    <div class="p-4">
      <button
        type="button"
        class="btn btn-primary w-full"
        @click="emit('select', plan)"
      >
        {{ isRenewal ? t('payment.renewNow') : t('payment.subscribeNow') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubscriptionPlan } from '@/types/payment'
import type { UserSubscription } from '@/types'
import { useAppStore } from '@/stores/app'
import { hasPeakRate as groupHasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { planValiditySuffix } from './validity'
import { currencySymbol } from '@/components/payment/currency'
import { platformLabel } from '@/utils/platformColors'

const props = defineProps<{ plan: SubscriptionPlan; activeSubscriptions?: UserSubscription[] }>()
const emit = defineEmits<{ select: [plan: SubscriptionPlan] }>()
const { t } = useI18n()

const platform = computed(() => props.plan.group_platform || '')
const isRenewal = computed(() =>
  props.activeSubscriptions?.some(s => s.group_id === props.plan.group_id && s.status === 'active') ?? false
)

const pLabel = computed(() => platformLabel(platform.value))

const discountText = computed(() => {
  if (!props.plan.original_price || props.plan.original_price <= 0) return ''
  const pct = Math.round((1 - props.plan.price / props.plan.original_price) * 100)
  return pct > 0 ? `-${pct}%` : ''
})

const rateDisplay = computed(() => {
  const rate = props.plan.rate_multiplier ?? 1
  return `×${Number(rate.toPrecision(10))}`
})

const appStore = useAppStore()
const planCurrencySymbol = computed(() => currencySymbol(props.plan.currency || 'USD'))

const hasPeakRate = computed(() => groupHasPeakRate(props.plan))

const peakRateDisplay = computed(() => {
  return formatPeakRateWindow(props.plan, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
})

const MODEL_SCOPE_LABELS: Record<string, string> = {
  claude: 'Claude',
  gemini_text: 'Gemini',
  gemini_image: 'Imagen',
}

const modelScopeLabels = computed(() => {
  if (platform.value !== 'antigravity') return []
  const scopes = props.plan.supported_model_scopes
  if (!scopes || scopes.length === 0) return []
  return scopes.map(s => MODEL_SCOPE_LABELS[s] || s)
})

const validitySuffix = computed(() => planValiditySuffix(props.plan, t))
</script>
