<template>
  <!-- 读数格：放进 .meter 容器时与相邻格共用印刷细线；单独使用时自带边框 -->
  <div :class="['meter-cell stat-meter', { 'meter-cell-current': current }]">
    <p class="meter-label">{{ label }}</p>
    <div class="min-w-0">
      <slot name="value">
        <p :class="['meter-value', toneClass]">
          <MeterValue :value="formattedValue" />
        </p>
      </slot>
    </div>
    <p v-if="sub || $slots.sub" class="meter-sub">
      <slot name="sub">{{ sub }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import MeterValue from './MeterValue.vue'

type IconName = InstanceType<typeof Icon>['$props']['name']
type Tone = 'default' | 'success' | 'warning' | 'danger'

interface Props {
  label: string
  value?: number | string
  sub?: string
  /** 保留兼容：账单世界里读数格不画图标 */
  icon?: IconName
  /** 数值颜色只在数值本身带有语义时使用（例如“新增”为 success，“错误”为 danger） */
  tone?: Tone
  /** 本期 / 当前读数：黄色底标 */
  current?: boolean
  formatValue?: (value: number | string) => string
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  tone: 'default',
  current: false
})

const formattedValue = computed(() => {
  if (props.formatValue) return props.formatValue(props.value)
  if (typeof props.value === 'number') return props.value.toLocaleString()
  return props.value
})

const toneClass = computed(() => {
  const classes: Record<Tone, string> = {
    default: '',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger'
  }
  return classes[props.tone]
})
</script>
