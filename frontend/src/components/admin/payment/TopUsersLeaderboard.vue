<template>
  <section class="card">
    <div class="card-header">
      <h3 class="card-title">{{ t('payment.admin.topUsers') }}</h3>
    </div>
    <div
      v-if="!hasUsers(props.users)"
      class="flex h-32 items-center justify-center text-body text-fg-muted"
    >
      {{ t('payment.admin.noData') }}
    </div>
    <div v-else class="overflow-x-auto">
      <table class="table">
        <template v-for="[currency, currencyUsers] in sortedUsers(props.users)" :key="currency">
          <thead>
            <tr>
              <th class="w-10 text-right">#</th>
              <th colspan="2">{{ currency }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in currencyUsers" :key="user.user_id">
              <td class="text-right tabular-nums" :class="rankClass(idx)">{{ idx + 1 }}</td>
              <td class="max-w-[14rem] truncate">{{ user.email }}</td>
              <td class="text-right font-semibold tabular-nums">{{ formatMoney(currency, user.amount) }}</td>
            </tr>
          </tbody>
        </template>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TopUserPaymentStats } from '@/types/payment'

const { t } = useI18n()

const props = defineProps<{
  users: Record<string, TopUserPaymentStats[]>
}>()

// 名次列：前三名加粗，其余淡色
function rankClass(idx: number): string {
  return idx < 3 ? 'font-bold text-accent-strong' : 'text-fg-muted'
}

function hasUsers(usersByCurrency: Record<string, TopUserPaymentStats[]>): boolean {
  return Object.values(usersByCurrency).some(users => users.length > 0)
}

function sortedUsers(usersByCurrency: Record<string, TopUserPaymentStats[]>): [string, TopUserPaymentStats[]][] {
  return Object.entries(usersByCurrency).sort(([left], [right]) => left.localeCompare(right))
}

function formatMoney(currency: string, amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}
</script>
