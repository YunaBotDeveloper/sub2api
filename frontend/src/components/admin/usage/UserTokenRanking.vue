<template>
  <!-- 用量页"用户排行"tab 内容：无卡片外观，依赖父级统一卡片；筛选/时间范围复用页面级筛选栏 -->
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-6">
      <p class="text-meta text-fg-muted">{{ t('admin.usage.tokenRanking.subtitle') }}</p>
      <div class="flex items-center gap-3">
        <span v-if="!loading && items.length > 0" class="text-meta font-medium tabular-nums text-fg-muted">
          {{ t('admin.usage.tokenRanking.userCount', { count: items.length }) }}
        </span>
        <div class="w-28">
          <Select v-model="limit" :options="limitOptions" @change="load" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container border-x-0 border-b-0">
      <table class="table min-w-max">
        <thead>
          <tr>
            <th class="w-14 text-right">#</th>
            <th>
              {{ t('admin.usage.tokenRanking.columns.user') }}
            </th>
            <th
              v-for="col in sortableColumns"
              :key="col.key"
              class="cursor-pointer select-none text-right transition-colors hover:bg-accent/10"
              :class="sortBy === col.key ? 'underline decoration-2 underline-offset-4' : ''"
              @click="setSort(col.key)"
            >
              {{ t(col.label) }}
              <span v-if="sortBy === col.key" aria-hidden="true">↓</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="sortableColumns.length + 2" class="py-12 text-center">
              <LoadingSpinner />
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td :colspan="sortableColumns.length + 2" class="py-12 text-center text-body text-fg-muted">
              {{ t('admin.dashboard.noDataAvailable') }}
            </td>
          </tr>
          <tr
            v-for="(item, index) in items"
            v-else
            :key="item.user_id"
            class="cursor-pointer"
            :title="t('admin.usage.tokenRanking.rowHint')"
            @click="$emit('select-user', item.user_id, item.email)"
          >
            <td class="text-right tabular-nums" :class="index < 3 ? 'font-bold text-accent-strong' : 'text-fg-muted'">
              {{ index + 1 }}
            </td>
            <td class="max-w-[260px] truncate font-medium" :title="item.email">
              {{ item.email || `User #${item.user_id}` }}
              <span class="ml-1 font-mono text-meta font-normal text-fg-subtle">#{{ item.user_id }}</span>
            </td>
            <td class="whitespace-nowrap text-right tabular-nums text-fg-muted">{{ item.requests.toLocaleString() }}</td>
            <td class="whitespace-nowrap text-right tabular-nums text-fg-muted">{{ fmtTokens(item.input_tokens) }}</td>
            <td class="whitespace-nowrap text-right tabular-nums text-fg-muted">{{ fmtTokens(item.output_tokens) }}</td>
            <td class="whitespace-nowrap text-right tabular-nums text-fg-muted">{{ fmtTokens(item.cache_tokens) }}</td>
            <td class="whitespace-nowrap text-right font-semibold tabular-nums">{{ fmtTokens(item.total_tokens) }}</td>
            <td class="whitespace-nowrap text-right font-semibold tabular-nums">${{ fmtCost(item.actual_cost) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUserBreakdown, type UserBreakdownParams } from '@/api/admin/dashboard'
import { formatCompactNumber, formatCostFixed } from '@/utils/format'
import type { UserBreakdownItem } from '@/types'
import Select from '@/components/common/Select.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  startDate: string
  endDate: string
  filters: Record<string, unknown>
  model?: string
}>()

defineEmits<{ (e: 'select-user', userId: number, email: string): void }>()

const { t } = useI18n()

type SortKey = NonNullable<UserBreakdownParams['sort_by']>
const sortableColumns: { key: SortKey; label: string }[] = [
  { key: 'requests', label: 'admin.usage.tokenRanking.columns.requests' },
  { key: 'input_tokens', label: 'admin.usage.tokenRanking.columns.inputTokens' },
  { key: 'output_tokens', label: 'admin.usage.tokenRanking.columns.outputTokens' },
  { key: 'cache_tokens', label: 'admin.usage.tokenRanking.columns.cacheTokens' },
  { key: 'total_tokens', label: 'admin.usage.tokenRanking.columns.totalTokens' },
  { key: 'actual_cost', label: 'admin.usage.tokenRanking.columns.cost' },
]

const limitOptions = [
  { value: 20, label: 'Top 20' },
  { value: 50, label: 'Top 50' },
  { value: 100, label: 'Top 100' },
  { value: 200, label: 'Top 200' },
]

const items = ref<UserBreakdownItem[]>([])
const loading = ref(false)
const sortBy = ref<SortKey>('total_tokens')
const limit = ref(50)
let reqSeq = 0

const fmtTokens = (v: number) => formatCompactNumber(v)
const fmtCost = (v: number) => formatCostFixed(v, 4)

const setSort = (key: SortKey) => {
  if (sortBy.value === key) return
  sortBy.value = key
  load()
}

const load = async () => {
  const seq = ++reqSeq
  loading.value = true
  try {
    const params: UserBreakdownParams = {
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      sort_by: sortBy.value,
      limit: limit.value,
    }
    if (props.model) params.model = props.model
    const res = await getUserBreakdown(params)
    if (seq !== reqSeq) return
    items.value = res.users || []
  } catch {
    if (seq !== reqSeq) return
    items.value = []
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

// Reload when the shared filters / date range / model change.
watch(
  () => [props.startDate, props.endDate, props.model, JSON.stringify(props.filters)],
  () => load(),
  { immediate: true }
)

defineExpose({ reload: load })
</script>
