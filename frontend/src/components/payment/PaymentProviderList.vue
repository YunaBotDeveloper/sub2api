<template>
  <div class="card">
    <!-- Header -->
    <div class="card-header">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="card-title">
            {{ t('admin.settings.payment.providerManagement') }}
          </h2>
          <p class="mt-0.5 text-meta text-fg-muted">
            {{ t('admin.settings.payment.providerManagementDesc') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('refresh')"
            :disabled="loading"
            class="btn btn-secondary btn-sm"
            :title="t('common.refresh')" :aria-label="t('common.refresh')"
          >
            <Icon name="refresh" size="sm" :class="loading ? 'animate-spin' : ''" />
          </button>
          <button
            type="button"
            @click="emit('create')"
            :disabled="!canCreate"
            :class="canCreate
              ? 'btn btn-primary btn-sm'
              : 'btn btn-secondary btn-sm cursor-not-allowed opacity-50'"
          >
            {{ t('admin.settings.payment.createProvider') }}
          </button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="px-4 py-1">
      <!-- Loading -->
      <div v-if="loading && !providers.length" class="flex items-center justify-center py-6">
        <div class="spinner text-accent" />
      </div>

      <!-- Provider cards (draggable) -->
      <VueDraggable
        v-if="providers.length"
        v-model="localProviders"
        :animation="200"
        handle=".drag-handle"
        class="divide-y divide-border"
        @end="onDragEnd"
      >
        <div v-for="p in localProviders" :key="p.id" class="flex items-start gap-2">
          <div class="drag-handle mt-3 flex cursor-grab items-center text-border-strong hover:text-fg-muted active:cursor-grabbing">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <ProviderCard
              :provider="p"
              :enabled="isEnabled(p.provider_key)"
              :available-types="getTypes(p.provider_key)"
              @toggle-field="(field) => emit('toggleField', p, field)"
              @toggle-type="(type) => emit('toggleType', p, type)"
              @edit="emit('edit', p)"
              @delete="emit('delete', p)"
            />
          </div>
        </div>
      </VueDraggable>

      <!-- Empty -->
      <div v-else-if="!loading" class="py-6 text-center">
        <p class="text-body text-fg-muted">
          {{ canCreate
            ? t('admin.settings.payment.noProviders')
            : t('admin.settings.payment.enableTypesFirst') }}
        </p>
        <button
          type="button"
          v-if="canCreate"
          @click="emit('create')"
          class="btn btn-primary btn-sm mt-2"
        >
          {{ t('admin.settings.payment.createProvider') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable } from 'vue-draggable-plus'
import Icon from '@/components/icons/Icon.vue'
import ProviderCard from './ProviderCard.vue'
import type { ProviderInstance } from '@/types/payment'
import type { TypeOption } from './providerConfig'
import { getAvailableTypes } from './providerConfig'

const props = defineProps<{
  providers: ProviderInstance[]
  loading: boolean
  canCreate: boolean
  enabledPaymentTypes: string[]
  allPaymentTypes: TypeOption[]
}>()

const emit = defineEmits<{
  refresh: []
  create: []
  edit: [provider: ProviderInstance]
  delete: [provider: ProviderInstance]
  toggleField: [provider: ProviderInstance, field: 'enabled']
  toggleType: [provider: ProviderInstance, type: string]
  reorder: [providers: { id: number; sort_order: number }[]]
}>()

const { t } = useI18n()

const localProviders = ref<ProviderInstance[]>([])

watch(() => props.providers, (val) => {
  localProviders.value = [...val]
}, { immediate: true })

function onDragEnd() {
  const updates = localProviders.value.map((p, idx) => ({
    id: p.id,
    sort_order: idx,
  }))
  emit('reorder', updates)
}

function isEnabled(providerKey: string): boolean {
  return props.enabledPaymentTypes.includes(providerKey)
}

function getTypes(providerKey: string): TypeOption[] {
  return getAvailableTypes(providerKey, props.allPaymentTypes)
    .map(opt => opt.label === opt.value
      ? { ...opt, label: t(`payment.methods.${opt.value}`, opt.value) }
      : opt,
    )
}
</script>
