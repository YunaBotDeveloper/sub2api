<template>
  <BaseDialog :show="show" :title="t('admin.users.balanceHistoryTitle')" width="wide" :close-on-click-outside="true" :z-index="40" @close="$emit('close')">
    <div v-if="user" class="space-y-4">
      <!-- User header: two-row layout with full user info -->
      <div class="border-b-2 border-accent pb-3">
        <!-- Row 1: avatar + email/username/created_at (left) + current balance (right) -->
        <div class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-medium text-fg">{{ user.email }}</p>
              <span v-if="user.deleted_at" class="badge badge-danger flex-shrink-0">
                {{ t('admin.usage.userDeletedBadge') }}
              </span>
              <span
                v-if="user.username"
                class="badge badge-gray flex-shrink-0"
              >
                {{ user.username }}
              </span>
            </div>
            <p class="text-xs tabular-nums text-fg-subtle">
              {{ t('admin.users.createdAt') }}: {{ formatDateTime(user.created_at) }}
            </p>
          </div>
          <!-- Current balance: prominent display on the right -->
          <div class="flex-shrink-0 text-right">
            <p class="text-xs text-fg-muted">{{ t('admin.users.currentBalance') }}</p>
            <p class="text-h1 font-bold tabular-nums text-fg">
              ${{ user.balance?.toFixed(2) || '0.00' }}
            </p>
          </div>
        </div>
        <!-- Row 2: notes + total recharged -->
        <div class="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
          <p class="min-w-0 flex-1 truncate text-xs text-fg-muted" :title="user.notes || ''">
            <template v-if="user.notes">{{ t('admin.users.notes') }}: {{ user.notes }}</template>
            <template v-else>&nbsp;</template>
          </p>
          <p class="ml-4 flex-shrink-0 text-xs text-fg-muted">
            {{ t('admin.users.totalRecharged') }}: <span class="font-semibold tabular-nums text-fg">${{ totalRecharged.toFixed(2) }}</span>
          </p>
        </div>
      </div>

      <!-- Type filter + Action buttons -->
      <div class="flex items-center gap-3">
        <Select
          v-model="typeFilter"
          :options="typeOptions"
          class="w-56"
          @change="loadHistory(1)"
        />
        <!-- Deposit button - matches menu style -->
        <button
          v-if="!hideActions"
          @click="emit('deposit')"
          class="btn btn-secondary"
        >
          <Icon name="plus" size="sm" class="text-accent" :stroke-width="2" />
          {{ t('admin.users.deposit') }}
        </button>
        <!-- Withdraw button - matches menu style -->
        <button
          v-if="!hideActions"
          @click="emit('withdraw')"
          class="btn btn-secondary"
        >
          <svg class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
          {{ t('admin.users.withdraw') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <svg class="h-8 w-8 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="history.length === 0" class="py-8 text-center">
        <p class="text-sm text-fg-muted">{{ t('admin.users.noBalanceHistory') }}</p>
      </div>

      <!-- History list -->
      <div v-else class="max-h-[28rem] divide-y divide-border overflow-y-auto border-y border-border">
        <div
          v-for="item in history"
          :key="item.id"
          class="px-1 py-3"
        >
          <div class="flex items-start justify-between">
            <!-- Left: type icon + description -->
            <div class="flex items-start gap-3">
              <Icon :name="getIconName(item)" size="sm" :class="['mt-0.5 flex-shrink-0', getIconColor(item)]" />
              <div>
                <p class="text-sm font-medium text-fg">
                  {{ getItemTitle(item) }}
                </p>
                <!-- Notes (admin adjustment reason) -->
                <p
                  v-if="item.notes"
                  class="mt-0.5 text-xs text-fg-muted"
                  :title="item.notes"
                >
                  {{ item.notes.length > 60 ? item.notes.substring(0, 55) + '...' : item.notes }}
                </p>
                <p class="mt-0.5 text-xs tabular-nums text-fg-subtle">
                  {{ formatDateTime(item.used_at || item.created_at) }}
                </p>
              </div>
            </div>
            <!-- Right: value -->
            <div class="text-right">
              <p :class="['text-sm font-semibold tabular-nums', getValueColor(item)]">
                {{ formatValue(item) }}
              </p>
              <p
                v-if="isAdminType(item.type)"
                class="text-xs text-fg-subtle"
              >
                {{ t('redeem.adminAdjustment') }}
              </p>
              <p
                v-else
                class="font-mono text-xs text-fg-subtle"
              >
                {{ item.code.slice(0, 8) }}...
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
        <button
          :disabled="currentPage <= 1"
          class="btn btn-secondary px-3 py-1 text-sm"
          @click="loadHistory(currentPage - 1)"
        >
          {{ t('pagination.previous') }}
        </button>
        <span class="text-sm tabular-nums text-fg-muted">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          :disabled="currentPage >= totalPages"
          class="btn btn-secondary px-3 py-1 text-sm"
          @click="loadHistory(currentPage + 1)"
        >
          {{ t('pagination.next') }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI, type BalanceHistoryItem } from '@/api/admin'
import { formatDateTime } from '@/utils/format'
import type { AdminUser } from '@/types'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps<{ show: boolean; user: AdminUser | null; hideActions?: boolean }>()
const emit = defineEmits(['close', 'deposit', 'withdraw'])
const { t } = useI18n()

const history = ref<BalanceHistoryItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const total = ref(0)
const totalRecharged = ref(0)
const pageSize = 15
const typeFilter = ref('')
let requestVersion = 0

onUnmounted(() => { requestVersion++ })

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1)

// Type filter options
const typeOptions = computed(() => [
  { value: '', label: t('admin.users.allTypes') },
  { value: 'balance', label: t('admin.users.typeBalance') },
  { value: 'affiliate_balance', label: t('admin.users.typeAffiliateBalance') },
  { value: 'admin_balance', label: t('admin.users.typeAdminBalance') },
  { value: 'concurrency', label: t('admin.users.typeConcurrency') },
  { value: 'admin_concurrency', label: t('admin.users.typeAdminConcurrency') },
  { value: 'subscription', label: t('admin.users.typeSubscription') }
])

// Watch modal open
watch(() => props.show, (v) => {
  requestVersion++
  if (v && props.user) {
    typeFilter.value = ''
    loadHistory(1)
  }
})

const loadHistory = async (page: number) => {
  if (!props.user) return
  const version = ++requestVersion
  loading.value = true
  currentPage.value = page
  try {
    const res = await adminAPI.users.getUserBalanceHistory(
      props.user.id,
      page,
      pageSize,
      typeFilter.value || undefined
    )
    if (version !== requestVersion) return
    history.value = res.items || []
    total.value = res.total || 0
    totalRecharged.value = res.total_recharged || 0
  } catch (error) {
    if (version !== requestVersion) return
    console.error('Failed to load balance history:', error)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

// Helper: check if admin type
const isAdminType = (type: string) => type === 'admin_balance' || type === 'admin_concurrency'

// Helper: check if balance type (includes admin_balance)
const isBalanceType = (type: string) => type === 'balance' || type === 'admin_balance' || type === 'affiliate_balance'

// Helper: check if subscription type
const isSubscriptionType = (type: string) => type === 'subscription'

// Icon name based on type
const getIconName = (item: BalanceHistoryItem) => {
  if (isBalanceType(item.type)) return 'dollar'
  if (isSubscriptionType(item.type)) return 'badge'
  return 'bolt' // concurrency
}

// Icon text color
const getIconColor = (item: BalanceHistoryItem) => {
  if (isBalanceType(item.type)) {
    return item.value >= 0
      ? 'text-success'
      : 'text-danger'
  }
  if (isSubscriptionType(item.type)) return 'text-fg-muted'
  return item.value >= 0
    ? 'text-accent'
    : 'text-warning'
}

// Value text color
const getValueColor = (item: BalanceHistoryItem) => {
  if (isBalanceType(item.type)) {
    return item.value >= 0
      ? 'text-success'
      : 'text-danger'
  }
  if (isSubscriptionType(item.type)) return 'text-fg-muted'
  return item.value >= 0
    ? 'text-accent'
    : 'text-warning'
}

// Item title
const getItemTitle = (item: BalanceHistoryItem) => {
  switch (item.type) {
    case 'balance':
      return t('redeem.balanceAddedRedeem')
    case 'affiliate_balance':
      return t('redeem.balanceAddedAffiliate')
    case 'admin_balance':
      return item.value >= 0 ? t('redeem.balanceAddedAdmin') : t('redeem.balanceDeductedAdmin')
    case 'concurrency':
      return t('redeem.concurrencyAddedRedeem')
    case 'admin_concurrency':
      return item.value >= 0 ? t('redeem.concurrencyAddedAdmin') : t('redeem.concurrencyReducedAdmin')
    case 'subscription':
      return t('redeem.subscriptionAssigned')
    default:
      return t('common.unknown')
  }
}

// Format display value
const formatValue = (item: BalanceHistoryItem) => {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}$${item.value.toFixed(2)}`
  }
  if (isSubscriptionType(item.type)) {
    const days = item.validity_days || Math.round(item.value)
    const groupName = item.group?.name || ''
    return groupName ? `${days}d - ${groupName}` : `${days}d`
  }
  // concurrency types
  const sign = item.value >= 0 ? '+' : ''
  return `${sign}${item.value}`
}
</script>
