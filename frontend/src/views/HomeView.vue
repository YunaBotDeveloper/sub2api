<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="hasHomeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Compact Home Page -->
  <div
    v-else-if="compactHomeEnabled"
    data-testid="compact-home"
    class="flex min-h-screen flex-col bg-surface-sunken text-fg"
  >
    <header class="border-b border-border bg-surface px-4 sm:px-6" style="border-top: 4px solid rgb(var(--accent))">
      <nav class="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 py-3">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-9 w-9 shrink-0 object-contain" />
          <span class="min-w-0 truncate text-h3 font-bold text-accent-strong">{{ siteName }}</span>
        </div>
        <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost h-10 w-10 px-0"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="sm" />
          </a>
          <router-link
            v-if="showModelPlazaEntry"
            to="/model-plaza"
            class="btn btn-ghost h-10"
            :title="t('nav.modelPlaza')"
          >
            <Icon name="grid" size="sm" />
            <span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span>
          </router-link>
          <button
            type="button"
            class="btn btn-ghost h-10 w-10 px-0"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="sm" />
            <Icon v-else name="moon" size="sm" />
          </button>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="btn btn-secondary h-10">
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex min-w-0 flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div class="w-full min-w-0 max-w-xl border border-border bg-surface" style="border-top: 2px solid rgb(var(--accent))">
        <div class="flex items-center gap-4 border-b border-border px-6 py-5">
          <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-14 w-14 shrink-0 object-contain" />
          <h1 class="min-w-0 text-h1 font-bold text-accent-strong [overflow-wrap:anywhere]">{{ siteName }}</h1>
        </div>
        <p class="whitespace-pre-wrap px-6 py-5 text-body text-fg-muted [overflow-wrap:anywhere]">{{ siteSubtitle }}</p>
        <div class="border-t border-border bg-surface-sunken px-6 py-4">
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="btn btn-primary btn-lg w-full sm:w-auto"
          >
            {{ isAuthenticated ? t('home.goToDashboard') : t('home.login') }}
          </router-link>
        </div>
      </div>
    </main>

    <footer class="min-w-0 border-t border-border px-4 py-5 text-center text-meta text-fg-subtle [overflow-wrap:anywhere] sm:px-6">
      &copy; {{ currentYear }} {{ siteName }}
    </footer>
  </div>

  <!-- Default Home Page: a published bill of service -->
  <div v-else class="flex min-h-screen flex-col bg-surface-sunken text-fg">
    <!-- Header band -->
    <header class="border-b border-border bg-surface px-4 sm:px-6" style="border-top: 4px solid rgb(var(--accent))">
      <nav class="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-9 w-9 shrink-0 object-contain" />
          <span class="min-w-0 truncate text-h3 font-bold text-accent-strong">{{ siteName }}</span>
        </div>

        <div class="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost h-10 w-10 px-0"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="sm" />
          </a>
          <router-link
            v-if="showModelPlazaEntry"
            to="/model-plaza"
            class="btn btn-ghost h-10"
            :title="t('nav.modelPlaza')"
          >
            <Icon name="grid" size="sm" />
            <span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span>
          </router-link>
          <button
            type="button"
            class="btn btn-ghost h-10 w-10 px-0"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="sm" />
            <Icon v-else name="moon" size="sm" />
          </button>
          <router-link v-if="isAuthenticated" :to="dashboardPath" class="btn btn-secondary h-10">
            {{ t('home.dashboard') }}
          </router-link>
          <router-link v-else to="/login" class="btn btn-secondary h-10">
            {{ t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div class="mx-auto max-w-6xl space-y-12">
        <!-- Hero: what this is + connection slip -->
        <section class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
          <div class="min-w-0">
            <h1 class="text-display font-bold text-accent-strong [overflow-wrap:anywhere] md:text-4xl">
              {{ siteName }}
            </h1>
            <p class="mt-3 text-h2 font-semibold text-fg [overflow-wrap:anywhere]">{{ siteSubtitle }}</p>
            <p class="mt-4 max-w-[62ch] text-body text-fg-muted">{{ t('home.heroDescription') }}</p>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <router-link v-if="isAuthenticated" :to="dashboardPath" class="btn btn-primary btn-lg">
                {{ t('home.goToDashboard') }}
                <Icon name="arrowRight" size="sm" :stroke-width="2" />
              </router-link>
              <template v-else>
                <router-link v-if="registrationOpen" to="/register" class="btn btn-primary btn-lg">
                  {{ t('auth.signUp') }}
                </router-link>
                <router-link
                  to="/login"
                  class="btn btn-lg"
                  :class="registrationOpen ? 'btn-secondary' : 'btn-primary'"
                >
                  {{ registrationOpen ? t('home.login') : t('home.getStarted') }}
                </router-link>
              </template>
            </div>

            <!-- Supported providers: ruled register -->
            <div class="mt-10">
              <h2 class="bill-section-title">
                <span>{{ t('home.providers.title') }}</span>
                <span class="text-meta font-medium text-fg-muted">{{ t('home.providers.description') }}</span>
              </h2>
              <ul class="divide-y divide-border border-b border-border">
                <li v-for="provider in providers" :key="provider.platform" class="flex min-h-11 items-center gap-3 py-2">
                  <PlatformIcon :platform="provider.platform" size="md" class="text-fg-muted" />
                  <span class="flex-1 text-body font-medium">{{ provider.label }}</span>
                  <span class="badge badge-success">{{ t('home.providers.supported') }}</span>
                </li>
                <li class="flex min-h-11 items-center gap-3 py-2 text-fg-muted">
                  <span class="h-4 w-4" aria-hidden="true"></span>
                  <span class="flex-1 text-body">{{ t('home.providers.more') }}</span>
                  <span class="badge badge-gray">{{ t('home.providers.soon') }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Connection slip: base URL for the CLIs -->
          <div class="terminal-container stub min-w-0">
            <div class="px-5 py-4">
              <p class="text-h3 font-bold text-accent-strong">{{ t('home.connect.title') }}</p>
              <p class="mt-1 text-meta text-fg-muted">{{ t('home.connect.hint') }}</p>
              <p class="mt-4 text-meta font-medium text-fg-muted">Base URL</p>
              <p class="mt-1 break-all border border-border bg-surface-sunken px-3 py-2 font-mono text-label text-fg">{{ apiBaseUrl }}</p>
            </div>
            <div class="stub-perforation"></div>
            <dl class="divide-y divide-border px-5 py-2">
              <div v-for="tool in cliTools" :key="tool.name" class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <dt class="text-label font-semibold text-fg">{{ tool.name }}</dt>
                <dd class="min-w-0 break-all font-mono text-meta text-fg-muted">{{ tool.variable }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- How billing works: meter reading + tier structure -->
        <section>
          <h2 class="bill-section-title">
            <span>{{ t('home.billing.title') }}</span>
          </h2>
          <p class="mt-3 max-w-[70ch] text-body text-fg-muted">{{ t('home.billing.description') }}</p>

          <div class="meter mt-5">
            <div class="meter-cell">
              <span class="meter-label">{{ t('home.billing.meter.usage') }}</span>
              <span class="text-h3 font-bold text-fg">{{ t('home.billing.meter.usageValue') }}</span>
            </div>
            <div class="meter-cell">
              <span class="meter-label">× {{ t('home.billing.meter.rate') }}</span>
              <span class="text-h3 font-bold text-fg">{{ t('home.billing.meter.rateValue') }}</span>
            </div>
            <div class="meter-cell">
              <span class="meter-label">× {{ t('home.billing.meter.multiplier') }}</span>
              <span class="text-h3 font-bold text-fg">{{ t('home.billing.meter.multiplierValue') }}</span>
            </div>
            <div class="meter-cell meter-cell-current">
              <span class="meter-label">= {{ t('home.billing.meter.charge') }}</span>
              <span class="text-h3 font-bold text-fg">{{ t('home.billing.meter.chargeValue') }}</span>
            </div>
          </div>

          <div class="table-container mt-6">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ t('home.billing.table.item') }}</th>
                  <th>{{ t('home.billing.table.unit') }}</th>
                  <th>{{ t('home.billing.table.basis') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in billingLines" :key="line">
                  <td class="font-semibold">{{ t(`home.billing.lines.${line}.item`) }}</td>
                  <td class="whitespace-nowrap text-fg-muted">{{ t('home.billing.table.perMillion') }}</td>
                  <td class="text-fg-muted">{{ t(`home.billing.lines.${line}.basis`) }}</td>
                </tr>
                <tr class="row-total">
                  <td>{{ t('home.billing.lines.total.item') }}</td>
                  <td></td>
                  <td>{{ t('home.billing.lines.total.basis') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-meta text-fg-muted">
            <span>{{ t('home.billing.note') }}</span>
            <router-link
              v-if="showModelPlazaEntry"
              to="/model-plaza"
              class="font-semibold text-accent hover:text-accent-strong"
            >
              {{ t('home.billing.rateCardLink') }}
            </router-link>
          </p>
        </section>

        <!-- What you get: ruled rows -->
        <section>
          <h2 class="bill-section-title">
            <span>{{ t('home.heroSubtitle') }}</span>
          </h2>
          <dl class="divide-y divide-border border-b border-border">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="grid gap-1 py-4 sm:grid-cols-[16rem_minmax(0,1fr)] sm:gap-6"
            >
              <dt class="text-body font-bold text-fg">{{ t(feature.title) }}</dt>
              <dd class="max-w-[70ch] text-body text-fg-muted">{{ t(feature.desc) }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-surface px-4 py-6 sm:px-6">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p class="text-meta text-fg-subtle">
          &copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}
        </p>
        <div class="flex items-center gap-4 text-label">
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-fg-muted hover:text-accent-strong"
          >
            {{ t('home.docs') }}
          </a>
          <a
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-fg-muted hover:text-accent-strong"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import type { GroupPlatform } from '@/types'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelPlazaRequiresAuth = computed(
  () => appStore.cachedPublicSettings?.model_plaza_require_auth === true,
)
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || !modelPlazaRequiresAuth.value),
)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const registrationOpen = computed(
  () =>
    appStore.cachedPublicSettings?.registration_enabled === true &&
    appStore.cachedPublicSettings?.backend_mode_enabled !== true,
)
const apiBaseUrl = computed(() => appStore.cachedPublicSettings?.api_base_url || window.location.origin)

// Static content for the default home
const providers = computed<{ platform: GroupPlatform; label: string }[]>(() => [
  { platform: 'anthropic', label: t('home.providers.claude') },
  { platform: 'openai', label: 'GPT' },
  { platform: 'gemini', label: t('home.providers.gemini') },
  { platform: 'antigravity', label: t('home.providers.antigravity') },
])
const cliTools = [
  { name: 'Claude Code', variable: 'ANTHROPIC_BASE_URL' },
  { name: 'Codex CLI', variable: '~/.codex/config.toml: base_url' },
  { name: 'Gemini CLI', variable: 'GOOGLE_GEMINI_BASE_URL' },
]
const billingLines = ['input', 'output', 'cacheWrite', 'cacheRead'] as const
const features = [
  { title: 'home.features.unifiedGateway', desc: 'home.features.unifiedGatewayDesc' },
  { title: 'home.features.multiAccount', desc: 'home.features.multiAccountDesc' },
  { title: 'home.features.balanceQuota', desc: 'home.features.balanceQuotaDesc' },
]

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>
