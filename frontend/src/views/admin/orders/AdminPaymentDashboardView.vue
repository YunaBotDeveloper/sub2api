<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header with Day Switcher -->
      <div class="flex items-center justify-end">
        <div class="flex items-center gap-2">
          <div class="tabs">
            <button
              v-for="d in DAYS_OPTIONS"
              :key="d"
              type="button"
              class="tab tabular-nums"
              :class="days === d ? 'tab-active' : ''"
              @click="days = d"
            >
              {{ d }}{{ t('payment.admin.daySuffix') }}
            </button>
          </div>
          <button @click="loadDashboard" :disabled="loading" class="btn btn-secondary" :title="t('common.refresh')" :aria-label="t('common.refresh')">
            <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
          </button>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
      <template v-else-if="stats">
        <OrderStatsCards :stats="stats" />
        <DailyRevenueChart :data="stats.daily_series || []" :loading="loading" />
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PaymentMethodChart :methods="stats.payment_methods || []" />
          <TopUsersLeaderboard :users="stats.top_users || {}" />
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { adminPaymentAPI } from '@/api/admin/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import type { DashboardStats } from '@/types/payment'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Icon from '@/components/icons/Icon.vue'
import OrderStatsCards from '@/components/admin/payment/OrderStatsCards.vue'
import DailyRevenueChart from '@/components/admin/payment/DailyRevenueChart.vue'
import PaymentMethodChart from '@/components/admin/payment/PaymentMethodChart.vue'
import TopUsersLeaderboard from '@/components/admin/payment/TopUsersLeaderboard.vue'

const { t } = useI18n()
const appStore = useAppStore()

const DAYS_OPTIONS = [7, 30, 90] as const
const days = ref<number>(30)
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

async function loadDashboard() {
  loading.value = true
  try {
    const res = await adminPaymentAPI.getDashboard(days.value)
    stats.value = res.data
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    loading.value = false
  }
}

watch(days, () => loadDashboard())
onMounted(() => loadDashboard())
</script>
