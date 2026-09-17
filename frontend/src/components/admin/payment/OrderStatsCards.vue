<template>
  <div class="meter">
    <!-- Today Revenue：今日读数 -->
    <div class="meter-cell meter-cell-current">
      <p class="meter-label">{{ t('payment.admin.todayRevenue') }}</p>
      <p v-for="[currency, amount] in sortedAmounts(stats.today_amount)" :key="currency" class="meter-value">
        {{ formatMoney(currency, amount) }}
      </p>
      <p class="meter-sub tabular-nums">{{ stats.today_count }} {{ t('payment.admin.orders') }}</p>
    </div>

    <!-- Total Revenue -->
    <div class="meter-cell">
      <p class="meter-label">{{ t('payment.admin.totalRevenue') }}</p>
      <p v-for="[currency, amount] in sortedAmounts(stats.total_amount)" :key="currency" class="meter-value">
        {{ formatMoney(currency, amount) }}
      </p>
      <p class="meter-sub tabular-nums">{{ stats.total_count }} {{ t('payment.admin.orders') }}</p>
    </div>

    <!-- Today Orders -->
    <div class="meter-cell">
      <p class="meter-label">{{ t('payment.admin.todayOrders') }}</p>
      <p class="meter-value">{{ stats.today_count }}</p>
    </div>

    <!-- Average Amount -->
    <div class="meter-cell">
      <p class="meter-label">{{ t('payment.admin.avgAmount') }}</p>
      <p v-for="[currency, amount] in sortedAmounts(stats.avg_amount)" :key="currency" class="meter-value">
        {{ formatMoney(currency, amount) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CurrencyAmounts, DashboardStats } from '@/types/payment'

const { t } = useI18n()

defineProps<{
  stats: DashboardStats
}>()

function sortedAmounts(amounts: CurrencyAmounts): [string, number][] {
  return Object.entries(amounts).sort(([left], [right]) => left.localeCompare(right))
}

function formatMoney(currency: string, amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}
</script>
