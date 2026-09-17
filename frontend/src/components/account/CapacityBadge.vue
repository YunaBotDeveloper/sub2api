<script setup lang="ts">
defineProps<{
  colorClass: string
  tooltip?: string
  current: string | number
  max: string | number
  suffix?: string
}>()
</script>

<template>
  <span
    :class="[
      'badge gap-1 px-1.5 py-px text-[10px] leading-tight tabular-nums',
      colorClass
    ]"
    :title="tooltip"
  >
    <slot />
    <span>{{ current }}</span>
    <span class="text-fg-subtle">/</span>
    <span>{{ max }}</span>
    <span v-if="suffix" class="text-[9px] opacity-60">{{ suffix }}</span>
  </span>
</template>
