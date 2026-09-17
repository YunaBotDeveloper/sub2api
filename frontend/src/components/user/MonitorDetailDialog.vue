<template>
  <BaseDialog
    :show="show"
    :title="title"
    width="wide"
    @close="$emit('close')"
  >
    <div v-if="loading" class="py-8 text-center text-body text-fg-muted">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="!detail" class="py-8 text-center text-body text-fg-muted">
      {{ t('channelStatus.detailLoadError') }}
    </div>
    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('channelStatus.detailColumns.model') }}</th>
            <th>{{ t('channelStatus.detailColumns.latestStatus') }}</th>
            <th class="text-right">{{ t('channelStatus.detailColumns.latestLatency') }}</th>
            <th class="text-right">{{ t('channelStatus.detailColumns.availability7d') }}</th>
            <th class="text-right">{{ t('channelStatus.detailColumns.availability15d') }}</th>
            <th class="text-right">{{ t('channelStatus.detailColumns.availability30d') }}</th>
            <th class="text-right">{{ t('channelStatus.detailColumns.avgLatency7d') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in detail.models"
            :key="m.model"
          >
            <td class="font-mono text-label">{{ formatMonitorModel(m.model) }}</td>
            <td>
              <span class="badge" :class="stampClass(m.latest_status)">
                {{ statusLabel(m.latest_status) }}
              </span>
            </td>
            <td class="text-right tabular-nums">{{ formatLatency(m.latest_latency_ms) }}</td>
            <td class="text-right tabular-nums">{{ formatPercent(m.availability_7d) }}</td>
            <td class="text-right tabular-nums">{{ formatPercent(m.availability_15d) }}</td>
            <td class="text-right tabular-nums">{{ formatPercent(m.availability_30d) }}</td>
            <td class="text-right tabular-nums">{{ formatLatency(m.avg_latency_7d_ms) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button @click="$emit('close')" class="btn btn-secondary">
          {{ t('channelStatus.closeDetail') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  status as fetchChannelMonitorDetail,
  type UserMonitorDetail,
} from '@/api/channelMonitor'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'

const props = defineProps<{
  show: boolean
  monitorId: number | null
  title: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { statusLabel, formatLatency, formatPercent, formatMonitorModel } = useChannelMonitorFormat()

const STAMP: Record<string, string> = {
  operational: 'badge-success',
  degraded: 'badge-warning',
  failed: 'badge-danger',
}
const stampClass = (s: string) => STAMP[s] ?? 'badge-gray'

const detail = ref<UserMonitorDetail | null>(null)
const loading = ref(false)

async function load(id: number) {
  detail.value = null
  loading.value = true
  try {
    detail.value = await fetchChannelMonitorDetail(id)
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.detailLoadError')))
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.show, props.monitorId] as const,
  ([show, id]) => {
    if (!show) {
      detail.value = null
      return
    }
    if (id != null) void load(id)
  },
  { immediate: true },
)
</script>
