<template>
  <div class="mt-2 flex items-baseline justify-between gap-2">
    <div class="truncate text-meta font-medium text-fg-muted">
      {{ windowLabel }}
    </div>
    <div class="flex items-baseline gap-0.5">
      <span
        class="text-h2 font-bold tabular-nums leading-none"
        :style="colorStyle"
      >
        {{ displayValue }}
      </span>
      <span
        class="text-label font-semibold leading-none"
        :style="colorStyle"
      >%</span>
    </div>
  </div>
  <div
    v-if="samplesLabel"
    class="mt-0.5 text-right text-meta text-fg-subtle"
  >
    {{ samplesLabel }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { hslForPct } from '@/composables/useChannelMonitorFormat'

const props = defineProps<{
  windowLabel: string
  value: number | null
  samplesLabel?: string
}>()

const { t } = useI18n()

const displayValue = computed(() => {
  if (props.value === null || Number.isNaN(props.value)) return t('monitorCommon.latencyEmpty')
  return props.value.toFixed(2)
})

const colorStyle = computed(() => {
  const colour = hslForPct(props.value)
  return colour ? { color: colour } : { color: 'rgb(var(--fg-subtle))' }
})
</script>
