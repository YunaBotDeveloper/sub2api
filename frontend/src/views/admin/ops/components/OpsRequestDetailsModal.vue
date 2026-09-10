<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import DataTable from '@/components/common/DataTable.vue'
import type { Column } from '@/components/common/types'
import Pagination from '@/components/common/Pagination.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore } from '@/stores'
import { opsAPI, type OpsRequestDetailsParams, type OpsRequestDetail } from '@/api/admin/ops'
import { parseTimeRangeMinutes, formatDateTime } from '../utils/opsFormatters'

export interface OpsRequestDetailsPreset {
  title: string
  kind?: OpsRequestDetailsParams['kind']
  sort?: OpsRequestDetailsParams['sort']
  min_duration_ms?: number
  max_duration_ms?: number
}

interface Props {
  modelValue: boolean
  timeRange: string
  preset: OpsRequestDetailsPreset
  platform?: string
  groupId?: number | null
  resumeState?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openErrorDetail', errorId: number): void
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { copyToClipboard } = useClipboard()

const loading = ref(false)
const items = ref<OpsRequestDetail[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const close = () => emit('update:modelValue', false)

const rangeLabel = computed(() => {
  const minutes = parseTimeRangeMinutes(props.timeRange)
  if (minutes >= 60) return t('admin.ops.requestDetails.rangeHours', { n: Math.round(minutes / 60) })
  return t('admin.ops.requestDetails.rangeMinutes', { n: minutes })
})

function buildTimeParams(): Pick<OpsRequestDetailsParams, 'start_time' | 'end_time'> {
  const minutes = parseTimeRangeMinutes(props.timeRange)
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - minutes * 60 * 1000)
  return {
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  }
}

const fetchData = async () => {
  if (!props.modelValue) return
  loading.value = true
  try {
    const params: OpsRequestDetailsParams = {
      ...buildTimeParams(),
      page: page.value,
      page_size: pageSize.value,
      kind: props.preset.kind ?? 'all',
      sort: props.preset.sort ?? 'created_at_desc'
    }

    const platform = (props.platform || '').trim()
    if (platform) params.platform = platform
    if (typeof props.groupId === 'number' && props.groupId > 0) params.group_id = props.groupId

    if (typeof props.preset.min_duration_ms === 'number') params.min_duration_ms = props.preset.min_duration_ms
    if (typeof props.preset.max_duration_ms === 'number') params.max_duration_ms = props.preset.max_duration_ms

    const res = await opsAPI.listRequestDetails(params)
    items.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    console.error('[OpsRequestDetailsModal] Failed to fetch request details', e)
    appStore.showError(e?.message || t('admin.ops.requestDetails.failedToLoad'))
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.resumeState) return
      page.value = 1
      pageSize.value = 10
      fetchData()
    }
  }
)

watch(
  () => [
    props.timeRange,
    props.platform,
    props.groupId,
    props.preset.kind,
    props.preset.sort,
    props.preset.min_duration_ms,
    props.preset.max_duration_ms
  ],
  () => {
    if (!props.modelValue) return
    page.value = 1
    fetchData()
  }
)

function handlePageChange(next: number) {
  page.value = next
  fetchData()
}

function handlePageSizeChange(next: number) {
  pageSize.value = next
  page.value = 1
  fetchData()
}

async function handleCopyRequestId(requestId: string) {
  const ok = await copyToClipboard(requestId, t('admin.ops.requestDetails.requestIdCopied'))
  if (ok) return
  // `useClipboard` already shows toast on failure; this keeps UX consistent with older ops modal.
  appStore.showWarning(t('admin.ops.requestDetails.copyFailed'))
}

function openErrorDetail(errorId: number | null | undefined) {
  if (!errorId) return
  emit('openErrorDetail', errorId)
}

const kindBadgeClass = (kind: string) => {
  if (kind === 'error') return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
  return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
}

const columns = computed<Column[]>(() => [
  { key: 'created_at', label: t('admin.ops.requestDetails.table.time'), formatter: (v) => formatDateTime(v) },
  { key: 'kind', label: t('admin.ops.requestDetails.table.kind') },
  { key: 'platform', label: t('admin.ops.requestDetails.table.platform'), formatter: (v) => String(v || 'unknown').toUpperCase() },
  { key: 'model', label: t('admin.ops.requestDetails.table.model') },
  { key: 'duration_ms', label: t('admin.ops.requestDetails.table.duration'), formatter: (v) => (typeof v === 'number' ? `${v} ms` : '-') },
  { key: 'status_code', label: t('admin.ops.requestDetails.table.status'), formatter: (v) => String(v ?? '-') },
  { key: 'request_id', label: t('admin.ops.requestDetails.table.requestId') },
  { key: 'actions', label: t('admin.ops.requestDetails.table.actions'), class: 'text-right' }
])
</script>

<template>
  <BaseDialog :show="modelValue" :title="props.preset.title || t('admin.ops.requestDetails.title')" width="full" @close="close">
    <template #default>
      <div class="flex h-full min-h-0 flex-col">
        <div class="mb-4 flex flex-shrink-0 items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('admin.ops.requestDetails.rangeLabel', { range: rangeLabel }) }}
          </div>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            @click="fetchData"
          >
            {{ t('common.refresh') }}
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
          <DataTable :columns="columns" :data="items" :loading="loading" :sticky-first-column="false">
            <template #cell-kind="{ row }">
              <span class="rounded-full px-2 py-1 text-meta font-bold" :class="kindBadgeClass(row.kind)">
                {{ row.kind === 'error' ? t('admin.ops.requestDetails.kind.error') : t('admin.ops.requestDetails.kind.success') }}
              </span>
            </template>
            <template #cell-model="{ row }">
              <span class="block max-w-[240px] truncate" :title="row.model || ''">{{ row.model || '-' }}</span>
            </template>
            <template #cell-request_id="{ row }">
              <div v-if="row.request_id" class="flex items-center gap-2">
                <span class="max-w-[220px] truncate font-mono text-meta text-fg" :title="row.request_id">
                  {{ row.request_id }}
                </span>
                <button
                  class="rounded-md bg-gray-100 px-2 py-1 text-meta font-bold text-gray-600 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600"
                  @click="handleCopyRequestId(row.request_id)"
                >
                  {{ t('admin.ops.requestDetails.copy') }}
                </button>
              </div>
              <span v-else class="text-fg-subtle">-</span>
            </template>
            <template #cell-actions="{ row }">
              <div class="text-right">
                <button
                  v-if="row.kind === 'error' && row.error_id"
                  class="rounded-lg bg-danger-50 px-3 py-1.5 text-label font-bold text-danger-600 hover:bg-danger-100 dark:bg-danger-900/20 dark:text-danger-300 dark:hover:bg-danger-900/30"
                  @click="openErrorDetail(row.error_id)"
                >
                  {{ t('admin.ops.requestDetails.viewError') }}
                </button>
                <span v-else class="text-fg-subtle">-</span>
              </div>
            </template>
            <template #empty>
              <div class="text-body font-medium text-fg-muted">{{ t('admin.ops.requestDetails.empty') }}</div>
              <div class="mt-1 text-meta text-fg-subtle">{{ t('admin.ops.requestDetails.emptyHint') }}</div>
            </template>
          </DataTable>

          <Pagination
            v-if="!loading && items.length > 0"
            :total="total"
            :page="page"
            :page-size="pageSize"
            @update:page="handlePageChange"
            @update:pageSize="handlePageSizeChange"
          />
        </div>
      </div>
    </template>
  </BaseDialog>
</template>
