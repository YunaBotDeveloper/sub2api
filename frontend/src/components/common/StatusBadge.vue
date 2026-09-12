<template>
  <div class="inline-flex items-center gap-1.5">
    <!-- 形状 + 颜色双通道：成功=实心圆，警告=空心圆，错误=实心方块，其它=灰色空心圆 -->
    <span :class="['inline-block h-2 w-2 flex-shrink-0', variantClass]" aria-hidden="true"></span>
    <span class="text-body text-fg">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  label: string
}>()

const variantClass = computed(() => {
  switch (props.status) {
    case 'active':
    case 'success':
      return 'rounded-full bg-success'
    case 'disabled':
    case 'inactive':
    case 'warning':
      return 'rounded-full border-2 border-warning bg-transparent'
    case 'error':
    case 'danger':
      return 'rounded-sm bg-danger'
    default:
      return 'rounded-full border-2 border-fg-subtle bg-transparent'
  }
})
</script>
