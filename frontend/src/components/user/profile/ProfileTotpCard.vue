<template>
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        {{ t('profile.totp.title') }}
      </h2>
      <p class="mt-0.5 text-meta text-fg-muted">
        {{ t('profile.totp.description') }}
      </p>
    </div>
    <div class="px-5 py-4">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="spinner h-8 w-8 text-accent"></div>
      </div>

      <!-- Feature disabled globally -->
      <div v-else-if="status && !status.feature_enabled" class="py-2">
        <p class="font-medium text-fg">
          {{ t('profile.totp.featureDisabled') }}
        </p>
        <p class="mt-1 text-meta text-fg-muted">
          {{ t('profile.totp.featureDisabledHint') }}
        </p>
      </div>

      <!-- 2FA Enabled -->
      <div v-else-if="status?.enabled" class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="flex items-center gap-2 font-medium text-fg">
            <span class="badge badge-success">{{ t('profile.totp.enabled') }}</span>
          </p>
          <p v-if="status.enabled_at" class="mt-1 text-meta text-fg-muted">
            {{ t('profile.totp.enabledAt') }}: {{ formatDate(status.enabled_at) }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-secondary text-danger hover:border-danger hover:text-danger"
          @click="showDisableDialog = true"
        >
          {{ t('profile.totp.disable') }}
        </button>
      </div>

      <!-- 2FA Not Enabled -->
      <div v-else class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="flex items-center gap-2 font-medium text-fg">
            <span class="badge badge-gray">{{ t('profile.totp.notEnabled') }}</span>
          </p>
          <p class="mt-1 text-meta text-fg-muted">
            {{ t('profile.totp.notEnabledHint') }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary"
          @click="showSetupModal = true"
        >
          {{ t('profile.totp.enable') }}
        </button>
      </div>
    </div>

    <!-- Setup Modal -->
    <TotpSetupModal
      v-if="showSetupModal"
      @close="showSetupModal = false"
      @success="handleSetupSuccess"
    />

    <!-- Disable Dialog -->
    <TotpDisableDialog
      v-if="showDisableDialog"
      @close="showDisableDialog = false"
      @success="handleDisableSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { totpAPI } from '@/api'
import type { TotpStatus } from '@/types'
import TotpSetupModal from './TotpSetupModal.vue'
import TotpDisableDialog from './TotpDisableDialog.vue'

const { t } = useI18n()

const loading = ref(true)
const status = ref<TotpStatus | null>(null)
const showSetupModal = ref(false)
const showDisableDialog = ref(false)

const loadStatus = async () => {
  loading.value = true
  try {
    status.value = await totpAPI.getStatus()
  } catch (error) {
    console.error('Failed to load TOTP status:', error)
  } finally {
    loading.value = false
  }
}

const handleSetupSuccess = () => {
  showSetupModal.value = false
  loadStatus()
}

const handleDisableSuccess = () => {
  showDisableDialog.value = false
  loadStatus()
}

const formatDate = (timestamp: number) => {
  // Backend returns Unix timestamp in seconds, convert to milliseconds
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStatus()
})
</script>
