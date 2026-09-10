<template>
  <div class="card p-4">
    <div class="flex flex-col gap-1">
      <p class="flex items-center gap-1.5 text-meta font-medium uppercase tracking-wider text-fg-subtle">
        <Icon v-if="icon" :name="icon" size="xs" aria-hidden="true" />
        <span class="truncate">{{ label }}</span>
      </p>
      <div class="min-w-0">
        <slot name="value">
          <p
            :class="['stat-value', toneClass]"
            :title="String(formattedValue)"
          >
            {{ formattedValue }}
          </p>
        </slot>
      </div>
      <p v-if="sub || $slots.sub" class="text-meta text-fg-muted">
        <slot name="sub">{{ sub }}</slot>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'

type IconName = InstanceType<typeof Icon>['$props']['name']
type Tone = 'default' | 'success' | 'warning' | 'danger'

interface Props {
  label: string
  value?: number | string
  sub?: string
  icon?: IconName
  /** 数值颜色只在数值本身带有语义时使用（例如“新增”为 success，“错误”为 danger） */
  tone?: Tone
  formatValue?: (value: number | string) => string
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  tone: 'default'
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
