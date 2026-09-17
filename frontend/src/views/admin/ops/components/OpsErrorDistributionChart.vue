<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, ArcElement, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import type { OpsErrorDistributionResponse } from '@/api/admin/ops'
import type { ChartState } from '../types'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useChartTheme } from '@/components/charts/chartTheme'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  data: OpsErrorDistributionResponse | null
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'openDetails'): void
}>()
const { t } = useI18n()

const chartTheme = useChartTheme()
const colors = computed(() => ({
  client: chartTheme.value.accent,
  system: chartTheme.value.danger,
  upstream: chartTheme.value.warning,
  other: chartTheme.value.borderStrong,
  text: chartTheme.value.fgMuted
}))

const totalSlaErrors = computed(() =>
  (props.data?.items ?? []).reduce((total, item) => total + Number(item.sla || 0), 0)
)

const hasData = computed(() => totalSlaErrors.value > 0)

const state = computed<ChartState>(() => {
  if (hasData.value) return 'ready'
  if (props.loading) return 'loading'
  return 'empty'
})

interface ErrorCategory {
  label: string
  count: number
  color: string
}

const categories = computed<ErrorCategory[]>(() => {
  if (!props.data) return []

  let upstream = 0 // 502, 503, 504
  let client = 0 // 4xx
  let system = 0 // 500
  let other = 0

  for (const item of props.data.items || []) {
    const code = Number(item.status_code || 0)
    const count = Number(item.sla || 0)
    if (!Number.isFinite(code) || !Number.isFinite(count)) continue

    if ([502, 503, 504].includes(code)) upstream += count
    else if (code >= 400 && code < 500) client += count
    else if (code === 500) system += count
    else other += count
  }

  const out: ErrorCategory[] = []
  if (upstream > 0) out.push({ label: t('admin.ops.upstream'), count: upstream, color: colors.value.upstream })
  if (client > 0) out.push({ label: t('admin.ops.client'), count: client, color: colors.value.client })
  if (system > 0) out.push({ label: t('admin.ops.system'), count: system, color: colors.value.system })
  if (other > 0) out.push({ label: t('admin.ops.other'), count: other, color: colors.value.other })
  return out
})

const topReason = computed(() => {
  if (categories.value.length === 0) return null
  return categories.value.reduce((prev, cur) => (cur.count > prev.count ? cur : prev))
})

const chartData = computed(() => {
  if (!hasData.value || categories.value.length === 0) return null
  return {
    labels: categories.value.map((c) => c.label),
    datasets: [
      {
        data: categories.value.map((c) => c.count),
        backgroundColor: categories.value.map((c) => c.color),
        borderWidth: 0
      }
    ]
  }
})

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: chartTheme.value.tooltip
  }
}))
</script>

<template>
  <div class="card flex h-full flex-col">
    <div class="card-header flex items-center justify-between gap-2 px-4 py-2.5">
      <h3 class="card-title flex items-center gap-2 text-body">
        {{ t('admin.ops.errorDistribution') }}
        <HelpTooltip :content="t('admin.ops.tooltips.errorDistribution')" />
      </h3>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="state !== 'ready'"
        :title="t('admin.ops.errorTrend')"
        @click="emit('openDetails')"
      >
        {{ t('admin.ops.requestDetails.details') }}
      </button>
    </div>

    <div class="relative min-h-0 flex-1 p-4">
      <div v-if="state === 'ready' && chartData" class="flex h-full flex-col">
        <div class="flex-1">
          <Doughnut :data="chartData" :options="{ ...options, cutout: '65%' }" />
        </div>
        <div class="mt-4 flex flex-col items-center gap-2">
          <div v-if="topReason" class="text-xs font-bold text-fg">
            {{ t('admin.ops.top') }}: <span :style="{ color: topReason.color }">{{ topReason.label }}</span>
          </div>
          <div class="flex flex-wrap justify-center gap-3">
            <div v-for="item in categories" :key="item.label" class="flex items-center gap-1.5 text-xs">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: item.color }"></span>
              <span class="text-fg-muted">{{ item.label }} {{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex h-full items-center justify-center">
        <div v-if="state === 'loading'" class="text-sm text-fg-muted">{{ t('common.loading') }}</div>
        <EmptyState v-else :title="t('common.noData')" :description="t('admin.ops.charts.emptyError')" />
      </div>
    </div>
  </div>
</template>
