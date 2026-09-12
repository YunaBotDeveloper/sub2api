<template>
  <!-- Sort Order Modal -->
  <BaseDialog
    :show="showSortModal"
    :title="t('admin.groups.sortOrder')"
    width="normal"
    @close="closeSortModal"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t("admin.groups.sortOrderHint") }}
      </p>
      <VueDraggable
        v-model="sortableGroups"
        :animation="200"
        class="space-y-2"
      >
        <div
          v-for="group in sortableGroups"
          :key="group.id"
          class="flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow active:cursor-grabbing dark:border-dark-600 dark:bg-dark-700"
        >
          <div class="text-gray-400">
            <Icon name="menu" size="md" />
          </div>
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-white">
              {{ group.name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              <span
                :class="[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  group.platform === 'anthropic'
                    ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                    : group.platform === 'openai'
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                      : group.platform === 'antigravity'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        : group.platform === 'grok'
                          ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                          : group.platform === 'kimi'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            : group.platform === 'zhipu'
                              ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
                              : group.platform === 'deepseek'
                                ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
                                : group.platform === 'minimax'
                                  ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                  : group.platform === 'opencode_go'
                                    ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                                    : 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
                ]"
              >
                {{ t("admin.groups.platforms." + group.platform) }}
              </span>
            </div>
          </div>
          <div class="text-sm text-gray-400">#{{ group.id }}</div>
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
