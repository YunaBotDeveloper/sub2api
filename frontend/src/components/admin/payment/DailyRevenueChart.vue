<template>
  <section class="card">
    <div class="card-header">
      <h3 class="card-title">{{ t('payment.admin.dailyRevenue') }}</h3>
    </div>
    <div class="h-64 p-4">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
      <Line v-else-if="chartData" :data="chartData" :options="chartOptions" />
      <div
        v-else
        class="flex h-full items-center justify-center text-body text-fg-muted"
      >
        {{ t('payment.admin.noData') }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useChartTheme, withAlpha } from '@/components/charts/chartTheme'
import type { DailyPaymentStats } from '@/types/payment'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const { t } = useI18n()

const props = defineProps<{
  data: DailyPaymentStats[]
  loading?: boolean
}>()

const chartTheme = useChartTheme()

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null
  const theme = chartTheme.value
  const currencies = [...new Set(props.data.flatMap(day => Object.keys(day.amount)))].sort()
  return {
    labels: props.data.map(d => d.date),
    datasets: [
      ...currencies.map((currency, index) => {
        const borderColor = theme.seriesColor(index)
        const backgroundColor = withAlpha(borderColor, 0.1)
        return {
          label: `${currency} ${t('payment.admin.revenue')}`,
          data: props.data.map(day => day.amount[currency] || 0),
          borderColor,
          backgroundColor,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
        }
      }),
      {
        label: t('payment.admin.orderCount'),
        data: props.data.map(d => d.count),
        borderColor: theme.success,
        backgroundColor: withAlpha(theme.success, 0.1),
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: { display: true, text: t('payment.admin.revenue'), color: chartTheme.value.fgMuted },
      grid: { color: chartTheme.value.border },
      ticks: { color: chartTheme.value.fgMuted },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: { display: true, text: t('payment.admin.orderCount'), color: chartTheme.value.fgMuted },
      grid: { drawOnChartArea: false },
      ticks: { color: chartTheme.value.fgMuted },
    }
  },
  plugins: {
    legend: { position: 'top' as const, labels: { color: chartTheme.value.fgMuted } },
    tooltip: chartTheme.value.tooltip,
  }
}))
</script>
