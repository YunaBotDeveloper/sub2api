<template>
  <div class="min-h-screen bg-surface-sunken text-fg">
    <header class="border-b border-border bg-surface" style="border-top: 4px solid rgb(var(--accent))">
      <div class="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <RouterLink to="/home" class="flex min-w-0 items-center gap-3">
          <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-9 w-9 flex-shrink-0 object-contain" />
          <span class="truncate text-h3 font-bold text-accent-strong">{{ siteName }}</span>
          <span class="hidden flex-shrink-0 border-l border-border pl-3 text-label font-semibold text-fg-muted sm:inline">
            {{ t('apiDocs.title') }}
          </span>
        </RouterLink>
        <div class="flex flex-shrink-0 items-center gap-1">
          <LocaleSwitcher />
          <RouterLink :to="isAuthenticated ? '/keys' : '/login'" class="btn btn-secondary h-10">
            <Icon name="key" size="sm" />
            <span class="hidden sm:inline">{{ t('apiDocs.getApiKey') }}</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:py-10 xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
      <!-- Sidebar: page list + base URL -->
      <aside class="mb-6 lg:mb-0">
        <div class="lg:sticky lg:top-6 lg:space-y-6">
          <nav ref="navRef" :aria-label="t('apiDocs.navLabel')" class="-mx-4 overflow-x-auto border-b border-border px-4 lg:mx-0 lg:overflow-visible lg:border-b-0 lg:px-0">
            <ul class="flex min-w-max gap-4 lg:min-w-0 lg:flex-col lg:gap-0.5">
              <li v-for="page in DOCS_PAGES" :key="page">
                <RouterLink
                  :to="`/docs/${page}`"
                  :aria-current="page === currentPage ? 'page' : undefined"
                  :class="[
                    'block whitespace-nowrap border-b-2 px-1 py-2.5 text-label font-semibold transition-colors lg:border-b-0 lg:border-l-2 lg:px-3 lg:py-2',
                    page === currentPage
                      ? 'border-accent text-accent-strong lg:bg-accent-weak'
                      : 'border-transparent text-fg-muted hover:text-accent-strong'
                  ]"
                >
                  {{ t(`apiDocs.pages.${page}`) }}
                </RouterLink>
              </li>
            </ul>
          </nav>

          <div class="mt-4 border border-border bg-surface p-3 lg:mt-0">
            <p class="text-meta font-semibold text-fg-muted">{{ t('apiDocs.baseUrl') }}</p>
            <div class="mt-1.5 flex items-center gap-2">
              <code class="min-w-0 flex-1 break-all font-mono text-label text-accent-strong">{{ baseUrl }}</code>
              <button
                type="button"
                class="btn btn-ghost btn-icon flex-shrink-0"
                :title="t('apiDocs.copy')"
                :aria-label="t('apiDocs.copy')"
                @click="copyText(baseUrl)"
              >
                <Icon name="copy" size="sm" />
              </button>
            </div>
            <i18n-t keypath="apiDocs.baseUrlHint" tag="p" class="mt-1.5 text-meta text-fg-muted">
              <template #v1><code class="font-mono">{{ baseUrl }}/v1</code></template>
            </i18n-t>
          </div>
        </div>
      </aside>

      <!-- Content -->
      <main class="min-w-0">
        <div v-if="loading" class="flex min-h-[320px] items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"></div>
        </div>

        <section v-else-if="loadError" class="card border-t-danger">
          <div class="card-body">
            <p class="text-body text-danger">{{ t('apiDocs.loadFailed') }}</p>
          </div>
        </section>

        <article
          v-else
          class="border border-border bg-surface px-5 py-6 sm:px-10 sm:py-10"
          style="border-top: 2px solid rgb(var(--accent))"
        >
          <!-- eslint-disable-next-line vue/no-v-html -- bundled markdown, sanitized with DOMPurify -->
          <div class="docs-content" @click="onContentClick" v-html="rendered.html"></div>

          <nav class="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
            <RouterLink
              v-if="previousPage"
              :to="`/docs/${previousPage}`"
              class="group border border-border px-4 py-3 transition-colors hover:border-accent"
            >
              <span class="flex items-center gap-1 text-meta text-fg-muted">
                <Icon name="chevronLeft" size="xs" />{{ t('apiDocs.previous') }}
              </span>
              <span class="mt-1 block text-label font-semibold text-accent-strong">{{ t(`apiDocs.pages.${previousPage}`) }}</span>
            </RouterLink>
            <span v-else class="hidden sm:block"></span>
            <RouterLink
              v-if="nextPage"
              :to="`/docs/${nextPage}`"
              class="group border border-border px-4 py-3 text-right transition-colors hover:border-accent"
            >
              <span class="flex items-center justify-end gap-1 text-meta text-fg-muted">
                {{ t('apiDocs.next') }}<Icon name="chevronRight" size="xs" />
              </span>
              <span class="mt-1 block text-label font-semibold text-accent-strong">{{ t(`apiDocs.pages.${nextPage}`) }}</span>
            </RouterLink>
          </nav>
        </article>
      </main>

      <!-- On-page table of contents -->
      <aside v-if="rendered.toc.length" class="hidden xl:block">
        <div class="sticky top-6">
          <p class="text-meta font-semibold uppercase tracking-wide text-fg-muted">{{ t('apiDocs.onThisPage') }}</p>
          <ul class="mt-3 space-y-1.5 border-l border-border">
            <li v-for="item in rendered.toc" :key="item.id">
              <a
                :href="`#${item.id}`"
                class="-ml-px block border-l-2 border-transparent pl-3 text-label text-fg-muted transition-colors hover:border-accent hover:text-accent-strong"
                @click.prevent="scrollToAnchor(item.id)"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useAppStore, useAuthStore } from '@/stores'
