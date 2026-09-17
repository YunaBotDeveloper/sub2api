<template>
  <!-- 本期读数：请求 / Token / 金额（当前读数） / 平均耗时 -->
  <div class="meter">
    <div class="meter-cell">
      <p class="meter-label">{{ t('usage.totalRequests') }}</p>
      <p class="meter-value">{{ stats?.total_requests?.toLocaleString() || '0' }}</p>
      <p class="meter-sub">{{ t('usage.inSelectedRange') }}</p>
    </div>
    <div class="meter-cell">
      <p class="meter-label">{{ t('usage.totalTokens') }}</p>
      <p class="meter-value">{{ formatTokens(stats?.total_tokens || 0) }}</p>
      <p class="meter-sub flex flex-wrap items-center gap-x-1 overflow-visible whitespace-normal tabular-nums">
        <span>{{ t('usage.in') }}: {{ formatTokens(stats?.total_input_tokens || 0) }}</span>
        <span class="text-fg-subtle">/</span>
        <span>{{ t('usage.out') }}: {{ formatTokens(stats?.total_output_tokens || 0) }}</span>
        <span class="text-fg-subtle">/</span>
        <span class="group relative inline-flex cursor-help items-center gap-0.5" tabindex="0">
          <span>{{ cacheLabel() }}: {{ formatTokens(stats?.total_cache_tokens || 0) }}</span>
          <svg
            class="h-3.5 w-3.5 text-fg-subtle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span
            class="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-56 -translate-x-1/2 rounded-sm border border-border-strong bg-surface-raised p-3 text-left text-meta text-fg shadow-overlay group-hover:block group-focus:block"
          >
            <span class="mb-2 block border-b border-border pb-1 font-semibold text-accent-strong">
              {{ cacheDetailLabel() }}
            </span>
            <span class="flex items-center justify-between gap-3">
              <span>{{ t('usage.cacheCreationTokensLabel') }}</span>
              <span class="tabular-nums">
                {{ formatTokens(stats?.total_cache_creation_tokens || 0) }}
              </span>
            </span>
            <span class="mt-1 flex items-center justify-between gap-3">
              <span>{{ t('usage.cacheReadTokensLabel') }}</span>
              <span class="tabular-nums">
                {{ formatTokens(stats?.total_cache_read_tokens || 0) }}
              </span>
            </span>
          </span>
        </span>
      </p>
    </div>
    <div class="meter-cell meter-cell-current">
      <p class="meter-label">{{ t('usage.totalCost') }}</p>
      <p class="meter-value">
        ${{ (stats?.total_actual_cost || 0).toFixed(4) }}
      </p>
      <p class="meter-sub whitespace-normal tabular-nums">
        <template v-if="showAccountCost && totalAccountCost != null">
          <span>{{ t('usage.accountCost') }} ${{ totalAccountCost.toFixed(4) }}</span>
          <span> · </span>
        </template>
        <span>
          {{ t('usage.standardCost') }}
          <span :class="{ 'line-through': strikeStandardCost }">${{ (stats?.total_cost || 0).toFixed(4) }}</span>
        </span>
      </p>
    </div>
    <div class="meter-cell">
      <p class="meter-label">{{ t('usage.avgDuration') }}</p>
      <p class="meter-value">{{ formatDuration(stats?.average_duration_ms || 0) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminUsageStatsResponse } from '@/api/admin/usage'
import type { UsageStatsResponse } from '@/types'

const props = withDefaults(defineProps<{
  stats: (AdminUsageStatsResponse | UsageStatsResponse) | null
  showAccountCost?: boolean
  strikeStandardCost?: boolean
}>(), {
  showAccountCost: true,
  strikeStandardCost: false,
})

const { t } = useI18n()

const totalAccountCost = computed(() => {
  const stats = props.stats as (AdminUsageStatsResponse & { total_account_cost?: number }) | null
  return stats?.total_account_cost ?? null
})
const showAccountCost = computed(() => props.showAccountCost)
const strikeStandardCost = computed(() => props.strikeStandardCost)

const formatDuration = (ms: number) =>
  ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`

const formatTokens = (value: number) => {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K'
  return value.toLocaleString()
}

const cacheLabel = () => t('usage.cacheTotal')
const cacheDetailLabel = () => t('usage.cacheBreakdown')
</script>
