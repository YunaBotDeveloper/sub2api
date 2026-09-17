<template>
  <!-- Sort Order Modal -->
  <BaseDialog
    :show="showSortModal"
    :title="t('admin.groups.sortOrder')"
    width="normal"
    @close="closeSortModal"
  >
    <div class="space-y-4">
      <p class="text-sm text-fg-muted">
        {{ t("admin.groups.sortOrderHint") }}
      </p>
      <VueDraggable
        v-model="sortableGroups"
        :animation="200"
        class="divide-y divide-border border-y border-border"
      >
        <div
          v-for="group in sortableGroups"
          :key="group.id"
          class="flex cursor-grab items-center gap-3 bg-surface px-2 py-2.5 hover:bg-accent-weak/50 active:cursor-grabbing"
        >
          <div class="text-fg-subtle">
            <Icon name="menu" size="md" />
          </div>
          <div class="flex-1">
            <div class="font-medium text-fg">
              {{ group.name }}
            </div>
            <div class="text-xs text-fg-muted">
              <span
                class="badge badge-gray"
              >
                {{ t("admin.groups.platforms." + group.platform) }}
              </span>
            </div>
          </div>
          <div class="font-mono text-meta text-fg-subtle">#{{ group.id }}</div>
        </div>
      </VueDraggable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <button
          @click="closeSortModal"
          type="button"
          class="btn btn-secondary"
        >
          {{ t("common.cancel") }}
        </button>
        <button
          @click="saveSortOrder"
          :disabled="sortSubmitting"
          class="btn btn-primary"
        >
          <svg
            v-if="sortSubmitting"
            class="-ml-1 mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ sortSubmitting ? t("common.saving") : t("common.save") }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useGroupsViewContext } from "./context";
import BaseDialog from "@/components/common/BaseDialog.vue";
import Icon from "@/components/icons/Icon.vue";
import { VueDraggable } from "vue-draggable-plus";

// 纯移动拆分：所有状态与方法来自 GroupsView 提供的上下文（openspec: rebuild-frontend-design-system Phase 3）
const ctx = useGroupsViewContext();
const {
  closeSortModal,
  saveSortOrder,
  showSortModal,
  sortSubmitting,
  sortableGroups,
  t,
} = ctx;
</script>