import { useClipboard } from '@/composables/useClipboard'
import { sanitizeUrl } from '@/utils/url'
import {
  applyDocsPlaceholders,
  normalizeDocsBaseUrl,
  renderDocsMarkdown,
  type RenderedDoc,
} from '@/utils/docsMarkdown'
import { DOCS_DEFAULT_PAGE, DOCS_PAGES, isDocsPage, loadDocsSource, type DocsPage } from '@/docs/api'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const { copyToClipboard } = useClipboard()

const settings = computed(() => appStore.cachedPublicSettings)
const siteName = computed(() => settings.value?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() =>
  sanitizeUrl(settings.value?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true })
)
const isAuthenticated = computed(() => authStore.isAuthenticated)
// Without a configured api_base_url the gateway is this site itself.
const baseUrl = computed(() =>
  normalizeDocsBaseUrl(sanitizeUrl(settings.value?.api_base_url || '') || window.location.origin)
)

const currentPage = computed<DocsPage>(() => {
  const page = String(route.params.page || '')
  return isDocsPage(page) ? page : DOCS_DEFAULT_PAGE
})
const pageIndex = computed(() => DOCS_PAGES.indexOf(currentPage.value))
const previousPage = computed(() => DOCS_PAGES[pageIndex.value - 1])
const nextPage = computed(() => DOCS_PAGES[pageIndex.value + 1])

const source = ref('')
const loading = ref(true)
const loadError = ref(false)
const navRef = ref<HTMLElement | null>(null)

const rendered = computed<RenderedDoc>(() => {
  if (!source.value) return { html: '', toc: [] }
  const markdown = applyDocsPlaceholders(source.value, { baseUrl: baseUrl.value, siteName: siteName.value })
  return renderDocsMarkdown(markdown, { copyLabel: t('apiDocs.copy') })
})

let loadToken = 0
async function loadPage() {
  const token = ++loadToken
  loadError.value = false
  if (!source.value) loading.value = true
  try {
    const content = await loadDocsSource(currentPage.value, String(locale.value))
    if (token !== loadToken) return
    source.value = content
  } catch (error) {
    if (token !== loadToken) return
    console.error('Failed to load docs page', error)
    loadError.value = true
  } finally {
    if (token === loadToken) loading.value = false
  }
  await nextTick()
  navRef.value?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  if (route.hash) scrollToAnchor(decodeURIComponent(route.hash.slice(1)), 'auto')
}

