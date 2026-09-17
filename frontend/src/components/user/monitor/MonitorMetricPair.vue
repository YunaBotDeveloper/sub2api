<template>
  <dl class="grid grid-cols-2 divide-x divide-border border-y border-border">
    <div class="px-2 py-1.5">
      <dt class="flex items-center gap-1 text-meta font-medium text-fg-muted">
        <Icon :name="primaryIcon" size="xs" class="text-accent" />
        <span class="truncate">{{ primaryLabel }}</span>
      </dt>
      <dd class="text-h3 font-bold tabular-nums text-fg">
        {{ primaryValue }}<span class="ml-0.5 text-meta font-normal text-fg-subtle">{{ primaryUnit }}</span>
      </dd>
    </div>
    <div class="px-2 py-1.5">
      <dt class="flex items-center gap-1 text-meta font-medium text-fg-muted">
        <Icon :name="secondaryIcon" size="xs" class="text-accent" />
        <span class="truncate">{{ secondaryLabel }}</span>
      </dt>
      <dd class="text-h3 font-bold tabular-nums text-fg">
        {{ secondaryValue }}<span class="ml-0.5 text-meta font-normal text-fg-subtle">{{ secondaryUnit }}</span>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'

defineProps<{
  primaryLabel: string
  primaryValue: string
  primaryUnit: string
  primaryIcon: 'bolt' | 'globe' | 'clock' | 'link'
  secondaryLabel: string
  secondaryValue: string
  secondaryUnit: string
  secondaryIcon: 'bolt' | 'globe' | 'clock' | 'link'
}>()
</script>
