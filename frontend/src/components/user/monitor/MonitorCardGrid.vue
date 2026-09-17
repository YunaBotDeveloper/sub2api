<template>
  <div>
    <div
      v-if="loading && items.length === 0"
      class="card divide-y divide-border"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.4fr)]"
      >
        <div class="space-y-2">
          <div class="skeleton h-4 w-2/3"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
        <div class="skeleton h-10 w-full"></div>
        <div class="skeleton h-6 w-full"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="items.length === 0"
      :title="t('channelStatus.empty.title')"
      :description="t('channelStatus.empty.description')"
    />

    <div
      v-else
      class="card divide-y divide-border"
    >
      <MonitorCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :window="window"
        :availability-value="resolveAvailability(item)"
        :countdown-seconds="countdownSeconds"
        @click="emit('cardClick', item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UserMonitorView, UserMonitorDetail } from '@/api/channelMonitor'
import EmptyState from '@/components/common/EmptyState.vue'
import MonitorCard from './MonitorCard.vue'

const props = defineProps<{
  items: UserMonitorView[]
  window: '7d' | '15d' | '30d'
  countdownSeconds: number
  loading: boolean
  detailCache: Record<number, UserMonitorDetail>
}>()

const emit = defineEmits<{
  (e: 'cardClick', item: UserMonitorView): void
}>()

const { t } = useI18n()

function resolveAvailability(item: UserMonitorView): number | null {
  if (props.window === '7d') {
    return item.availability_7d ?? null
  }
  const detail = props.detailCache[item.id]
  if (!detail) return null
  const primary = detail.models.find(m => m.model === item.primary_model)
  if (!primary) return null
  return props.window === '15d' ? primary.availability_15d ?? null : primary.availability_30d ?? null
}
</script>