function scrollToAnchor(id: string, behavior: 'auto' | 'smooth' = 'smooth') {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior, block: 'start' })
  // Update the hash without a router navigation, which would scroll back to the top.
  history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
}

async function copyText(text: string) {
  await copyToClipboard(text, t('apiDocs.copied'))
}

function onContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target) return

  const copyButton = target.closest<HTMLButtonElement>('[data-docs-copy]')
  if (copyButton) {
    const code = copyButton.closest('.docs-code')?.querySelector('code')
    if (code?.textContent) void copyText(code.textContent)
    return
  }

  const link = target.closest<HTMLAnchorElement>('a[href]')
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
  const href = link.getAttribute('href') || ''
  if (href.startsWith('#')) {
    event.preventDefault()
    scrollToAnchor(decodeURIComponent(href.slice(1)))
  } else if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault()
    void router.push(href)
  }
}

watch([currentPage, locale], () => {
  void loadPage()
})

onMounted(() => {
  void appStore.fetchPublicSettings()
  void loadPage()
})
</script>

<style scoped>
.docs-content {
  max-width: 80ch;
  font-size: 15px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  color: rgb(var(--fg));
}

.docs-content :deep(h1) {
  @apply mb-6 border-b-2 border-accent pb-3 text-h1 font-bold text-accent-strong sm:text-display;
}

.docs-content :deep(h2) {
  @apply mb-3 mt-10 scroll-mt-6 border-b border-border pb-1.5 text-h2 font-bold text-accent-strong;
}

.docs-content :deep(h3) {
  @apply mb-2 mt-7 scroll-mt-6 text-h3 font-bold text-fg;
}

.docs-content :deep(h4) {
  @apply mb-2 mt-6 text-body font-bold text-fg;
}

.docs-content :deep(.docs-anchor) {
  @apply float-left -ml-5 hidden w-5 font-normal text-fg-subtle no-underline sm:inline-block;
  opacity: 0;
}

.docs-content :deep(h2:hover .docs-anchor),
.docs-content :deep(h3:hover .docs-anchor) {
  opacity: 1;
}

.docs-content :deep(p) {
  @apply mb-4;
}

.docs-content :deep(a) {
  @apply text-accent underline underline-offset-4 hover:text-accent-strong;
}

.docs-content :deep(ul) {
  @apply mb-4 list-disc pl-6;
}

.docs-content :deep(ol) {
  @apply mb-4 list-decimal pl-6;
}

.docs-content :deep(li) {
  @apply mb-1;
}

.docs-content :deep(blockquote) {
  @apply my-5 border-l-4 border-accent bg-accent-weak px-4 py-3 text-fg;
}

.docs-content :deep(blockquote p:last-child) {
  @apply mb-0;
}

.docs-content :deep(code) {
  @apply rounded-sm bg-surface-sunken px-1 py-0.5 font-mono text-label;
}

.docs-content :deep(.docs-code) {
  @apply my-5 border border-border bg-surface-sunken;
}

.docs-content :deep(.docs-code-bar) {
  @apply flex items-center justify-between border-b border-border px-3 py-1.5;
}

.docs-content :deep(.docs-code-lang) {
  @apply font-mono text-meta text-fg-muted;
}

.docs-content :deep(.docs-copy) {
  @apply text-meta font-semibold text-fg-muted transition-colors hover:text-accent-strong;
}

.docs-content :deep(pre) {
  @apply m-0 overflow-x-auto p-4 text-label leading-relaxed;
}

.docs-content :deep(pre code) {
  @apply bg-transparent p-0 text-inherit;
  overflow-wrap: normal;
  white-space: pre;
}

.docs-content :deep(table) {
  @apply my-5 block w-full overflow-x-auto border-collapse text-label;
}

.docs-content :deep(th) {
  @apply border border-border bg-accent-weak px-3 py-2 text-left font-semibold text-accent-strong;
  border-bottom: 2px solid rgb(var(--accent));
}

.docs-content :deep(td) {
  @apply border border-border px-3 py-2 align-top;
}

.docs-content :deep(hr) {
  @apply my-8 border-border;
}
</style>
