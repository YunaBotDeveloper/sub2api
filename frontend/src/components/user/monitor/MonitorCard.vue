<template>
  <button
    type="button"
    class="group grid w-full grid-cols-1 gap-x-6 gap-y-3 bg-surface px-4 py-4 text-left transition-colors hover:bg-accent-weak/50 focus:outline-none focus-visible:bg-accent-weak lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center"
    @click="emit('click')"
  >
    <!-- 名称 / 提供方 / 模型 / 状态印章 -->
    <div class="flex min-w-0 items-start gap-3">
      <span class="mt-0.5 flex-shrink-0 text-accent">
        <ProviderIcon :provider="item.provider" :size="18" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-center gap-2">
          <span class="truncate text-body font-semibold text-fg group-hover:text-accent-strong">
            {{ item.name }}
          </span>
          <span class="badge flex-shrink-0" :class="stampClass(item.primary_status)">
            {{ statusLabel(item.primary_status) }}
          </span>
        </div>
        <div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-meta text-fg-muted">
          <span class="flex-shrink-0 font-medium">{{ providerLabel(item.provider) }}</span>
          <!-- 纯配额模式主模型是占位符 "quota"，展示层替换为本地化「配额」标签 -->
          <span class="truncate font-mono">{{ formatMonitorModel(item.primary_model) }}</span>
          <span v-if="item.group_name" class="badge badge-gray flex-shrink-0">{{ item.group_name }}</span>
        </div>
        <!-- 配额模式：最新用量/余额快照（服务端已按系统开关剥离，此处 flag 为纵深防御） -->
        <MonitorQuotaView v-if="quotaVisible" :snapshot="item.latest_quota" class="mt-2" />
      </div>
    </div>

    <!-- 延迟 + 可用率 -->
    <div class="min-w-0">
      <MonitorMetricPair
        primary-icon="bolt"
        :primary-label="t('monitorCommon.dialogLatency')"
        :primary-value="formatLatency(item.primary_latency_ms)"
        primary-unit="ms"
        secondary-icon="globe"
        :secondary-label="t('monitorCommon.endpointPing')"
        :secondary-value="formatLatency(item.primary_ping_latency_ms)"
        secondary-unit="ms"
      />
      <MonitorAvailabilityRow
        :window-label="availabilityLabel"
        :value="availabilityValue"
        :samples-label="extraModelsCountLabel"
      />
    </div>

    <!-- 历史读数条 -->
    <MonitorTimeline
      :buckets="item.timeline"
      :countdown-seconds="countdownSeconds"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserMonitorView } from '@/api/channelMonitor'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'
import { isChannelMonitorQuotaVisible } from '@/utils/featureFlags'
import ProviderIcon from './ProviderIcon.vue'
import MonitorMetricPair from './MonitorMetricPair.vue'
import MonitorAvailabilityRow from './MonitorAvailabilityRow.vue'
import MonitorTimeline from './MonitorTimeline.vue'
import MonitorQuotaView from '@/components/common/MonitorQuotaView.vue'


const props = defineProps<{
  item: UserMonitorView
  window: '7d' | '15d' | '30d'
  availabilityValue: number | null
  countdownSeconds: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const { t } = useI18n()
const {
  statusLabel,
  providerLabel,
  formatLatency,
  formatMonitorModel,
} = useChannelMonitorFormat()

// 状态 → 印章
const STAMP: Record<string, string> = {
  operational: 'badge-success',
  degraded: 'badge-warning',
  failed: 'badge-danger',
}
const stampClass = (s: string) => STAMP[s] ?? 'badge-gray'

const quotaVisible = computed(
  () => isChannelMonitorQuotaVisible() && !!props.item.latest_quota
)

const availabilityLabel = computed(() => {
  const win = t(`channelStatus.windowTab.${props.window}`)
  return `${t('monitorCommon.availabilityPrefix')} · ${win}`
})

const extraModelsCountLabel = computed(() => {
  const count = props.item.extra_models?.length ?? 0
  if (count === 0) return undefined
  return t('monitorCommon.extraModelsCount', { n: count })
})
</script>
