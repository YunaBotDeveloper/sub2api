<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-10">
    <div class="w-full max-w-md border border-border bg-surface" style="border-top: 4px solid rgb(var(--accent))">
      <!-- 作废票据：404 + VOID 印章 -->
      <div class="relative overflow-hidden border-b border-border px-6 py-10 text-center">
        <!-- 作废：404 上压一道红色双线 -->
        <span class="relative inline-block text-[6rem] font-bold leading-none tabular-nums text-border-strong" aria-hidden="true">
          404
          <span class="absolute inset-x-[-0.5rem] top-1/2 h-2 -translate-y-1/2 border-y-2 border-danger"></span>
        </span>
      </div>

      <div class="px-6 py-6">
        <h1 class="text-h2 font-bold text-accent-strong">
          {{ t('errors.pageNotFound') }}
        </h1>
        <p class="mt-2 text-body text-fg-muted">
          {{ t('errors.pageNotFoundDesc') }}
        </p>
      </div>

      <div class="flex flex-col gap-3 border-t border-border bg-surface-sunken px-6 py-4 sm:flex-row">
        <button type="button" @click="goBack" class="btn btn-secondary">
          <Icon name="arrowLeft" size="sm" />
          {{ t('common.back') }}
        </button>
        <router-link to="/dashboard" class="btn btn-primary">
          <Icon name="home" size="sm" />
          {{ t('home.goToDashboard') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const router = useRouter()

function goBack(): void {
  router.back()
}
</script>
