<template>
  <BaseDialog
    :show="show"
    :title="t('admin.channelMonitor.runResultTitle')"
    width="normal"
    @close="$emit('close')"
  >
    <div class="divide-y divide-border border-y border-border">
      <div
        v-for="r in results"
        :key="r.model"
        class="flex items-center justify-between gap-3 py-2 text-sm"
      >
        <div class="flex flex-col">
          <span class="font-mono font-medium text-fg">{{ formatMonitorModel(r.model) }}</span>
          <span v-if="r.message" class="text-xs text-fg-muted">{{ r.message }}</span>
          <MonitorQuotaView :snapshot="r.quota" class="mt-1" />
        </div>
        <div class="flex items-center gap-2">
          <span
            class="badge"
            :class="statusBadgeClass(r.status)"
          >
            {{ statusLabel(r.status) }}
          </span>
          <span class="min-w-[4.5rem] text-right text-label font-semibold tabular-nums text-fg">{{ formatLatency(r.latency_ms) }} ms</span>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <button @click="$emit('close')" class="btn btn-primary">
          {{ t('common.close') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CheckResult } from '@/api/admin/channelMonitor'
import BaseDialog from '@/components/common/BaseDialog.vue'
import MonitorQuotaView from '@/components/common/MonitorQuotaView.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'

defineProps<{
  show: boolean
  results: CheckResult[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const { statusLabel, statusBadgeClass, formatLatency, formatMonitorModel } = useChannelMonitorFormat()
</script>
