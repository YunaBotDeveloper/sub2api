<template>
  <section aria-labelledby="prompt-pool-title" class="border-b border-border py-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="prompt-pool-title" class="text-h3 font-bold text-accent-strong">{{ t('admin.promptAudit.pool.title') }}</h2>
        <p class="mt-1 text-body text-fg-muted">{{ t('admin.promptAudit.pool.description') }}</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" data-test="add-endpoint" @click="openCreate">
        {{ t('admin.promptAudit.pool.add') }}
      </button>
    </div>

    <div v-if="endpoints.length === 0" class="empty-state mt-5 border border-dashed border-border-strong text-body text-fg-muted">
      {{ t('admin.promptAudit.pool.empty') }}
    </div>
    <div v-else class="mt-5 overflow-hidden rounded-sm border border-border bg-surface">
      <div class="hidden grid-cols-[minmax(260px,1.45fr)_minmax(210px,1fr)_minmax(190px,.8fr)_minmax(230px,1.15fr)_auto] gap-5 border-b-2 border-b-accent bg-accent-weak px-5 py-2 text-label font-semibold text-accent-strong xl:grid">
        <span>{{ t('admin.promptAudit.pool.node') }}</span>
        <span>{{ t('admin.promptAudit.pool.model') }}</span>
        <span>{{ t('admin.promptAudit.pool.limits') }}</span>
        <span>{{ t('admin.promptAudit.pool.credential') }}</span>
        <span class="text-right">{{ t('admin.promptAudit.common.actions') }}</span>
      </div>

      <div class="divide-y divide-border">
        <article
          v-for="endpoint in endpoints"
          :key="endpoint.id"
          :data-test="`endpoint-${endpoint.id}`"
          class="group grid gap-4 px-4 py-4 transition-[background-color,border-color] duration-150 hover:bg-accent-weak/50 sm:px-5 xl:grid-cols-[minmax(260px,1.45fr)_minmax(210px,1fr)_minmax(190px,.8fr)_minmax(230px,1.15fr)_auto] xl:items-center xl:gap-5"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="endpoint.enabled"
              :aria-label="t('admin.promptAudit.pool.toggleNode', { name: endpoint.name })"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              :class="endpoint.enabled ? 'bg-accent' : 'bg-border-strong'"
              @click="toggleEndpoint(endpoint.id)"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-in-out"
                :class="endpoint.enabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
            <div class="min-w-0">
              <div class="flex min-w-0 items-center gap-2">
                <p class="truncate font-semibold text-fg">{{ endpoint.name }}</p>
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="endpoint.enabled ? 'bg-success' : 'bg-border'" aria-hidden="true" />
              </div>
              <p class="mt-0.5 truncate font-mono text-meta text-fg-muted" :title="endpoint.base_url">{{ endpoint.base_url }}</p>
            </div>
          </div>

          <div class="min-w-0 xl:block">
            <p class="mb-1 text-meta font-medium text-fg-muted xl:hidden">{{ t('admin.promptAudit.pool.model') }}</p>
            <p class="truncate font-mono text-label text-fg" :title="endpoint.model">{{ endpoint.model }}</p>
          </div>

          <div>
            <p class="mb-1 text-meta font-medium text-fg-muted xl:hidden">{{ t('admin.promptAudit.pool.limits') }}</p>
            <div class="flex flex-wrap items-center gap-x-2 text-label tabular-nums text-fg">
              <span>{{ endpoint.timeout_ms }} ms</span>
              <span class="text-fg-subtle" aria-hidden="true">·</span>
              <span>{{ endpoint.input_limit }} chars</span>
            </div>
          </div>

          <div class="min-w-0">
            <p class="mb-1 text-meta font-medium text-fg-muted xl:hidden">{{ t('admin.promptAudit.pool.credential') }}</p>
            <div class="flex items-center gap-1.5 text-label font-medium" :class="credentialInvalid(endpoint) ? 'text-danger' : hasCredential(endpoint) ? 'text-success-strong' : 'text-fg-muted'">
              <span class="h-1.5 w-1.5 rounded-full" :class="credentialInvalid(endpoint) ? 'bg-danger' : hasCredential(endpoint) ? 'bg-success' : 'bg-border'" aria-hidden="true" />
              {{ credentialInvalid(endpoint) ? t('admin.promptAudit.pool.invalid') : hasCredential(endpoint) ? t('admin.promptAudit.pool.configured') : t('admin.promptAudit.pool.missing') }}
            </div>
            <p v-if="probingIds.includes(endpoint.id)" class="mt-1.5 text-meta text-accent">
              {{ t('admin.promptAudit.pool.probeProgress') }}
            </p>
            <p v-if="probeResults[endpoint.id]" class="mt-1.5 line-clamp-2 text-meta leading-5 tabular-nums" :class="probeResults[endpoint.id].ok ? 'text-success' : 'text-danger'">
              {{ t('admin.promptAudit.pool.probeResult', { status: probeResults[endpoint.id].status, http: probeResults[endpoint.id].http_status || '—', latency: probeResults[endpoint.id].latency_ms }) }}
              · {{ probeResults[endpoint.id].message }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3 xl:flex-nowrap xl:border-0 xl:pt-0">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="probingIds.includes(endpoint.id)" @click="$emit('probe', endpoint)">
              {{ probingIds.includes(endpoint.id) ? t('admin.promptAudit.pool.probing') : t('admin.promptAudit.pool.probe') }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="openEdit(endpoint)">{{ t('common.edit') }}</button>
            <button type="button" class="btn btn-ghost btn-sm text-danger hover:bg-danger-weak" @click="removeEndpoint(endpoint)">{{ t('common.delete') }}</button>
          </div>
        </article>
      </div>
    </div>

    <BaseDialog :show="Boolean(editing)" :title="editingIndex < 0 ? t('admin.promptAudit.pool.add') : t('admin.promptAudit.pool.edit')" width="wide" @close="closeEditor">
      <form v-if="editing" class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveEditor">
        <label class="space-y-1 text-sm text-fg">
          <span>{{ t('admin.promptAudit.pool.name') }}</span>
          <input v-model="editing.name" class="input w-full" required :aria-label="t('admin.promptAudit.pool.name')" />
        </label>
        <label class="space-y-1 text-sm text-fg">
          <span>{{ t('admin.promptAudit.pool.id') }}</span>
          <input v-model="editing.id" class="input w-full" required :disabled="editingIndex >= 0" :aria-label="t('admin.promptAudit.pool.id')" />
        </label>
        <label class="space-y-1 text-sm text-fg sm:col-span-2">
          <span>{{ t('admin.promptAudit.pool.baseUrl') }}</span>
          <input v-model="editing.base_url" class="input w-full" required inputmode="url" :aria-label="t('admin.promptAudit.pool.baseUrl')" />
        </label>
        <label class="space-y-1 text-sm text-fg sm:col-span-2">
          <span>{{ t('admin.promptAudit.pool.apiKey') }}</span>
          <input v-model="editing.token" class="input w-full" type="password" autocomplete="new-password" :placeholder="editing.has_token ? (editing.token_status === 'invalid' ? t('admin.promptAudit.pool.reenterSecret') : t('admin.promptAudit.pool.keepSecret')) : ''" :aria-label="t('admin.promptAudit.pool.apiKey')" />
          <span class="block text-xs text-fg-muted">{{ t('admin.promptAudit.pool.secretHint') }}</span>
        </label>
        <label v-if="editing.has_token" class="flex items-center gap-2 text-sm text-danger sm:col-span-2">
          <input v-model="editing.clear_token" type="checkbox" :aria-label="t('admin.promptAudit.pool.clearSecret')" />
          {{ t('admin.promptAudit.pool.clearSecret') }}
        </label>
        <label class="space-y-1 text-sm text-fg sm:col-span-2">
          <span>{{ t('admin.promptAudit.pool.model') }}</span>
          <input v-model="editing.model" class="input w-full" :aria-label="t('admin.promptAudit.pool.model')" />
        </label>
        <label class="space-y-1 text-sm text-fg">
          <span>{{ t('admin.promptAudit.pool.timeout') }}</span>
          <input v-model.number="editing.timeout_ms" class="input w-full" type="number" min="100" max="30000" required :aria-label="t('admin.promptAudit.pool.timeout')" />
        </label>
        <label class="space-y-1 text-sm text-fg">
          <span>{{ t('admin.promptAudit.pool.inputLimit') }}</span>
          <input v-model.number="editing.input_limit" class="input w-full" type="number" min="128" max="100000" required :aria-label="t('admin.promptAudit.pool.inputLimit')" />
        </label>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn btn-secondary" @click="closeEditor">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" data-test="save-endpoint" @click="saveEditor">{{ t('common.save') }}</button>
        </div>
      </template>
    </BaseDialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import type { PromptAuditEndpointDraft, PromptProbeResult } from '../types'
import { cloneData, createDefaultEndpoint } from '../viewModel'

const props = defineProps<{
  endpoints: PromptAuditEndpointDraft[]
  probeResults: Record<string, PromptProbeResult>
  probingIds: string[]
}>()
const emit = defineEmits<{
  (event: 'update:endpoints', value: PromptAuditEndpointDraft[]): void
  (event: 'probe', endpoint: PromptAuditEndpointDraft): void
}>()
const { t } = useI18n()
const editing = ref<PromptAuditEndpointDraft | null>(null)
const editingIndex = ref(-1)

function openCreate() {
  editingIndex.value = -1
  editing.value = createDefaultEndpoint(props.endpoints.length + 1)
}
function openEdit(endpoint: PromptAuditEndpointDraft) {
  editingIndex.value = props.endpoints.findIndex((item) => item.id === endpoint.id)
  editing.value = cloneData(endpoint)
}
function closeEditor() {
  editing.value = null
  editingIndex.value = -1
}
function saveEditor() {
  if (!editing.value?.id.trim() || !editing.value.name.trim() || !editing.value.base_url.trim()) return
  const next = props.endpoints.map((item) => cloneData(item))
  const value = cloneData(editing.value)
  if (value.token.trim()) value.clear_token = false
  if (editingIndex.value < 0) next.push(value)
  else next.splice(editingIndex.value, 1, value)
  emit('update:endpoints', next)
  closeEditor()
}
function toggleEndpoint(id: string) {
  emit('update:endpoints', props.endpoints.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : cloneData(item)))
}
function removeEndpoint(endpoint: PromptAuditEndpointDraft) {
  if (!window.confirm(t('admin.promptAudit.pool.deleteConfirm', { name: endpoint.name }))) return
  emit('update:endpoints', props.endpoints.filter((item) => item.id !== endpoint.id).map((item) => cloneData(item)))
}
function hasCredential(endpoint: PromptAuditEndpointDraft): boolean {
  return Boolean(endpoint.token.trim() || (endpoint.has_token && !endpoint.clear_token))
}
function credentialInvalid(endpoint: PromptAuditEndpointDraft): boolean {
  return endpoint.token_status === 'invalid' && !endpoint.token.trim() && !endpoint.clear_token
}
</script>
