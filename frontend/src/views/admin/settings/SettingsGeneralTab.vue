<template>
  <div v-show="activeTab === 'general'" class="space-y-6">
    <!-- Site Settings -->
    <div class="card">
      <div
        class="border-b border-gray-100 px-6 py-4 dark:border-dark-700"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t("admin.settings.site.title") }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t("admin.settings.site.description") }}
        </p>
      </div>
      <div class="space-y-6 p-6">
        <!-- Backend Mode -->
        <div
          class="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20"
        >
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              {{ t("admin.settings.site.backendMode") }}
            </h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ t("admin.settings.site.backendModeDescription") }}
            </p>
          </div>
          <Toggle v-model="form.backend_mode_enabled" />
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ t("admin.settings.site.siteName") }}
            </label>
            <input
              v-model="form.site_name"
              type="text"
              class="input"
              :placeholder="t('admin.settings.site.siteNamePlaceholder')"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ t("admin.settings.site.siteNameHint") }}
            </p>
          </div>
          <div>
            <label
              class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ t("admin.settings.site.siteSubtitle") }}
            </label>
            <input
              v-model="form.site_subtitle"
              type="text"
              class="input"
              :placeholder="
                t('admin.settings.site.siteSubtitlePlaceholder')
              "
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ t("admin.settings.site.siteSubtitleHint") }}
            </p>
          </div>
        </div>

        <!-- API Base URL -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.apiBaseUrl") }}
          </label>
          <input
            v-model="form.api_base_url"
            type="text"
            class="input font-mono text-sm"
            :placeholder="t('admin.settings.site.apiBaseUrlPlaceholder')"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.apiBaseUrlHint") }}
          </p>
        </div>

        <!-- Global Table Preferences -->
        <div class="border-t border-gray-100 pt-4 dark:border-dark-700">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">
            {{ t("admin.settings.site.tablePreferencesTitle") }}
          </h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.tablePreferencesDescription") }}
          </p>
          <div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ t("admin.settings.site.tableDefaultPageSize") }}
              </label>
              <input
                v-model.number="form.table_default_page_size"
                type="number"
                min="5"
                max="1000"
                step="1"
                class="input w-40"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t("admin.settings.site.tableDefaultPageSizeHint") }}
              </p>
            </div>
            <div>
              <label
                class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ t("admin.settings.site.tablePageSizeOptions") }}
              </label>
              <input
                v-model="tablePageSizeOptionsInput"
                type="text"
                class="input font-mono text-sm"
                :placeholder="
                  t('admin.settings.site.tablePageSizeOptionsPlaceholder')
                "
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ t("admin.settings.site.tablePageSizeOptionsHint") }}
              </p>
            </div>
          </div>
        </div>

        <!-- Custom Endpoints -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.customEndpoints.title") }}
          </label>
          <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.customEndpoints.description") }}
          </p>

          <div class="space-y-3">
            <div
              v-for="(ep, index) in form.custom_endpoints"
              :key="index"
              class="rounded-lg border border-gray-200 p-4 dark:border-dark-600"
            >
              <div class="mb-3 flex items-center justify-between">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {{
                    t("admin.settings.site.customEndpoints.itemLabel", {
                      n: index + 1,
                    })
                  }}
                </span>
                <button
                  type="button"
                  class="rounded p-1 text-danger-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                  @click="removeEndpoint(index)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{ t("admin.settings.site.customEndpoints.name") }}
                  </label>
                  <input
                    v-model="ep.name"
                    type="text"
                    class="input text-sm"
                    :placeholder="
                      t(
                        'admin.settings.site.customEndpoints.namePlaceholder',
                      )
                    "
                  />
                </div>
                <div>
                  <label
                    class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{
                      t("admin.settings.site.customEndpoints.endpointUrl")
                    }}
                  </label>
                  <input
                    v-model="ep.endpoint"
                    type="url"
                    class="input font-mono text-sm"
                    :placeholder="
                      t(
                        'admin.settings.site.customEndpoints.endpointUrlPlaceholder',
                      )
                    "
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    {{
                      t(
                        "admin.settings.site.customEndpoints.descriptionLabel",
                      )
                    }}
                  </label>
                  <input
                    v-model="ep.description"
                    type="text"
                    class="input text-sm"
                    :placeholder="
                      t(
                        'admin.settings.site.customEndpoints.descriptionPlaceholder',
                      )
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-dark-600 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:text-primary-400"
            @click="addEndpoint"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {{ t("admin.settings.site.customEndpoints.add") }}
          </button>
        </div>

        <!-- Contact Info -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.contactInfo") }}
          </label>
          <input
            v-model="form.contact_info"
            type="text"
            class="input"
            :placeholder="t('admin.settings.site.contactInfoPlaceholder')"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.contactInfoHint") }}
          </p>
        </div>

        <!-- Doc URL -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.docUrl") }}
          </label>
          <input
            v-model="form.doc_url"
            type="url"
            class="input font-mono text-sm"
            :placeholder="t('admin.settings.site.docUrlPlaceholder')"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.docUrlHint") }}
          </p>
        </div>

        <!-- Site Logo Upload -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.siteLogo") }}
          </label>
          <ImageUpload
            v-model="form.site_logo"
            mode="image"
            :upload-label="t('admin.settings.site.uploadImage')"
            :remove-label="t('admin.settings.site.remove')"
            :hint="t('admin.settings.site.logoHint')"
            :max-size="300 * 1024"
          />
        </div>

        <!-- Home Content -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.site.homeContent") }}
          </label>
          <textarea
            v-model="form.home_content"
            rows="6"
            class="input font-mono text-sm"
            :placeholder="t('admin.settings.site.homeContentPlaceholder')"
          ></textarea>
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.site.homeContentHint") }}
          </p>
          <!-- iframe CSP Warning -->
          <p class="mt-2 text-xs text-warning-600 dark:text-warning-400">
            {{ t("admin.settings.site.homeContentIframeWarning") }}
          </p>
        </div>

        <!-- Compact Home Page -->
        <div class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
          <div>
            <label class="font-medium text-gray-900 dark:text-white">{{
              t("admin.settings.site.compactHome")
            }}</label>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t("admin.settings.site.compactHomeHint") }}
            </p>
          </div>
          <Toggle v-model="form.compact_home_enabled" data-testid="compact-home-toggle" />
        </div>

        <!-- Hide CCS Import Button -->
        <div
          class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
        >
          <div>
            <label class="font-medium text-gray-900 dark:text-white">{{
              t("admin.settings.site.hideCcsImportButton")
            }}</label>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t("admin.settings.site.hideCcsImportButtonHint") }}
            </p>
          </div>
          <Toggle v-model="form.hide_ccs_import_button" />
        </div>
      </div>
    </div>

    <!-- Custom Menu Items -->
    <div class="card">
      <div
        class="border-b border-gray-100 px-6 py-4 dark:border-dark-700"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t("admin.settings.customMenu.title") }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t("admin.settings.customMenu.description") }}
        </p>
      </div>
      <div class="space-y-4 p-6">
        <!-- Existing menu items -->
        <div
          v-for="(item, index) in form.custom_menu_items"
          :key="item.id || index"
          class="rounded-lg border border-gray-200 p-4 dark:border-dark-600"
        >
          <div class="mb-3 flex items-center justify-between">
            <span
              class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{
                t("admin.settings.customMenu.itemLabel", { n: index + 1 })
              }}
            </span>
            <div class="flex items-center gap-2">
              <!-- Move up -->
              <button
                v-if="index > 0"
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700"
                :title="t('admin.settings.customMenu.moveUp')"
                @click="moveMenuItem(index, -1)"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <!-- Move down -->
              <button
                v-if="index < form.custom_menu_items.length - 1"
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700"
                :title="t('admin.settings.customMenu.moveDown')"
                @click="moveMenuItem(index, 1)"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <!-- Delete -->
              <button
                type="button"
                class="rounded p-1 text-danger-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                :title="t('admin.settings.customMenu.remove')"
                @click="removeMenuItem(index)"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Label -->
            <div>
              <label
                class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {{ t("admin.settings.customMenu.name") }}
              </label>
              <input
                v-model="item.label"
                type="text"
                class="input text-sm"
                :placeholder="
                  t('admin.settings.customMenu.namePlaceholder')
                "
              />
            </div>

            <!-- Visibility -->
            <div>
              <label
                class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {{ t("admin.settings.customMenu.visibility") }}
              </label>
              <select v-model="item.visibility" class="input text-sm">
                <option value="user">
                  {{ t("admin.settings.customMenu.visibilityUser") }}
                </option>
                <option value="admin">
                  {{ t("admin.settings.customMenu.visibilityAdmin") }}
                </option>
              </select>
            </div>

            <!-- URL (full width) -->
            <div class="sm:col-span-2">
              <label
                class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {{ t("admin.settings.customMenu.url") }}
              </label>
              <input
                v-model="item.url"
                type="url"
                class="input font-mono text-sm"
                :placeholder="
                  t('admin.settings.customMenu.urlPlaceholder')
                "
              />
            </div>

            <!-- Token passthrough (security sensitive, full width) -->
            <div
              class="rounded-md border border-warning-300 bg-warning-50 p-3 dark:border-warning-700/60 dark:bg-warning-900/20 sm:col-span-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <label
                    class="block text-xs font-medium text-warning-800 dark:text-warning-300"
                  >
                    {{ t("admin.settings.customMenu.passToken") }}
                  </label>
                  <p
                    class="mt-1 text-xs text-warning-700 dark:text-warning-400"
                  >
                    {{ t("admin.settings.customMenu.passTokenHint") }}
                  </p>
                </div>
                <label class="toggle shrink-0">
                  <input v-model="item.pass_token" type="checkbox" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- SVG Icon (full width) -->
            <div class="sm:col-span-2">
              <label
                class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {{ t("admin.settings.customMenu.iconSvg") }}
              </label>
              <ImageUpload
                :model-value="item.icon_svg"
                mode="svg"
                size="sm"
                :upload-label="t('admin.settings.customMenu.uploadSvg')"
                :remove-label="t('admin.settings.customMenu.removeSvg')"
                @update:model-value="(v: string) => (item.icon_svg = v)"
              />
            </div>
          </div>
        </div>

        <!-- Add button -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-dark-600 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:text-primary-400"
          @click="addMenuItem"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {{ t("admin.settings.customMenu.add") }}
        </button>
      </div>
    </div>

    <!-- Custom Page iframe host allowlist -->
    <div class="card">
      <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t("admin.settings.customPageIframe.title") }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ t("admin.settings.customPageIframe.description") }}
        </p>
      </div>
      <div class="space-y-4 p-6">
        <!-- Mode selector: built-in defaults vs. an explicit list -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ t("admin.settings.customPageIframe.mode") }}
          </label>
          <div
            class="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-dark-700"
          >
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition"
              :class="
                customPageIframeMode === 'default'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-dark-800 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
              "
              data-testid="custom-page-iframe-mode-default"
              @click="customPageIframeMode = 'default'"
            >
              {{ t("admin.settings.customPageIframe.modeDefault") }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition"
              :class="
                customPageIframeMode === 'custom'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-dark-800 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-dark-300 dark:hover:text-white'
              "
              data-testid="custom-page-iframe-mode-custom"
              @click="customPageIframeMode = 'custom'"
            >
              {{ t("admin.settings.customPageIframe.modeCustom") }}
            </button>
          </div>
        </div>

        <!-- Which of the three states is actually in effect -->
        <div
          class="rounded-md border p-3 text-sm"
          :class="
            customPageIframeState === 'lockdown'
              ? 'border-danger-300 bg-danger-50 text-danger-800 dark:border-danger-700/60 dark:bg-danger-900/20 dark:text-danger-300'
              : customPageIframeState === 'allowlist'
                ? 'border-success-300 bg-success-50 text-success-800 dark:border-success-700/60 dark:bg-success-900/20 dark:text-success-300'
                : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-dark-600 dark:bg-dark-700/40 dark:text-gray-300'
          "
          data-testid="custom-page-iframe-state"
        >
          <p class="font-medium">
            <template v-if="customPageIframeState === 'default'">
              {{ t("admin.settings.customPageIframe.stateDefault") }}
            </template>
            <template v-else-if="customPageIframeState === 'allowlist'">
              {{
                t("admin.settings.customPageIframe.stateAllowlist", {
                  count: customPageIframeNormalizedHosts.length,
                })
              }}
            </template>
            <template v-else>
              {{ t("admin.settings.customPageIframe.stateLockdown") }}
            </template>
          </p>
          <p
            v-if="customPageIframeState === 'lockdown'"
            class="mt-1 text-xs"
          >
            {{ t("admin.settings.customPageIframe.lockdownWarning") }}
          </p>
        </div>

        <!-- Built-in defaults, shown read-only so "defaults apply" is not abstract -->
        <div v-if="customPageIframeMode === 'default'">
          <label
            class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            {{ t("admin.settings.customPageIframe.defaultsLabel") }}
          </label>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="host in customPageIframeDefaultHosts"
              :key="host"
              class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-dark-700 dark:text-gray-300"
            >
              {{ host }}
            </span>
          </div>
        </div>

        <!-- Explicit host list -->
        <div v-else>
          <label
            class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            {{ t("admin.settings.customPageIframe.hosts") }}
          </label>
          <textarea
            v-model="customPageIframeHostsDraft"
            rows="5"
            class="input font-mono text-sm"
            :class="
              customPageIframeInvalidEntry !== null
                ? 'border-danger-400 dark:border-danger-600'
                : ''
            "
            :placeholder="
              t('admin.settings.customPageIframe.hostsPlaceholder')
            "
            data-testid="custom-page-iframe-hosts"
          ></textarea>
          <p
            v-if="customPageIframeInvalidEntry !== null"
            class="mt-1 text-xs text-danger-600 dark:text-danger-400"
            data-testid="custom-page-iframe-error"
          >
            {{
              t("admin.settings.customPageIframe.invalidHost", {
                host: customPageIframeInvalidEntry,
              })
            }}
          </p>
          <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t("admin.settings.customPageIframe.hostsHint") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsViewContext } from "./context";
import ImageUpload from "@/components/common/ImageUpload.vue";
import Toggle from "@/components/common/Toggle.vue";

// 纯移动拆分：所有状态与方法来自 SettingsView 提供的上下文（openspec: rebuild-frontend-design-system Phase 3）
const ctx = useSettingsViewContext();
const {
  activeTab,
  addEndpoint,
  addMenuItem,
  customPageIframeDefaultHosts,
  customPageIframeHostsDraft,
  customPageIframeInvalidEntry,
  customPageIframeMode,
  customPageIframeNormalizedHosts,
  customPageIframeState,
  form,
  moveMenuItem,
  removeEndpoint,
  removeMenuItem,
  t,
  tablePageSizeOptionsInput,
} = ctx;
</script>
