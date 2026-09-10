<template>
  <div class="space-y-6">
    <!-- Date Range Filter -->
    <div class="card flex flex-wrap items-center gap-3 p-4">
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
      <section class="card relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-surface-raised/70">
          <LoadingSpinner size="md" />
        </div>
        <div class="card-header">
          <h3 class="text-h3 font-semibold text-fg">{{ t('dashboard.modelDistribution') }}</h3>
        </div>
        <div class="card-body flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div class="h-48 w-48 shrink-0">
            <Doughnut v-if="modelData" :data="modelData" :options="doughnutOptions" />
            <div v-else class="flex h-full items-center justify-center text-body text-fg-muted">{{ t('dashboard.noDataAvailable') }}</div>
          </div>
          <div class="max-h-48 w-full min-w-0 flex-1 overflow-auto">
            <table class="w-full">
              <thead>
                <tr class="text-label font-medium text-fg-muted">
                  <th class="pb-2 text-left font-medium">{{ t('dashboard.model') }}</th>
                  <th class="pb-2 text-right font-medium">{{ t('dashboard.requests') }}</th>
                  <th class="pb-2 text-right font-medium">{{ t('dashboard.tokens') }}</th>
                  <th class="pb-2 text-right font-medium">{{ t('dashboard.actual') }}</th>
                  <th class="pb-2 text-right font-medium">{{ t('dashboard.standard') }}</th>
                </tr>
              </thead>
              <tbody class="text-body">
                <tr v-for="model in models" :key="model.model" class="border-t border-border">
                  <td class="max-w-[100px] truncate py-1.5 font-medium text-fg" :title="model.model">{{ model.model }}</td>
                  <td class="py-1.5 text-right font-mono tabular-nums text-fg-muted">{{ formatNumber(model.requests) }}</td>
                  <td class="py-1.5 text-right font-mono tabular-nums text-fg-muted">{{ formatTokens(model.total_tokens) }}</td>
                  <td class="py-1.5 text-right font-mono tabular-nums text-fg">${{ formatCost(model.actual_cost) }}</td>
                  <td class="py-1.5 text-right font-mono tabular-nums text-fg-subtle">${{ formatCost(model.cost) }}</td>
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
import type { TrendDataPoint, ModelStat } from '@/types'
import { formatCostFixed as formatCost, formatNumberLocaleString as formatNumber, formatTokensK as formatTokens } from '@/utils/format'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()

const modelData = computed(() => !props.models?.length ? null : {
  labels: props.models.map((m: ModelStat) => m.model),
  datasets: [{
    data: props.models.map((m: ModelStat) => m.total_tokens),
    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  }]
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${formatTokens(context.parsed)} tokens`
      }
    }
  }
}
</script>
