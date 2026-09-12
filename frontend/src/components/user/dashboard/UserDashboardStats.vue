<template>
  <!-- Row 1: Core Stats -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard
      v-if="!isSimple"
      :label="t('dashboard.balance')"
      :value="`$${formatBalance(balance)}`"
      icon="dollar"
      tone="success"
      :sub="t('common.available')"
    />
    <StatCard :label="t('dashboard.apiKeys')" :value="stats?.total_api_keys || 0" icon="key">
      <template #sub>{{ stats?.active_api_keys || 0 }} {{ t('common.active') }}</template>
    </StatCard>
    <StatCard
      :label="t('dashboard.todayRequests')"
      :value="stats?.today_requests || 0"
      icon="chart"
      :sub="`${t('common.total')}: ${formatNumber(stats?.total_requests || 0)}`"
    />
    <StatCard :label="t('dashboard.todayCost')" icon="dollar">
      <template #value>
        <p class="stat-value">
          <span :title="t('dashboard.actual')">${{ formatCost(stats?.today_actual_cost || 0) }}</span>
          <span class="font-sans text-label font-normal text-fg-subtle" :title="t('dashboard.standard')"> / ${{ formatCost(stats?.today_cost || 0) }}</span>
        </p>
      </template>
      <template #sub>
        {{ t('common.total') }}:
        <span :title="t('dashboard.actual')">${{ formatCost(stats?.total_actual_cost || 0) }}</span>
        <span class="text-fg-subtle" :title="t('dashboard.standard')"> / ${{ formatCost(stats?.total_cost || 0) }}</span>
      </template>
    </StatCard>
  </div>

  <!-- Row 2: Token Stats -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard
      :label="t('dashboard.todayTokens')"
      :value="formatTokens(stats?.today_tokens || 0)"
      icon="cube"
      :sub="`${t('dashboard.input')}: ${formatTokens(stats?.today_input_tokens || 0)} / ${t('dashboard.output')}: ${formatTokens(stats?.today_output_tokens || 0)} / ${t('dashboard.cache')}: ${formatTokens((stats?.today_cache_creation_tokens || 0) + (stats?.today_cache_read_tokens || 0))}`"
    />
    <StatCard
      :label="t('dashboard.totalTokens')"
      :value="formatTokens(stats?.total_tokens || 0)"
      icon="database"
      :sub="`${t('dashboard.input')}: ${formatTokens(stats?.total_input_tokens || 0)} / ${t('dashboard.output')}: ${formatTokens(stats?.total_output_tokens || 0)} / ${t('dashboard.cache')}: ${formatTokens((stats?.total_cache_creation_tokens || 0) + (stats?.total_cache_read_tokens || 0))}`"
    />
    <StatCard :label="t('dashboard.performance')" icon="bolt">
      <template #value>
        <p class="stat-value">
          {{ formatTokens(stats?.rpm || 0) }}
          <span class="font-sans text-label font-normal text-fg-muted">RPM</span>
        </p>
      </template>
      <template #sub>{{ formatTokens(stats?.tpm || 0) }} TPM</template>
    </StatCard>
    <StatCard
      :label="t('dashboard.avgResponse')"
      :value="formatDuration(stats?.average_duration_ms || 0)"
      icon="clock"
      :sub="t('dashboard.averageTime')"
    />
  </div>


  <!-- Row 3: Per-platform breakdown -->
  <section v-if="!isSimple && platformCards.length > 0" class="card">
    <div class="card-header flex items-center justify-between gap-3">
      <h2 class="text-h2 font-semibold text-fg">{{ t('dashboard.platformBreakdown') }}</h2>
      <span class="text-meta text-fg-muted">
        {{ t('dashboard.platformCount', { count: platformCount }) }}
      </span>
    </div>
    <div class="card-body grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="item in platformCards"
        :key="item.platform"
        data-testid="platform-card"
        :data-platform="item.platform"
        :class="[
          'rounded-lg border p-4',
          item.isOther ? 'border-dashed border-border-strong bg-surface-sunken' : 'border-border'
        ]"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span class="truncate text-h3 font-semibold text-fg">
            {{ item.isOther ? t('dashboard.platformOther') : platformLabel(item.platform) }}
          </span>
          <span class="shrink-0 font-mono tabular-nums text-body text-fg" :title="t('dashboard.actual')">
            ${{ formatCost(item.total_actual_cost) }}
          </span>
        </div>
        <dl class="mt-3 space-y-1 text-label">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-fg-muted">{{ t('dashboard.todayCost') }}</dt>
            <dd class="font-mono tabular-nums text-fg">${{ formatCost(item.today_actual_cost) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-fg-muted">{{ t('dashboard.requests') }}</dt>
            <dd class="font-mono tabular-nums text-fg">
              {{ item.total_requests > 0 ? formatNumber(item.total_requests) : '-' }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-fg-muted">{{ t('dashboard.tokens') }}</dt>
            <dd class="font-mono tabular-nums text-fg">
              {{ item.total_tokens > 0 ? formatTokens(item.total_tokens) : '-' }}
            </dd>
          </div>
        </dl>

        <!-- Quota 区：仅当 quota 配置存在、非 __other__ 且至少有一个窗口配了 limit 时显示 -->
        <div v-if="!item.isOther && quotaWindows(item.quota).length > 0" class="mt-3 space-y-2 border-t border-border pt-3">
          <p class="text-meta font-medium uppercase tracking-wider text-fg-subtle">
            {{ t('dashboard.platformQuota.title') }}
          </p>
          <div v-for="w in quotaWindows(item.quota)" :key="w.key" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-label">
              <span class="text-fg-muted">{{ t(`dashboard.platformQuota.${w.key}`) }}</span>
              <!-- limit=0：完全禁用，用文字表达而不是单独一条红色进度条 -->
              <span v-if="w.limit === 0" class="font-medium text-danger">{{ t('dashboard.platformQuota.disabled') }}</span>
              <span v-else :class="['font-mono tabular-nums', w.percent >= 95 ? 'text-danger' : 'text-fg']">
                ${{ formatUsd(w.usage) }} / ${{ formatUsd(w.limit) }}
              </span>
            </div>
            <!-- limit>0：正常用量进度条 -->
            <template v-if="w.limit > 0">
              <div class="progress" role="progressbar" :aria-valuenow="w.percent" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" :class="quotaBarClass(w.percent)" :style="{ width: w.percent + '%' }" />
              </div>
              <p v-if="w.resetsAt" class="text-meta text-fg-subtle">
                {{ t('dashboard.platformQuota.resetsAt', { time: formatResetTime(w.resetsAt) }) }}
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StatCard from '@/components/common/StatCard.vue'
import type { PlatformDashboardStats, UserDashboardStats as UserStatsType } from '@/api/usage'
import type { PlatformQuotaItem } from '@/types'

interface FusedPlatformCard {
  platform: string
  total_actual_cost: number
  today_actual_cost: number
  total_requests: number
  total_tokens: number
  isOther?: boolean
  quota?: PlatformQuotaItem
}

const props = defineProps<{
  stats: UserStatsType
  balance: number
  isSimple: boolean
  platformQuotas?: PlatformQuotaItem[] | null
}>()
const { t } = useI18n()

const PLATFORM_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  antigravity: 'Antigravity',
  grok: 'Grok',
  kimi: 'Kimi',
  zhipu: 'Zhipu GLM',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
}

const platformLabel = (p: string) => PLATFORM_LABELS[p] ?? p

// 处理"各平台之和 < 总值"的差值：后端按平台聚合时过滤了无法归属平台的行
// （group 与 account 都缺 platform）。这里把差值作为"其他"卡片显式展示，
// 避免 Row 1 总值与 Row 3 平台拆分加总对不上、用户困惑。
const OTHER_THRESHOLD = 0.0001
const platformCards = computed<FusedPlatformCard[]>(() => {
  // 建立 by_platform Map
  const byPlat = new Map<string, PlatformDashboardStats>()
  for (const item of props.stats?.by_platform ?? []) byPlat.set(item.platform, item)

  // 建立 quota Map。三档全空的记录不产生卡片，挂到卡片上也不渲染配额区。
  const byQuota = new Map<string, PlatformQuotaItem>()
  for (const q of props.platformQuotas ?? []) byQuota.set(q.platform, q)

  // 卡片集合 = 有用量的平台 ∪ 至少配置了一档限额的平台。
  // 三档全空的限额记录等价于不限额，不单独产生卡片。
  // 后端 by_platform / quota 接口均不会返回 platform='__other__'，
  // 无需显式排除；__other__ 由下方差值补差逻辑单独追加。
  const platforms = new Set<string>(byPlat.keys())
  for (const [platform, q] of byQuota) {
    if (hasAnyLimit(q)) platforms.add(platform)
  }

  const PLATFORM_ORDER = ['anthropic', 'openai', 'gemini', 'antigravity', 'grok']
  const cards: FusedPlatformCard[] = []

  for (const p of platforms) {
    const stat = byPlat.get(p)
    cards.push({
      platform: p,
      total_actual_cost: stat?.total_actual_cost ?? 0,
      today_actual_cost: stat?.today_actual_cost ?? 0,
      total_requests: stat?.total_requests ?? 0,
      total_tokens: stat?.total_tokens ?? 0,
      quota: byQuota.get(p),
    })
  }

  // 排序：按 PLATFORM_ORDER，未知平台按名称排序
  cards.sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a.platform)
    const bi = PLATFORM_ORDER.indexOf(b.platform)
    if (ai === -1 && bi === -1) return a.platform.localeCompare(b.platform)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // __other__ 补差逻辑：只对 by_platform 有 usage 数据的总和计算
  const total = props.stats?.total_actual_cost ?? 0
  const today = props.stats?.today_actual_cost ?? 0
  const sumTotal = cards.reduce((s, c) => s + c.total_actual_cost, 0)
  const sumToday = cards.reduce((s, c) => s + c.today_actual_cost, 0)
  const diffTotal = Math.max(0, total - sumTotal)
  const diffToday = Math.max(0, today - sumToday)

  if (diffTotal > OTHER_THRESHOLD || diffToday > OTHER_THRESHOLD) {
    cards.push({
      platform: '__other__',
      total_actual_cost: diffTotal,
      today_actual_cost: diffToday,
      total_requests: 0,
      total_tokens: 0,
      isOther: true,
    })
  }

  return cards
})

// 标题右侧的平台计数 = 实际渲染的平台卡片数，不含"其他"差额卡。
const platformCount = computed(() => platformCards.value.filter((c) => !c.isOther).length)

// Quota helpers

type QuotaWindow = 'daily' | 'weekly' | 'monthly'
const QUOTA_WINDOWS: QuotaWindow[] = ['daily', 'weekly', 'monthly']

// 只返回配置了 limit 的窗口（limit=0 表示禁用，仍会返回）
function hasAnyLimit(q: PlatformQuotaItem | undefined): boolean {
  if (!q) return false
  return q.daily_limit_usd != null || q.weekly_limit_usd != null || q.monthly_limit_usd != null
}

function quotaWindows(q: PlatformQuotaItem | undefined) {
  if (!q) return []
  return QUOTA_WINDOWS.flatMap((key) => {
    const limit = q[`${key}_limit_usd`]
    if (limit == null) return []
    const usage = q[`${key}_usage_usd`] ?? 0
    return [{ key, limit, usage, percent: calcPercent(usage, limit), resetsAt: q[`${key}_window_resets_at`] }]
  })
}

function calcPercent(usage: number, limit: number): number {
  if (!limit || limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((usage / limit) * 100)))
}

// 进度条默认 accent；只有接近/超出配额时才切到 warning / danger 语义色
function quotaBarClass(p: number): string {
  if (p >= 95) return 'bg-danger'
  if (p >= 75) return 'bg-warning'
  return ''
}

// 与 formatBalance 一致使用 Intl.NumberFormat 做半偶舍入，避免 toFixed 在不同 JS 引擎
// 下偶发截断而非四舍五入（与后端展示精度不一致）。
const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '0.00'
  return usdFormatter.format(n)
}

function formatResetTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatBalance = (b: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(b)

const formatNumber = (n: number) => n.toLocaleString()
const formatCost = (c: number) => c.toFixed(4)
const formatTokens = (t: number) => {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`
  if (t >= 1000) return `${(t / 1000).toFixed(1)}K`
  return t.toString()
}
const formatDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`
</script>
