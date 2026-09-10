<template>
  <section class="card">
    <div class="card-header">
      <h2 class="text-h2 font-semibold text-fg">{{ t('dashboard.quickActions') }}</h2>
    </div>
    <div class="flex flex-col gap-2 p-4">
      <router-link
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        class="group flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Icon :name="action.icon" size="md" class="shrink-0 text-fg-muted" aria-hidden="true" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-body font-medium text-fg">{{ t(action.title) }}</span>
          <span class="block truncate text-meta text-fg-muted">{{ t(action.desc) }}</span>
        </span>
        <Icon name="chevronRight" size="sm" class="shrink-0 text-fg-subtle group-hover:text-fg" aria-hidden="true" />
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'

type IconName = InstanceType<typeof Icon>['$props']['name']

const { t } = useI18n()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

const actions = computed<{ to: string; icon: IconName; title: string; desc: string }[]>(() => [
  { to: '/keys', icon: 'key', title: 'dashboard.createApiKey', desc: 'dashboard.generateNewKey' },
  { to: '/usage', icon: 'chart', title: 'dashboard.viewUsage', desc: 'dashboard.checkDetailedLogs' },
  ...(canUseBatchImage.value
    ? [{ to: '/batch-image', icon: 'sparkles' as IconName, title: 'dashboard.batchImageAgent', desc: 'dashboard.batchImageAgentDesc' }]
    : []),
  { to: '/redeem', icon: 'gift', title: 'dashboard.redeemCode', desc: 'dashboard.addBalanceWithCode' }
])

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>
