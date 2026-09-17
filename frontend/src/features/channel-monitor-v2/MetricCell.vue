<template>
  <!-- 读数格：放进 .meter 容器时与相邻格共用印刷细线 -->
  <div class="meter-cell min-h-[6.5rem]" :title="title || undefined">
    <span class="meter-label flex items-center gap-1.5">
      <span
        v-if="resolvedState"
        class="h-2 w-2 shrink-0 rounded-full"
        :class="dotClass"
        aria-hidden="true"
      ></span>
      {{ label }}
    </span>
    <strong
      class="block overflow-visible whitespace-normal text-h2 font-bold leading-tight tabular-nums"
      :class="stateClass"
    >{{ value }}</strong>
    <div
      v-if="detailParts.length > 1"
      class="flex flex-wrap gap-x-2 gap-y-0.5 text-meta leading-snug text-fg-muted"
    >
      <span
        v-for="(part, index) in detailParts"
        :key="`${index}:${part}`"
        class="whitespace-nowrap tabular-nums"
      >{{ part }}</span>
    </div>
    <small
      v-else-if="detail"
      class="meter-sub block whitespace-normal"
    >{{ detail }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HealthState } from '@/api/channelMonitorV2'

const props = defineProps<{
  label: string
  value: string
  detail: string
  state?: HealthState
  /** Exact numeric tooltip (e.g. uncompacted RPM/TPM). */
  title?: string
}>()

/** Split "AVG 475ms · P90 800ms" into chips so nothing is ellipsized. */
const detailParts = computed(() => {
  const raw = (props.detail || '').trim()
  if (!raw || raw === '-') return []
  return raw
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
})

const missingValue = computed(() => {
  const value = (props.value || '').trim()
  return value === '' || value === '-' || value === '—'
})

const resolvedState = computed(() => (missingValue.value ? undefined : props.state))

const stateClass = computed(() => {
  if (!resolvedState.value) return missingValue.value ? 'text-fg-muted' : 'text-fg'
  if (resolvedState.value === 'healthy') return 'text-success'
  if (resolvedState.value === 'warning') return 'text-warning'
  if (resolvedState.value === 'critical') return 'text-danger'
  return 'text-fg-muted'
})

const dotClass = computed(() => {
  if (resolvedState.value === 'healthy') return 'bg-success'
  if (resolvedState.value === 'warning') return 'bg-warning'
  if (resolvedState.value === 'critical') return 'bg-danger'
  return 'bg-border'
})
</script>
