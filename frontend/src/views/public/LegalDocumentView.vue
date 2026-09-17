<template>
  <div class="min-h-screen bg-surface-sunken text-fg">
    <header class="border-b border-border bg-surface" style="border-top: 4px solid rgb(var(--accent))">
      <div class="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <RouterLink to="/home" class="flex min-w-0 items-center gap-3">
          <template v-if="settings">
            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden">
              <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
            </span>
            <span class="truncate text-h3 font-bold text-accent-strong">
              {{ siteName }}
            </span>
          </template>
          <template v-else>
            <span class="h-9 w-9 flex-shrink-0 animate-pulse rounded-sm bg-border" aria-hidden="true"></span>
            <span class="h-5 w-28 animate-pulse rounded-sm bg-border" aria-hidden="true"></span>
          </template>
        </RouterLink>
        <RouterLink to="/login" class="btn btn-secondary h-10 flex-shrink-0">
          {{ t('home.login') }}
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-[75ch] px-4 py-8 sm:px-6 lg:py-12">
      <div v-if="loading" class="flex min-h-[320px] items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"></div>
      </div>

      <section v-else-if="loadError" class="card border-t-danger">
        <div class="card-body">
          <h1 class="text-h3 font-bold text-danger">{{ t('legal.loadFailed') }}</h1>
          <p class="mt-2 text-body text-fg-muted">{{ t('legal.retryLater') }}</p>
        </div>
      </section>

      <section v-else-if="!currentDocument" class="card">
        <div class="card-body">
          <h1 class="card-title">{{ t('legal.notFound') }}</h1>
          <p class="mt-2 text-body text-fg-muted">
            {{ t('legal.notFoundDescription') }}
          </p>
        </div>
      </section>

      <article v-else class="border border-border bg-surface px-5 py-6 sm:px-10 sm:py-10" style="border-top: 2px solid rgb(var(--accent))">
        <header class="mb-8 border-b-2 border-accent pb-5">
          <p class="flex items-center gap-2 text-meta font-medium text-fg-muted">
            <Icon :name="documentIcon" size="sm" class="text-accent" />
            {{ documentTypeLabel }}
          </p>
          <h1 class="mt-2 break-words text-h1 font-bold text-accent-strong sm:text-display">
            {{ currentDocument.title }}
          </h1>
          <p v-if="updatedAt" class="mt-3 text-meta tabular-nums text-fg-muted">
            {{ t('legal.updatedAt', { date: updatedAt }) }}
          </p>
        </header>

        <div
          v-if="hasContent"
          class="legal-document-content"
          v-html="renderedHtml"
        ></div>
        <div v-else class="empty-state">
          <p class="text-body text-fg-muted">{{ t('legal.empty') }}</p>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { getLocale } from '@/i18n'
import { sanitizeUrl } from '@/utils/url'
import { useAppStore } from '@/stores/app'
import type { LoginAgreementDocument } from '@/types'
import zhAdminCompliance from '../../../../docs/legal/admin-compliance.zh.md?raw'
import enAdminCompliance from '../../../../docs/legal/admin-compliance.en.md?raw'

type LegalDocumentIcon = 'document' | 'shield' | 'globe' | 'cog'

const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()
const settings = computed(() => appStore.cachedPublicSettings)
const loading = ref(!settings.value)
const loadError = ref(false)

marked.setOptions({
  breaks: true,
  gfm: true,
})

const documentId = computed(() => String(route.params.documentId || ''))
const isAdminComplianceDocument = computed(() => documentId.value === 'admin-compliance')
const documents = computed(() => settings.value?.login_agreement_documents ?? [])
const siteName = computed(() => settings.value?.site_name || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(settings.value?.site_logo || '', {
  allowRelative: true,
  allowDataUrl: true,
}))
const updatedAt = computed(() =>
  isAdminComplianceDocument.value ? '' : settings.value?.login_agreement_updated_at || ''
)
const documentTypeLabel = computed(() =>
  isAdminComplianceDocument.value ? t('legal.adminCompliance') : t('legal.loginAgreement')
)

const currentDocument = computed<LoginAgreementDocument | null>(() => {
  if (isAdminComplianceDocument.value) {
    return {
      id: 'admin-compliance',
      title: t('adminCompliance.title'),
      content_md: getLocale() === 'zh' ? zhAdminCompliance : enAdminCompliance
    }
  }
  const id = documentId.value
  if (!id) {
    return null
  }
  return documents.value.find((doc) => doc.id === id) ?? null
})

const hasContent = computed(() => Boolean(currentDocument.value?.content_md?.trim()))

const renderedHtml = computed(() => {
  const content = currentDocument.value?.content_md?.trim() || ''
  if (!content) {
    return ''
  }
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

const documentIcon = computed<LegalDocumentIcon>(() => {
  const title = currentDocument.value?.title || ''
  if (title.includes('政策') || title.includes('隐私')) {
    return 'shield'
  }
  if (title.includes('国家') || title.includes('地区')) {
    return 'globe'
  }
  if (title.includes('特定')) {
    return 'cog'
  }
  return 'document'
})

onMounted(async () => {
  loadError.value = false
  const loadedSettings = await appStore.fetchPublicSettings()
  if (!loadedSettings) {
    loadError.value = true
  }
  loading.value = false
})
</script>

<style scoped>
.legal-document-content {
  max-width: 70ch;
  font-size: 15px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  color: rgb(var(--fg));
}

.legal-document-content :deep(h1) {
  @apply mb-4 mt-10 border-b-2 border-accent pb-2 text-h1 font-bold text-accent-strong;
}

.legal-document-content :deep(h2) {
  @apply mb-3 mt-9 border-b border-border pb-1.5 text-h2 font-bold text-accent-strong;
}

.legal-document-content :deep(h3) {
  @apply mb-2 mt-7 text-h3 font-bold text-fg;
}

.legal-document-content :deep(h4) {
  @apply mb-2 mt-6 text-body font-bold text-fg;
}

.legal-document-content :deep(p) {
  @apply mb-4;
}

.legal-document-content :deep(a) {
  @apply text-accent underline underline-offset-4 hover:text-accent-strong;
}

.legal-document-content :deep(ul) {
  @apply mb-4 list-disc pl-6;
}

.legal-document-content :deep(ol) {
  @apply mb-4 list-decimal pl-6;
}

.legal-document-content :deep(li) {
  @apply mb-1;
}

.legal-document-content :deep(blockquote) {
  @apply my-5 border border-accent/40 pl-4 text-fg-muted;
}

.legal-document-content :deep(code) {
  @apply rounded-sm bg-surface-sunken px-1 py-0.5 font-mono text-label;
}

.legal-document-content :deep(pre) {
  @apply my-5 overflow-x-auto border border-border bg-surface-sunken p-4;
}

.legal-document-content :deep(pre code) {
  @apply bg-transparent p-0 text-inherit;
}

.legal-document-content :deep(table) {
  @apply my-5 block w-full overflow-x-auto border-collapse text-body;
}

.legal-document-content :deep(th) {
  @apply border border-border bg-accent-weak px-3 py-2 text-left font-semibold text-accent-strong;
  border-bottom: 2px solid rgb(var(--accent));
}

.legal-document-content :deep(td) {
  @apply border border-border px-3 py-2;
}

.legal-document-content :deep(img) {
  @apply my-5 h-auto max-w-full;
}

.legal-document-content :deep(hr) {
  @apply my-8 border-border;
}
</style>
