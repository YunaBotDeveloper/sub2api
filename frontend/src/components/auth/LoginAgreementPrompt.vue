<template>
  <div
    v-if="mode === 'checkbox' && documents.length > 0"
    class="px-0.5"
  >
    <div class="flex items-start gap-2">
      <input
        id="login-agreement-consent"
        type="checkbox"
        :checked="accepted"
        class="mt-[2px] h-4 w-4 flex-shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900"
        @change="handleCheckboxChange"
      />
      <div class="min-w-0 flex-1">
        <p class="text-[13px] leading-5 text-gray-600 dark:text-dark-300">
          <label
            for="login-agreement-consent"
            class="cursor-pointer text-gray-700 dark:text-dark-200"
          >
            {{ t('legal.loginAgreementPrompt.checkboxPrefix') }}
          </label>
          <template v-for="(doc, index) in documents" :key="doc.id || doc.title">
            <RouterLink
              :to="documentRoute(doc)"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary-600 underline-offset-4 transition hover:text-primary-700 hover:underline dark:text-primary-300 dark:hover:text-primary-200"
            >
              {{ doc.title }}
            </RouterLink>
            <span v-if="index < documents.length - 1">{{ t('legal.loginAgreementPrompt.documentSeparator') }}</span>
          </template>
        </p>
      </div>
    </div>
  </div>

  <div
    v-else-if="!accepted && documents.length > 0"
    class="rounded-lg border border-primary-100 bg-primary-50/70 p-3 text-sm text-primary-900 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-100"
  >
    <div class="flex items-start gap-3">
      <Icon name="shield" size="sm" class="mt-0.5 flex-shrink-0 text-primary-600 dark:text-primary-300" />
      <div class="min-w-0 flex-1">
        <p class="font-medium">{{ t('legal.loginAgreementPrompt.noticeTitle') }}</p>
        <p class="mt-1 text-primary-700 dark:text-primary-200/80">
          {{ t('legal.loginAgreementPrompt.noticeDescription') }}
        </p>
      </div>
      <button
        type="button"
        class="flex-shrink-0 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
        @click="emit('open')"
      >
        {{ t('legal.loginAgreementPrompt.viewTerms') }}
      </button>
    </div>
  </div>

  <!-- 用户必须明确接受或拒绝：不提供关闭按钮，也不响应 Escape -->
  <BaseDialog
    :show="dialogVisible"
    :title="t('legal.loginAgreementPrompt.dialogTitle')"
    :z-index="140"
    :show-close-button="false"
    :close-on-escape="false"
    @close="emit('reject')"
  >
    <div class="flex items-start gap-3">
      <Icon name="shield" size="md" class="mt-0.5 flex-shrink-0 text-accent" />
      <div class="min-w-0 flex-1">
        <span
          v-if="updatedAt"
          class="badge badge-gray"
        >
          {{ updatedAt }}
        </span>
        <p class="mt-2 text-body leading-6 text-fg-muted">
          {{
            t('legal.loginAgreementPrompt.dialogDescription', {
              date: updatedAt || t('legal.loginAgreementPrompt.recently'),
            })
          }}
        </p>
      </div>
    </div>

    <p class="mb-3 mt-5 text-label font-semibold text-fg">{{ t('legal.loginAgreementPrompt.relatedDocuments') }}</p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="(doc, index) in documents"
        :key="doc.id || doc.title"
        :to="documentRoute(doc)"
        target="_blank"
        rel="noopener noreferrer"
        class="group flex min-h-[72px] w-full items-center gap-3 rounded-lg border border-border bg-surface-sunken px-4 py-3 text-left transition hover:border-border-strong hover:bg-surface"
      >
        <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted transition group-hover:text-accent">
          <Icon :name="documentIcon(index, doc.title)" size="sm" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-body font-semibold text-fg">{{ doc.title }}</span>
        </span>
        <Icon name="externalLink" size="sm" class="flex-shrink-0 text-fg-subtle transition group-hover:text-accent" />
      </RouterLink>
    </div>

    <template #footer>
      <div class="grid w-full grid-cols-2 gap-3">
        <button type="button" class="btn btn-secondary" @click="emit('reject')">
          {{ t('legal.loginAgreementPrompt.reject') }}
        </button>
        <button type="button" class="btn btn-primary" @click="emit('accept')">
          {{ t('legal.loginAgreementPrompt.accept') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import type { LoginAgreementDocument } from '@/types'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  accepted: boolean
  documents: LoginAgreementDocument[]
  mode: 'modal' | 'checkbox' | string
  updatedAt?: string
  visible: boolean
}>(), {
  updatedAt: ''
})

const emit = defineEmits<{
  accept: []
  reject: []
  open: []
}>()

const dialogVisible = computed(() => props.visible && documents.value.length > 0)
const documents = computed(() => props.documents.filter((doc) => doc.title.trim()))
const updatedAt = computed(() => props.updatedAt || '')
const accepted = computed(() => props.accepted)
const mode = computed(() => props.mode === 'checkbox' ? 'checkbox' : 'modal')

function documentRoute(doc: LoginAgreementDocument) {
  return {
    name: 'LegalDocument',
    params: {
      documentId: doc.id || doc.title,
    },
  }
}

function handleCheckboxChange(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    emit('accept')
  } else {
    emit('reject')
  }
}

function documentIcon(index: number, title: string): 'document' | 'shield' | 'globe' | 'cog' {
  const normalizedTitle = title.toLowerCase()
  if (
    normalizedTitle.includes('policy') ||
    normalizedTitle.includes('privacy') ||
    title.includes('政策') ||
    title.includes('隐私')
  ) {
    return 'shield'
  }
  if (
    normalizedTitle.includes('country') ||
    normalizedTitle.includes('region') ||
    title.includes('国家') ||
    title.includes('地区')
  ) {
    return 'globe'
  }
  if (index === 3) {
    return 'cog'
  }
  return 'document'
}
</script>
