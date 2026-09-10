<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-sunken p-4 sm:p-8">
    <div class="w-full max-w-[420px]">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <template v-if="settingsLoaded">
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg">
            <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <h1 class="text-h1 font-semibold text-fg">
            {{ siteName }}
          </h1>
          <p class="mt-1 text-body text-fg-muted">
            {{ siteSubtitle }}
          </p>
        </template>
      </div>

      <!-- Card Container -->
      <div class="card p-6 sm:p-8">
        <slot />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center text-body">
        <slot name="footer" />
      </div>

      <!-- Copyright -->
      <div class="mt-8 text-center text-meta text-fg-subtle">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>
