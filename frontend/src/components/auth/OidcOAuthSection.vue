<template>
  <div class="space-y-4">
    <button type="button" :disabled="disabled" class="flex min-h-11 w-full items-center gap-3 border-y border-border bg-surface px-3 py-2.5 text-left text-body font-semibold text-fg transition-colors hover:bg-accent-weak hover:text-accent-strong focus:outline-none focus-visible:bg-accent-weak disabled:cursor-not-allowed disabled:opacity-50" @click="startLogin">
      <span
        class="inline-flex h-4 w-4 shrink-0 items-center justify-center text-meta font-bold text-accent" aria-hidden="true"
      >
        {{ providerInitial }}
      </span>
      {{ t('auth.oidc.signIn', { providerName: normalizedProviderName }) }}
    </button>

    <div v-if="showDivider" class="flex items-center gap-3">
      <div class="h-px flex-1 bg-border"></div>
      <span class="text-meta text-fg-muted">
        {{ t('auth.oauthOrContinue') }}
      </span>
      <div class="h-px flex-1 bg-border"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { OAuthLoginStart } from '@/api/auth'
import { resolveAffiliateReferralCode, storeOAuthAffiliateCode } from '@/utils/oauthAffiliate'

const props = withDefaults(defineProps<{
  disabled?: boolean
  affCode?: string
  providerName?: string
  showDivider?: boolean
}>(), {
  providerName: 'OIDC',
  showDivider: true
})
const emit = defineEmits<{
  start: [request: OAuthLoginStart]
}>()

const route = useRoute()
const { t } = useI18n()

const normalizedProviderName = computed(() => {
  const name = props.providerName?.trim()
  return name || 'OIDC'
})

const providerInitial = computed(() => normalizedProviderName.value.charAt(0).toUpperCase() || 'O')

function startLogin(): void {
  const redirectTo = (route.query.redirect as string) || '/dashboard'
  storeOAuthAffiliateCode(resolveAffiliateReferralCode(props.affCode, route.query.aff, route.query.aff_code))
  emit('start', { provider: 'oidc', params: { redirect: redirectTo } })
}
</script>
