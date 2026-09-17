<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { opsAPI, type OpsAccountAvailabilityStatsResponse, type OpsConcurrencyStatsResponse, type OpsUserConcurrencyStatsResponse } from '@/api/admin/ops'

interface Props {
  platformFilter?: string
  groupIdFilter?: number | null
  refreshToken: number
}

const props = withDefaults(defineProps<Props>(), {
  platformFilter: '',
  groupIdFilter: null
})

const { t } = useI18n()

const loading = ref(false)
const errorMessage = ref('')
const concurrency = ref<OpsConcurrencyStatsResponse | null>(null)
const availability = ref<OpsAccountAvailabilityStatsResponse | null>(null)
const userConcurrency = ref<OpsUserConcurrencyStatsResponse | null>(null)

// 用户视图开关
const showByUser = ref(false)

const realtimeEnabled = computed(() => {
  return (concurrency.value?.enabled ?? true) && (availability.value?.enabled ?? true)
})

function safeNumber(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

// 计算显示维度
const displayDimension = computed<'platform' | 'group' | 'account' | 'user'>(() => {
  if (showByUser.value) {
    return 'user'
  }
  if (typeof props.groupIdFilter === 'number' && props.groupIdFilter > 0) {
    return 'account'
  }
  if (props.platformFilter) {
    return 'group'
  }
  return 'platform'
})

// 平台/分组汇总行数据
interface SummaryRow {
  key: string
  name: string
  platform?: string
  // 账号统计
  total_accounts: number
  available_accounts: number
  rate_limited_accounts: number
  error_accounts: number
  // 并发统计
  total_concurrency: number
  used_concurrency: number
  waiting_in_queue: number
  // 计算字段
  availability_percentage: number
  concurrency_percentage: number
}

// 账号详细行数据
interface AccountRow {
  key: string
  name: string
  platform: string
  group_name: string
  // 并发
  current_in_use: number
  max_capacity: number
  waiting_in_queue: number
  load_percentage: number
  // 状态
  is_available: boolean
  is_rate_limited: boolean
  rate_limit_remaining_sec?: number
  is_overloaded: boolean
  overload_remaining_sec?: number
  has_error: boolean
  error_message?: string
  // 调度器信号（仅 OpenAI 高级调度器有样本时存在）
  scheduler_error_rate?: number
  scheduler_ttft_ms?: number
}

// 用户行数据
interface UserRow {
  key: string
  user_id: number
  user_email: string
  username: string
  current_in_use: number
  max_capacity: number
  waiting_in_queue: number
  load_percentage: number
}

// 平台维度汇总
const platformRows = computed((): SummaryRow[] => {
  const concStats = concurrency.value?.platform || {}
  const availStats = availability.value?.platform || {}

  const platforms = new Set([...Object.keys(concStats), ...Object.keys(availStats)])

  return Array.from(platforms).map(platform => {
    const conc = concStats[platform] || {}
    const avail = availStats[platform] || {}

    const totalAccounts = safeNumber(avail.total_accounts)
    const availableAccounts = safeNumber(avail.available_count)
    const totalConcurrency = safeNumber(conc.max_capacity)
    const usedConcurrency = safeNumber(conc.current_in_use)

    return {
      key: platform,
      name: platform.toUpperCase(),
      total_accounts: totalAccounts,
      available_accounts: availableAccounts,
      rate_limited_accounts: safeNumber(avail.rate_limit_count),

      error_accounts: safeNumber(avail.error_count),
      total_concurrency: totalConcurrency,
      used_concurrency: usedConcurrency,
      waiting_in_queue: safeNumber(conc.waiting_in_queue),
      availability_percentage: totalAccounts > 0 ? Math.round((availableAccounts / totalAccounts) * 100) : 0,
      concurrency_percentage: totalConcurrency > 0 ? Math.round((usedConcurrency / totalConcurrency) * 100) : 0
    }
  }).sort((a, b) => b.concurrency_percentage - a.concurrency_percentage)
})

// 分组维度汇总
const groupRows = computed((): SummaryRow[] => {
  const concStats = concurrency.value?.group || {}
  const availStats = availability.value?.group || {}

  const groupIds = new Set([...Object.keys(concStats), ...Object.keys(availStats)])

  const rows = Array.from(groupIds)
    .map(gid => {
      const conc = concStats[gid] || {}
      const avail = availStats[gid] || {}

      // 只显示匹配的平台
      if (props.platformFilter && conc.platform !== props.platformFilter && avail.platform !== props.platformFilter) {
        return null
      }

      const totalAccounts = safeNumber(avail.total_accounts)
      const availableAccounts = safeNumber(avail.available_count)
      const totalConcurrency = safeNumber(conc.max_capacity)
      const usedConcurrency = safeNumber(conc.current_in_use)

      return {
        key: gid,
        name: String(conc.group_name || avail.group_name || `Group ${gid}`),
        platform: String(conc.platform || avail.platform || ''),
        total_accounts: totalAccounts,
        available_accounts: availableAccounts,
        rate_limited_accounts: safeNumber(avail.rate_limit_count),
  
        error_accounts: safeNumber(avail.error_count),
        total_concurrency: totalConcurrency,
        used_concurrency: usedConcurrency,
        waiting_in_queue: safeNumber(conc.waiting_in_queue),
        availability_percentage: totalAccounts > 0 ? Math.round((availableAccounts / totalAccounts) * 100) : 0,
        concurrency_percentage: totalConcurrency > 0 ? Math.round((usedConcurrency / totalConcurrency) * 100) : 0
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  return rows.sort((a, b) => b.concurrency_percentage - a.concurrency_percentage)
})

// 账号维度详细
const accountRows = computed((): AccountRow[] => {
  const concStats = concurrency.value?.account || {}
  const availStats = availability.value?.account || {}

  const accountIds = new Set([...Object.keys(concStats), ...Object.keys(availStats)])

  const rows = Array.from(accountIds)
    .map(aid => {
      const conc = concStats[aid] || {}
      const avail = availStats[aid] || {}

      // 只显示匹配的分组
      if (typeof props.groupIdFilter === 'number' && props.groupIdFilter > 0) {
        if (conc.group_id !== props.groupIdFilter && avail.group_id !== props.groupIdFilter) {
          return null
        }
      }

      return {
        key: aid,
        name: String(conc.account_name || avail.account_name || `Account ${aid}`),
        platform: String(conc.platform || avail.platform || ''),
        group_name: String(conc.group_name || avail.group_name || ''),
        current_in_use: safeNumber(conc.current_in_use),
        max_capacity: safeNumber(conc.max_capacity),
        waiting_in_queue: safeNumber(conc.waiting_in_queue),
        load_percentage: safeNumber(conc.load_percentage),
        is_available: avail.is_available || false,
        is_rate_limited: avail.is_rate_limited || false,
        rate_limit_remaining_sec: avail.rate_limit_remaining_sec,
        is_overloaded: avail.is_overloaded || false,
        overload_remaining_sec: avail.overload_remaining_sec,
        has_error: avail.has_error || false,
        error_message: avail.error_message || '',
        scheduler_error_rate: avail.scheduler_error_rate,
        scheduler_ttft_ms: avail.scheduler_ttft_ms
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  return rows.sort((a, b) => {
    // 优先显示异常账号
    if (a.has_error !== b.has_error) return a.has_error ? -1 : 1
    if (a.is_rate_limited !== b.is_rate_limited) return a.is_rate_limited ? -1 : 1
    // 调度器错误率高的优先暴露
    const errDiff = (b.scheduler_error_rate ?? 0) - (a.scheduler_error_rate ?? 0)
    if (errDiff !== 0) return errDiff
    // 然后按负载排序
    return b.load_percentage - a.load_percentage
  })
})

// 用户维度详细
const userRows = computed((): UserRow[] => {
  const userStats = userConcurrency.value?.user || {}

  return Object.keys(userStats)
    .map(uid => {
      const u = userStats[uid] || {}
      return {
        key: uid,
        user_id: safeNumber(u.user_id),
        user_email: u.user_email || `User ${uid}`,
        username: u.username || '',
        current_in_use: safeNumber(u.current_in_use),
        max_capacity: safeNumber(u.max_capacity),
        waiting_in_queue: safeNumber(u.waiting_in_queue),
        load_percentage: safeNumber(u.load_percentage)
      }
    })
    .sort((a, b) => b.current_in_use - a.current_in_use || b.load_percentage - a.load_percentage)
})

// 根据维度选择数据
const displayRows = computed(() => {
  if (displayDimension.value === 'user') return userRows.value
  if (displayDimension.value === 'account') return accountRows.value
  if (displayDimension.value === 'group') return groupRows.value
  return platformRows.value
})

const displayTitle = computed(() => {
  if (displayDimension.value === 'user') return t('admin.ops.concurrency.byUser')
  if (displayDimension.value === 'account') return t('admin.ops.concurrency.byAccount')
  if (displayDimension.value === 'group') return t('admin.ops.concurrency.byGroup')
  return t('admin.ops.concurrency.byPlatform')
})

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (showByUser.value) {
      // 用户视图模式只加载用户并发数据
      const userData = await opsAPI.getUserConcurrencyStats()
      userConcurrency.value = userData
    } else {
      // 常规模式加载账号/平台/分组数据
      const [concData, availData] = await Promise.all([
        opsAPI.getConcurrencyStats(props.platformFilter, props.groupIdFilter),
        opsAPI.getAccountAvailabilityStats(props.platformFilter, props.groupIdFilter)
      ])
      concurrency.value = concData
      availability.value = availData
    }
  } catch (err: any) {
    console.error('[OpsConcurrencyCard] Failed to load data', err)
    errorMessage.value = err?.response?.data?.detail || t('admin.ops.concurrency.loadFailed')
  } finally {
    loading.value = false
  }
}

// 刷新节奏由父组件统一控制（OpsDashboard Header 的刷新状态/倒计时）
watch(
  () => props.refreshToken,
  () => {
    if (!realtimeEnabled.value) return
    loadData()
  }
)

// 切换用户视图时重新加载数据
watch(
  () => showByUser.value,
  () => {
    loadData()
  }
)

function getLoadBarClass(loadPct: number): string {
  if (loadPct >= 90) return 'bg-danger'
  if (loadPct >= 70) return 'bg-warning'
  if (loadPct >= 50) return 'bg-warning'
  return ''
}

function getLoadBarStyle(loadPct: number): string {
  return `width: ${Math.min(100, Math.max(0, loadPct))}%`
}

function getLoadTextClass(loadPct: number): string {
  if (loadPct >= 90) return 'text-danger'
  if (loadPct >= 70) return 'text-warning'
  if (loadPct >= 50) return 'text-warning'
  return 'text-success'
}

// 阈值沿用 codex2api 健康分层：≥30% risky，≥5% warm
function getErrorRateTextClass(rate: number): string {
  if (rate >= 0.3) return 'text-danger'
  if (rate >= 0.05) return 'text-warning'
  return 'text-success'
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}


watch(
  () => realtimeEnabled.value,
  async (enabled) => {
    if (enabled) {
      await loadData()
    }
  },
  { immediate: true }
)
</script>

<template>
  <section class="card flex h-full flex-col">
    <!-- 头部 -->
    <div class="card-header flex shrink-0 items-center justify-between gap-3">
      <h3 class="card-title">{{ t('admin.ops.concurrency.title') }}</h3>
      <div class="flex items-center gap-1">
        <!-- 用户视图切换按钮 -->
        <button
          class="btn btn-sm btn-icon"
          :class="showByUser ? 'btn-secondary border-accent text-accent-strong' : 'btn-ghost'"
          :title="showByUser ? t('admin.ops.concurrency.switchToPlatform') : t('admin.ops.concurrency.switchToUser')" :aria-label="showByUser ? t('admin.ops.concurrency.switchToPlatform') : t('admin.ops.concurrency.switchToUser')"
          @click="showByUser = !showByUser"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <!-- 刷新按钮 -->
        <button
          class="btn btn-ghost btn-sm btn-icon"
          :disabled="loading"
          :title="t('common.refresh')" :aria-label="t('common.refresh')"
          @click="loadData"
        >
          <svg class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="shrink-0 border-b border-danger/40 bg-danger-weak px-4 py-2 text-meta text-danger-strong">
      {{ errorMessage }}
    </div>

    <!-- 禁用状态 -->
    <div v-if="!realtimeEnabled" class="flex flex-1 items-center justify-center px-4 py-8 text-body text-fg-muted">
      {{ t('admin.ops.concurrency.disabledHint') }}
    </div>

    <!-- 数据展示区域 -->
    <div v-else class="flex min-h-0 flex-1 flex-col">
      <!-- 维度标题栏：印刷表头带 -->
      <div class="flex shrink-0 items-center justify-between border-b-2 border-accent bg-accent-weak px-4 py-1.5 text-meta">
        <span class="font-semibold text-accent-strong">{{ displayTitle }}</span>
        <span class="tabular-nums text-fg-muted">{{ t('admin.ops.concurrency.totalRows', { count: displayRows.length }) }}</span>
      </div>

      <!-- 空状态 -->
      <div v-if="displayRows.length === 0" class="flex flex-1 items-center justify-center py-8 text-body text-fg-muted">
        {{ t('admin.ops.concurrency.empty') }}
      </div>

      <!-- 用户视图 -->
      <div v-else-if="displayDimension === 'user'" class="custom-scrollbar max-h-[360px] flex-1 divide-y divide-border overflow-y-auto">
        <div v-for="row in (displayRows as UserRow[])" :key="row.key" class="px-4 py-2">
          <div class="mb-1.5 flex items-center justify-between gap-2 text-meta">
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <span class="truncate font-semibold text-fg" :title="row.username || row.user_email">
                {{ row.username || row.user_email }}
              </span>
              <span v-if="row.username" class="shrink-0 truncate text-fg-subtle" :title="row.user_email">
                {{ row.user_email }}
              </span>
            </div>
            <div class="flex shrink-0 items-center gap-2 tabular-nums">
              <span class="font-semibold text-fg">{{ row.current_in_use }}/{{ row.max_capacity }}</span>
              <span :class="['font-bold', getLoadTextClass(row.load_percentage)]">{{ Math.round(row.load_percentage) }}%</span>
            </div>
          </div>

          <div class="progress">
            <div class="progress-bar transition-all duration-300" :class="getLoadBarClass(row.load_percentage)" :style="getLoadBarStyle(row.load_percentage)"></div>
          </div>

          <div v-if="row.waiting_in_queue > 0" class="mt-1.5 flex justify-end">
            <span class="badge badge-gray">{{ t('admin.ops.concurrency.queued', { count: row.waiting_in_queue }) }}</span>
          </div>
        </div>
      </div>

      <!-- 汇总视图（平台/分组） -->
      <div v-else-if="displayDimension === 'platform' || displayDimension === 'group'" class="custom-scrollbar max-h-[360px] flex-1 divide-y divide-border overflow-y-auto">
        <div v-for="row in (displayRows as SummaryRow[])" :key="row.key" class="px-4 py-2.5">
          <div class="mb-1.5 flex items-center justify-between gap-2 text-meta">
            <div class="flex min-w-0 items-center gap-2">
              <div class="truncate font-semibold text-fg" :title="row.name">
                {{ row.name }}
              </div>
              <span v-if="displayDimension === 'group' && row.platform" class="text-fg-subtle">
                {{ row.platform.toUpperCase() }}
              </span>
            </div>
            <div class="flex shrink-0 items-center gap-2 tabular-nums">
              <span class="font-semibold text-fg">{{ row.used_concurrency }}/{{ row.total_concurrency }}</span>
              <span :class="['font-bold', getLoadTextClass(row.concurrency_percentage)]">{{ row.concurrency_percentage }}%</span>
            </div>
          </div>

          <div class="progress mb-2">
            <div
              class="progress-bar transition-all duration-300"
              :class="getLoadBarClass(row.concurrency_percentage)"
              :style="getLoadBarStyle(row.concurrency_percentage)"
            ></div>
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta">
            <!-- 账号统计 -->
            <span class="tabular-nums text-fg-muted">
              <span class="font-bold text-success">{{ row.available_accounts }}</span>/{{ row.total_accounts }}
              <span class="text-fg-subtle">· {{ row.availability_percentage }}%</span>
            </span>

            <span v-if="row.rate_limited_accounts > 0" class="badge badge-warning">
              {{ t('admin.ops.concurrency.rateLimited', { count: row.rate_limited_accounts }) }}
            </span>

            <span v-if="row.error_accounts > 0" class="badge badge-danger">
              {{ t('admin.ops.concurrency.errorAccounts', { count: row.error_accounts }) }}
            </span>

            <span v-if="row.waiting_in_queue > 0" class="badge badge-gray">
              {{ t('admin.ops.concurrency.queued', { count: row.waiting_in_queue }) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 账号详细视图 -->
      <div v-else class="custom-scrollbar max-h-[360px] flex-1 divide-y divide-border overflow-y-auto">
        <div v-for="row in (displayRows as AccountRow[])" :key="row.key" class="px-4 py-2">
          <div class="mb-1.5 flex items-center justify-between gap-2 text-meta">
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold text-fg" :title="row.name">
                {{ row.name }}
              </div>
              <div class="truncate text-fg-subtle">
                {{ row.group_name }}
              </div>
              <div
                v-if="row.scheduler_error_rate !== undefined"
                class="mt-0.5 flex items-center gap-2 tabular-nums"
                :title="t('admin.ops.accountAvailability.schedulerSignalsHint')"
              >
                <span :class="getErrorRateTextClass(row.scheduler_error_rate)">
                  {{ t('admin.ops.accountAvailability.schedulerErrorRate', { rate: (row.scheduler_error_rate * 100).toFixed(1) }) }}
                </span>
                <span v-if="row.scheduler_ttft_ms !== undefined" class="text-fg-muted">
                  {{ t('admin.ops.accountAvailability.schedulerTtft', { ms: Math.round(row.scheduler_ttft_ms) }) }}
                </span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="font-semibold tabular-nums text-fg">{{ row.current_in_use }}/{{ row.max_capacity }}</span>
              <!-- 状态印章 -->
              <span v-if="row.is_available" class="badge badge-success">
                {{ t('admin.ops.accountAvailability.available') }}
              </span>
              <span v-else-if="row.is_rate_limited" class="badge badge-warning tabular-nums">
                {{ formatDuration(row.rate_limit_remaining_sec || 0) }}
              </span>
              <span v-else-if="row.is_overloaded" class="badge badge-danger tabular-nums">
                {{ formatDuration(row.overload_remaining_sec || 0) }}
              </span>
              <span v-else-if="row.has_error" class="badge badge-danger">
                {{ t('admin.ops.accountAvailability.accountError') }}
              </span>
              <span v-else class="badge badge-gray">
                {{ t('admin.ops.accountAvailability.unavailable') }}
              </span>
            </div>
          </div>

          <div class="progress">
            <div class="progress-bar transition-all duration-300" :class="getLoadBarClass(row.load_percentage)" :style="getLoadBarStyle(row.load_percentage)"></div>
          </div>

          <div v-if="row.waiting_in_queue > 0" class="mt-1.5 flex justify-end">
            <span class="badge badge-gray">{{ t('admin.ops.concurrency.queued', { count: row.waiting_in_queue }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
