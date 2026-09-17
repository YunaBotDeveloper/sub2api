<template>
  <div class="flex items-center">
    <span
      :class="[
        'badge tabular-nums',
        statusClass
      ]"
    >
      <span>{{ current }}</span>
      <span class="text-fg-subtle">/</span>
      <span>{{ max }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
}>()

// Status color based on usage
const statusClass = computed(() => {
  const { current, max } = props

  // Full: red
  if (current >= max && max > 0) {
    return 'badge-danger'
  }
  // In use: yellow
  if (current > 0) {
    return 'badge-warning'
  }
  // Idle: gray
  return 'badge-gray'
})
</script>
