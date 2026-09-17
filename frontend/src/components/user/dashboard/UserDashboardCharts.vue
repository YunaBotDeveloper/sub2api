<template>
  <div class="space-y-6">
    <!-- Date Range Filter -->
    <div class="flex flex-wrap items-center gap-3 border-b border-border pb-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-label font-medium text-fg-muted">{{ t('dashboard.timeRange') }}</span>
        <DateRangePicker :start-date="startDate" :end-date="endDate" @update:startDate="$emit('update:startDate', $event)" @update:endDate="$emit('update:endDate', $event)" @change="$emit('dateRangeChange', $event)" />
      </div>
      <button type="button" @click="$emit('refresh')" :disabled="loading" class="btn btn-secondary btn-sm">
        {{ t('common.refresh') }}
      </button>
      <div class="flex items-center gap-2 sm:ml-auto">
        <span class="text-label font-medium text-fg-muted">{{ t('dashboard.granularity') }}</span>
        <div class="w-28">
          <Select :model-value="granularity" :options="[{value:'day', label:t('dashboard.day')}, {value:'hour', label:t('dashboard.hour')}]" @update:model-value="$emit('update:granularity', $event)" @change="$emit('granularityChange')" />
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Model Distribution Chart -->
      <section class="card relative">
        <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-surface-raised/70">
          <LoadingSpinner size="md" />
        </div>
        <div class="card-header">
          <h3 class="card-title">{{ t('dashboard.modelDistribution') }}</h3>
        </div>
        <div class="card-body flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div class="h-48 w-48 shrink-0">
            <Doughnut v-if="modelData" :data="modelData" :options="doughnutOptions" />
            <div v-else class="flex h-full items-center justify-center text-body text-fg-muted">{{ t('dashboard.noDataAvailable') }}</div>
          </div>
          <div class="table-container max-h-48 w-full min-w-0 flex-1 overflow-auto">
            <table class="table text-label">
              <thead>
                <tr>
                  <th>{{ t('dashboard.model') }}</th>
                  <th class="text-right">{{ t('dashboard.requests') }}</th>
                  <th class="text-right">{{ t('dashboard.tokens') }}</th>
                  <th class="text-right">{{ t('dashboard.actual') }}</th>
                  <th class="text-right">{{ t('dashboard.standard') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(model, i) in models" :key="model.model">
                  <td class="max-w-[140px] truncate font-mono" :title="model.model">
                    <span class="mr-1.5 inline-block h-2 w-2 align-middle" :style="{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }" aria-hidden="true"></span>{{ model.model }}
                  </td>
                  <td class="text-right tabular-nums text-fg-muted">{{ formatNumber(model.requests) }}</td>
                  <td class="text-right tabular-nums text-fg-muted">{{ formatTokens(model.total_tokens) }}</td>
                  <td class="text-right font-semibold tabular-nums">${{ formatCost(model.actual_cost) }}</td>
                  <td class="text-right tabular-nums text-fg-subtle">${{ formatCost(model.cost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Token Usage Trend Chart -->
      <TokenUsageTrend :trend-data="trend" :loading="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import { Doughnut } from 'vue-chartjs'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import { useChartTheme } from '@/components/charts/chartTheme'
import type { TrendDataPoint, ModelStat } from '@/types'
import { formatCostFixed as formatCost, formatNumberLocaleString as formatNumber, formatTokensK as formatTokens } from '@/utils/format'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()

// 账单印刷色：取自共享图表主题（电表黄保留给当前读数）
const chartTheme = useChartTheme()
const MODEL_COLORS = computed(() => chartTheme.value.series)

const modelData = computed(() => !props.models?.length ? null : {
  labels: props.models.map((m: ModelStat) => m.model),
  datasets: [{
    data: props.models.map((m: ModelStat) => m.total_tokens),
    backgroundColor: MODEL_COLORS.value,
    borderColor: chartTheme.value.surface
  }]
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...chartTheme.value.tooltip,
      callbacks: {
        label: (context: any) => `${context.label}: ${formatTokens(context.parsed)} tokens`
      }
    }
  }
}))
</script>
