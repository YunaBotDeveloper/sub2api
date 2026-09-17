<template>
  <!-- 状态印章：形状 + 颜色双通道（成功=实心点，警告=空心点，错误=方块，其它=灰色空心点） -->
  <span :class="['badge', badgeClass]">
    <span :class="['inline-block h-1.5 w-1.5 flex-shrink-0', variantClass]" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  label: string
}>()

const badgeClass = computed(() => {
  switch (props.status) {
    case 'active':
    case 'success':
      return 'badge-success'
    case 'disabled':
    case 'inactive':
    case 'warning':
      return 'badge-warning'
    case 'error':
    case 'danger':
      return 'badge-danger'
    default:
      return 'badge-gray'
  }
})

const variantClass = computed(() => {
  switch (props.status) {
    case 'active':
    case 'success':
      return 'rounded-full bg-success'
    case 'disabled':
    case 'inactive':
    case 'warning':
      return 'rounded-full border border-warning bg-transparent'
    case 'error':
    case 'danger':
      return 'rounded-sm bg-danger'
    default:
      return 'rounded-full border border-fg-subtle bg-transparent'
  }
})
</script>
