<template>
  <section aria-labelledby="prompt-runtime-title" class="border-b border-border py-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="prompt-runtime-title" class="text-h3 font-bold text-accent-strong">
          {{ t('admin.promptAudit.runtime.title') }}
        </h2>
        <p class="mt-1 text-body text-fg-muted">
          {{ t('admin.promptAudit.runtime.description') }}
        </p>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="loading" @click="$emit('refresh')">
        {{ t('admin.promptAudit.actions.refresh') }}
      </button>
    </div>

    <div v-if="error" role="alert" class="mt-5 border border-danger/40 bg-danger-weak px-4 py-3 text-body text-danger-strong">
      {{ error }}
    </div>
    <div v-else-if="loading && !runtime" class="meter mt-5" aria-busy="true">
      <div v-for="index in 6" :key="index" class="meter-cell"><div class="skeleton h-10 w-full" /></div>
    </div>
    <template v-else-if="runtime">
      <dl class="meter mt-5">
        <div v-for="item in statusItems" :key="item.label" class="meter-cell">
          <dt class="meter-label">{{ item.label }}</dt>
          <dd class="flex min-w-0 items-center gap-2 text-h3 font-bold tabular-nums text-fg">
            <span v-if="item.dot" class="h-2 w-2 shrink-0 rounded-full" :class="item.dot" />
            <span class="min-w-0 truncate">{{ item.value }}</span>
          </dd>
        </div>
      </dl>

      <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]">
        <div>
          <h3 class="text-label font-bold text-accent-strong">{{ t('admin.promptAudit.runtime.guardMetrics') }}</h3>
          <div class="meter mt-2">
            <div v-for="metric in guardMetricItems" :key="metric.label" class="meter-cell py-2">
              <p class="meter-label">{{ metric.label }}</p>
              <p class="text-h3 font-bold tabular-nums text-fg">{{ metric.value }}</p>
            </div>
          </div>
          <p class="mt-3 text-meta leading-5 tabular-nums text-fg-muted">
            {{ t('admin.promptAudit.runtime.queueBreakdown', {
              queued: runtime.queue.queued,
              processing: runtime.queue.processing,
              retry: runtime.queue.retry,
              done: runtime.queue.done,
              failed: runtime.queue.failed,
            }) }}
            <span class="mx-1.5 text-fg-subtle">·</span>
            {{ t('admin.promptAudit.runtime.deliveryTotals', { enqueued: runtime.enqueued_total, dropped: runtime.dropped_total, processed: runtime.processed_total, failed: runtime.failed_total }) }}
          </p>
        </div>
        <div class="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <h3 class="text-label font-bold text-accent-strong">{{ t('admin.promptAudit.runtime.latest') }}</h3>
          <p class="mt-2 text-body tabular-nums text-fg-muted">
            {{ runtime.last_processed_at ? formatDate(runtime.last_processed_at) : t('admin.promptAudit.common.never') }}
          </p>
          <p v-if="runtime.last_error_code" class="mt-1 break-words text-body text-danger">
            {{ runtime.last_error_code }}<span v-if="runtime.last_error_message"> · {{ runtime.last_error_message }}</span>
          </p>
          <div v-if="Object.keys(runtime.endpoints).length" class="mt-3 flex flex-wrap gap-2">
            <span v-for="(probe, id) in runtime.endpoints" :key="id" class="badge tabular-nums" :class="probe.ok ? 'badge-success' : 'badge-danger'">
              {{ id }} · {{ probe.status }} · {{ probe.latency_ms }} ms
            </span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PromptAuditRuntime } from '../types'

const props = defineProps<{ runtime: PromptAuditRuntime | null; loading: boolean; error: string }>()
defineEmits<{ (event: 'refresh'): void }>()
const { t, locale } = useI18n()

const statusItems = computed(() => {
  const runtime = props.runtime
  if (!runtime) return []
  return [
    { label: t('admin.promptAudit.runtime.process'), value: t(`admin.promptAudit.status.${runtime.process_status}`), dot: statusDot(runtime.process_status) },
    { label: t('admin.promptAudit.runtime.mode'), value: t(`admin.promptAudit.mode.${runtime.effective_mode}`) },
    { label: t('admin.promptAudit.runtime.version'), value: `${runtime.active_config_version} / ${runtime.expected_config_version}` },
    { label: t('admin.promptAudit.runtime.workers'), value: `${runtime.worker_active} / ${runtime.worker_total}` },
    { label: t('admin.promptAudit.runtime.queue'), value: `${runtime.queue.active} / ${runtime.queue_capacity}` },
    { label: t('admin.promptAudit.runtime.dependencies'), value: `DB ${runtime.database_status} · Redis ${runtime.redis_status}` },
  ]
})

const guardMetricItems = computed(() => {
  const metrics = props.runtime?.guard_metrics
  if (!metrics) return []
  return [
    { label: t('admin.promptAudit.metrics.total'), value: metrics.total },
    { label: t('admin.promptAudit.metrics.allowed'), value: metrics.allowed },
    { label: t('admin.promptAudit.metrics.flagged'), value: metrics.flagged },
    { label: t('admin.promptAudit.metrics.blocked'), value: metrics.blocked },
    { label: t('admin.promptAudit.metrics.unavailable'), value: metrics.unavailable },
    { label: t('admin.promptAudit.metrics.timeouts'), value: metrics.timeouts },
    { label: t('admin.promptAudit.metrics.failovers'), value: metrics.failovers },
    { label: 'P95', value: metrics.latency_p95_ms != null ? `${metrics.latency_p95_ms} ms` : '—' },
  ]
})

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
}

function statusDot(status: string): string {
  if (status === 'running') return 'bg-success'
  if (status === 'disabled') return 'bg-gray-400'
  if (status === 'degraded') return 'bg-warning'
  return 'bg-danger'
}
</script>
