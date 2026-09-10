<template>
  <BaseDialog
    :show="!!displayedAnnouncement"
    :title="displayedAnnouncement?.title ?? ''"
    width="wide"
    :z-index="120"
    :show-close-button="preview"
    :close-on-escape="preview"
    @close="handleDismiss"
  >
    <template v-if="displayedAnnouncement">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span class="badge badge-warning inline-flex items-center gap-1.5">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-500 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-warning-500"></span>
          </span>
          {{ t('announcements.unread') }}
        </span>
        <span class="inline-flex items-center gap-1.5 text-meta text-fg-muted">
          <Icon name="clock" size="sm" />
          <time>{{ formatRelativeWithDateTime(displayedAnnouncement.created_at) }}</time>
        </span>
      </div>
      <div class="border-l-4 border-warning-500 pl-4">
        <div
          class="markdown-body prose prose-sm max-w-none dark:prose-invert"
          v-html="renderedContent"
        ></div>
      </div>
    </template>
    <template #footer>
      <button
        @click="handleDismiss"
        data-testid="announcement-popup-dismiss"
        class="btn btn-primary flex items-center gap-2"
      >
        <Icon :name="preview ? 'x' : 'check'" size="sm" />
        {{ preview ? t('common.close') : t('announcements.markRead') }}
      </button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAnnouncementStore } from '@/stores/announcements'
import { formatRelativeWithDateTime } from '@/utils/format'
import type { Announcement, UserAnnouncement } from '@/types'
import '@/styles/announcement-markdown.css'

type PreviewAnnouncement = Pick<Announcement | UserAnnouncement, 'title' | 'content' | 'created_at'>

const props = withDefaults(defineProps<{
  announcement?: PreviewAnnouncement | null
  preview?: boolean
}>(), {
  announcement: null,
  preview: false,
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const announcementStore = useAnnouncementStore()
const displayedAnnouncement = computed(() => (
  props.preview ? props.announcement : announcementStore.currentPopup
))

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  const content = displayedAnnouncement.value?.content
  if (!content) return ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

function handleDismiss() {
  if (props.preview) {
    emit('close')
    return
  }
  announcementStore.dismissPopup()
}

// Manage body overflow — only set, never unset (bell component handles restore)
watch(
  displayedAnnouncement,
  (popup) => {
    if (popup) {
      document.body.style.overflow = 'hidden'
    } else if (props.preview) {
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.preview) {
    document.body.style.overflow = ''
  }
})
</script>
