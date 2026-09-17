<template>
  <section class="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-accent">
    <div role="tablist" class="tabs border-b-0">
      <button
        v-for="opt in windowOptions"
        :key="opt.value"
        type="button"
        role="tab"
        :aria-selected="window === opt.value"
        :class="['tab', { 'tab-active': window === opt.value }]"
        @click="emit('update:window', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 pb-1.5">
      <span class="badge" :class="overallChipClass">
        <span class="h-1.5 w-1.5 rounded-full" :class="overallDotClass"></span>
        {{ overallLabel }}
      </span>

      <button
        type="button"
        class="btn btn-ghost btn-icon"
        :disabled="loading"
        :title="t('common.refresh')" :aria-label="t('common.refresh')"
        @click="emit('refresh')"
      >
        <Icon name="refresh" size="sm" :class="loading ? 'animate-spin' : ''" />
      </button>

      <AutoRefreshButton
        v-if="autoRefresh"
        :enabled="autoRefresh.enabled.value"
        :interval-seconds="autoRefresh.intervalSeconds.value"
        :countdown="autoRefresh.countdown.value"
        :intervals="autoRefresh.intervals"
        @update:enabled="autoRefresh.setEnabled"
        @update:interval="autoRefresh.setInterval"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import AutoRefreshButton from '@/components/common/AutoRefreshButton.vue'
export type MonitorWindow = '7d' | '15d' | '30d'
export type OverallStatus = 'operational' | 'degraded'

const props = defineProps<{
  overallStatus: OverallStatus
  intervalSeconds: number
  window: MonitorWindow
  loading: boolean
  autoRefresh?: {
    enabled: { value: boolean }
    intervalSeconds: { value: number }
    countdown: { value: number }
    intervals: readonly number[]
    setEnabled: (v: boolean) => void
    setInterval: (v: number) => void
  }
}>()

const emit = defineEmits<{
  (e: 'update:window', value: MonitorWindow): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()

const windowOptions = computed<{ value: MonitorWindow; label: string }[]>(() => [
  { value: '7d', label: t('channelStatus.windowTab.7d') },
  { value: '15d', label: t('channelStatus.windowTab.15d') },
  { value: '30d', label: t('channelStatus.windowTab.30d') },
])

const overallLabel = computed(() => t(`channelStatus.overall.${props.overallStatus}`))

const overallChipClass = computed(() => {
  switch (props.overallStatus) {
    case 'operational':
      return 'badge-success'
    case 'degraded':
    default:
      return 'badge-warning'
  }
})

const overallDotClass = computed(() => {
  switch (props.overallStatus) {
    case 'operational':
      return 'bg-success animate-pulse'
    case 'degraded':
    default:
      return 'bg-warning animate-pulse'
  }
})

</script>
