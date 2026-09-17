<template>
  <div v-if="hasProviders" class="space-y-4">
    <div v-if="showDivider" class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border"></div>
      <span class="text-meta text-fg-muted">
        {{ t('auth.oauthOrContinue') }}
      </span>
      <div class="h-px flex-1 bg-border"></div>
    </div>

    <!-- 规线行：网格间隙 1px 露出底色，即行间细线 -->
    <div :class="providerGridClass" class="gap-px border-y border-border bg-border">
      <button
        v-for="provider in visibleProviders"
        :key="provider"
        type="button"
        :disabled="disabled"
        class="flex min-h-11 w-full items-center gap-3 bg-surface px-3 py-2.5 text-left text-body font-semibold text-fg transition-colors hover:bg-accent-weak hover:text-accent-strong focus:outline-none focus-visible:bg-accent-weak disabled:cursor-not-allowed disabled:opacity-50"
        @click="startLogin(provider)"
      >
        <GitHubMark v-if="provider === 'github'" class="h-4 w-4 shrink-0 text-fg" />
        <GoogleMark v-else class="h-4 w-4 shrink-0" />
        <span class="min-w-0 truncate">{{ providerLabel(provider) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import GitHubMark from './GitHubMark.vue'
import GoogleMark from './GoogleMark.vue'
import type { OAuthLoginStart } from '@/api/auth'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

type EmailOAuthProvider = 'github' | 'google'
const EMAIL_OAUTH_PENDING_PROVIDER_KEY = 'email_oauth_pending_provider'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  promoCode?: string
  githubEnabled?: boolean
  googleEnabled?: boolean
  showDivider?: boolean
}>(), {
  showDivider: true
})
const emit = defineEmits<{
  start: [request: OAuthLoginStart]
}>()

const route = useRoute()
const { t } = useI18n()

const visibleProviders = computed<EmailOAuthProvider[]>(() => {
  const providers: EmailOAuthProvider[] = []
  if (props.githubEnabled) providers.push('github')
  if (props.googleEnabled) providers.push('google')
  return providers
})

const hasProviders = computed(() => visibleProviders.value.length > 0)
const hasMultipleProviders = computed(() => visibleProviders.value.length > 1)
const providerGridClass = computed(() => [
  'grid',
  'grid-cols-1',
  hasMultipleProviders.value ? 'sm:grid-cols-2' : ''
])

function providerLabel(provider: EmailOAuthProvider): string {
  const name = provider === 'github' ? 'GitHub' : 'Google'
  return hasMultipleProviders.value ? name : t('auth.emailOAuth.signIn', { providerName: name })
}

function startLogin(provider: EmailOAuthProvider): void {
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  const affiliateCode = resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code)
  storeOAuthAffiliateCode(affiliateCode)
  window.sessionStorage.setItem(EMAIL_OAUTH_PENDING_PROVIDER_KEY, provider)
  const params: Record<string, string> = { redirect: redirectTo }
  if (affiliateCode) {
    params.aff_code = affiliateCode
  }
  const promoCode = props.promoCode?.trim()
  if (promoCode) {
    params.promo_code = promoCode
  }
  emit('start', { provider, params })
}
</script>
