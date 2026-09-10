<template>
  <!-- Composite Routes Modal -->
  <BaseDialog
    :show="showCompositeRoutesModal"
    :title="
      compositeRoutesGroup
        ? t('admin.groups.compositeRoutes.titleWithGroup', {
            name: compositeRoutesGroup.name,
          })
        : t('admin.groups.compositeRoutes.title')
    "
    width="wide"
    @close="closeCompositeRoutesModal"
  >
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section class="min-w-0">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ t("admin.groups.compositeRoutes.routes") }}
          </h3>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="compositeRoutesLoading"
            @click="loadCompositeRoutes"
          >
            <Icon
              name="refresh"
              size="sm"
              :class="compositeRoutesLoading ? 'animate-spin' : ''"
            />
          </button>
        </div>

        <div
          class="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-600"
        >
          <div
            v-if="compositeRoutesLoading"
            class="flex h-36 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t("common.loading") }}
          </div>
          <div
            v-else-if="compositeRoutes.length === 0"
            class="flex h-36 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ t("admin.groups.compositeRoutes.empty") }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-dark-600">
              <thead class="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-dark-800 dark:text-gray-400">
                <tr>
                  <th class="px-3 py-2">
                    {{ t("admin.groups.compositeRoutes.publicModel") }}
                  </th>
                  <th class="px-3 py-2">
                    {{ t("admin.groups.compositeRoutes.target") }}
                  </th>
                  <th class="px-3 py-2">
                    {{ t("admin.groups.compositeRoutes.scope") }}
                  </th>
                  <th class="px-3 py-2 text-right">
                    {{ t("admin.groups.columns.actions") }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white dark:divide-dark-700 dark:bg-dark-900">
                <tr
                  v-for="route in compositeRoutes"
                  :key="route.id"
                  :class="!route.enabled && 'opacity-60'"
                >
                  <td class="max-w-[15rem] px-3 py-2">
                    <div class="break-all font-medium text-gray-900 dark:text-white">
                      {{ route.public_model }}
                    </div>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5">
                      <span class="badge badge-gray">{{
                        compositeRouteMatchLabel(route.match_type)
                      }}</span>
                      <span
                        v-if="!route.enabled"
                        class="badge badge-danger"
                      >
                        {{ t("admin.accounts.status.inactive") }}
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-1.5 text-gray-900 dark:text-white">
                      <PlatformIcon :platform="route.target_platform" size="xs" />
                      <span>{{ formatCompositePlatform(route.target_platform) }}</span>
                    </div>
                    <div class="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                      {{ route.upstream_model || route.public_model }}
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-gray-700 dark:text-gray-300">
                      {{ formatCompositeEndpoint(route.endpoint) }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t("admin.groups.compositeRoutes.priority") }}:
                      {{ route.priority }}
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex justify-end gap-1">
                      <button
                        type="button"
                        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                        :title="t('common.edit')" :aria-label="t('common.edit')"
                        @click="editCompositeRoute(route)"
                      >
                        <Icon name="edit" size="sm" />
                      </button>
                      <button
                        type="button"
                        class="rounded p-1.5 text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20 dark:hover:text-danger-400"
                        :title="t('common.delete')" :aria-label="t('common.delete')"
                        @click="deleteCompositeRoute(route)"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="space-y-5">
        <form class="space-y-3" @submit.prevent="saveCompositeRoute">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{
                compositeRouteEditingId
                  ? t("admin.groups.compositeRoutes.editRoute")
                  : t("admin.groups.compositeRoutes.addRoute")
              }}
            </h3>
            <button
              v-if="compositeRouteEditingId"
              type="button"
              class="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="resetCompositeRouteForm"
            >
              {{ t("common.cancel") }}
            </button>
          </div>

          <div>
            <label class="input-label">{{
              t("admin.groups.compositeRoutes.publicModel")
            }}</label>
            <input
              v-model.trim="compositeRouteForm.public_model"
              type="text"
              class="input"
              required
              placeholder="openrouter/gpt-5"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="input-label">{{
                t("admin.groups.compositeRoutes.matchType")
              }}</label>
              <Select
                v-model="compositeRouteForm.match_type"
                :options="compositeRouteMatchOptions"
              />
            </div>
            <div>
              <label class="input-label">{{
                t("admin.groups.compositeRoutes.endpoint")
              }}</label>
              <Select
                v-model="compositeRouteForm.endpoint"
                :options="compositeRouteEndpointOptions"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="input-label">{{
                t("admin.groups.compositeRoutes.targetPlatform")
              }}</label>
              <Select
                v-model="compositeRouteForm.target_platform"
                :options="compositeRoutePlatformOptions"
              />
            </div>
            <div>
              <label class="input-label">{{
                t("admin.groups.compositeRoutes.priority")
              }}</label>
              <input
                v-model.number="compositeRouteForm.priority"
                type="number"
                min="1"
                step="1"
                class="input"
              />
            </div>
          </div>

          <div>
            <label class="input-label">{{
              t("admin.groups.compositeRoutes.upstreamModel")
            }}</label>
            <input
              v-model.trim="compositeRouteForm.upstream_model"
              type="text"
              class="input"
              placeholder="gpt-5"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ t("admin.groups.compositeRoutes.upstreamModelHint") }}
            </p>
          </div>

          <div>
            <label class="input-label">{{
              t("admin.groups.compositeRoutes.notes")
            }}</label>
            <textarea
              v-model.trim="compositeRouteForm.notes"
              rows="2"
              class="input"
            ></textarea>
          </div>

          <div class="flex items-center justify-between gap-3">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                v-model="compositeRouteForm.enabled"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
              />
              {{ t("admin.groups.compositeRoutes.enabled") }}
            </label>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="compositeRouteSaving"
            >
              <Icon
                v-if="!compositeRouteSaving"
                name="check"
                size="sm"
                class="mr-2"
              />
              {{ compositeRouteEditingId ? t("common.update") : t("common.create") }}
            </button>
          </div>
        </form>

        <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {{ t("admin.groups.compositeRoutes.preview") }}
          </h3>
          <div class="space-y-3">
            <input
              v-model.trim="compositePreviewModel"
              type="text"
              class="input"
              placeholder="openrouter/gpt-5"
              @keyup.enter="previewCompositeRoute"
            />
            <div class="flex gap-2">
              <Select
                v-model="compositePreviewEndpoint"
                :options="compositeRouteEndpointOptions"
                class="min-w-0 flex-1"
              />
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="compositePreviewLoading || !compositePreviewModel"
                @click="previewCompositeRoute"
              >
                <Icon name="play" size="sm" />
              </button>
            </div>

            <div
              v-if="compositePreviewDecision"
              class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-dark-600 dark:bg-dark-800"
            >
              <div class="mb-2 flex items-center gap-2">
                <span
                  :class="[
                    'badge',
                    compositePreviewDecision.matched
                      ? 'badge-success'
                      : 'badge-danger',
                  ]"
                >
                  {{
                    compositePreviewDecision.matched
                      ? t("admin.groups.compositeRoutes.matched")
                      : t("admin.groups.compositeRoutes.notMatched")
                  }}
                </span>
                <span class="badge badge-gray">
                  {{
                    compositeRouteSourceLabel(
                      compositePreviewDecision.source,
                    )
                  }}
                </span>
              </div>
              <div
                v-if="compositePreviewDecision.matched"
                class="space-y-1 text-gray-700 dark:text-gray-300"
              >
                <div>
                  {{ t("admin.groups.compositeRoutes.targetPlatform") }}:
                  {{
                    formatCompositePlatform(
                      compositePreviewDecision.target_platform,
                    )
                  }}
                </div>
                <div class="break-all">
                  {{ t("admin.groups.compositeRoutes.upstreamModel") }}:
                  {{ compositePreviewDecision.upstream_model }}
                </div>
              </div>
              <div
                v-else
                class="text-gray-500 dark:text-gray-400"
              >
                {{ compositePreviewDecision.reason }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end pt-4">
        <button
          type="button"
          class="btn btn-secondary"
          @click="closeCompositeRoutesModal"
        >
          {{ t("common.close") }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useGroupsViewContext } from "./context";
import BaseDialog from "@/components/common/BaseDialog.vue";
import Icon from "@/components/icons/Icon.vue";
import PlatformIcon from "@/components/common/PlatformIcon.vue";
import Select from "@/components/common/Select.vue";

// 纯移动拆分：所有状态与方法来自 GroupsView 提供的上下文（openspec: rebuild-frontend-design-system Phase 3）
const ctx = useGroupsViewContext();
const {
  closeCompositeRoutesModal,
  compositePreviewDecision,
  compositePreviewEndpoint,
  compositePreviewLoading,
  compositePreviewModel,
  compositeRouteEditingId,
  compositeRouteEndpointOptions,
  compositeRouteForm,
  compositeRouteMatchLabel,
  compositeRouteMatchOptions,
  compositeRoutePlatformOptions,
  compositeRouteSaving,
  compositeRouteSourceLabel,
  compositeRoutes,
  compositeRoutesGroup,
  compositeRoutesLoading,
  deleteCompositeRoute,
  editCompositeRoute,
  formatCompositeEndpoint,
  formatCompositePlatform,
  loadCompositeRoutes,
  previewCompositeRoute,
  resetCompositeRouteForm,
  saveCompositeRoute,
  showCompositeRoutesModal,
  t,
} = ctx;
</script>
