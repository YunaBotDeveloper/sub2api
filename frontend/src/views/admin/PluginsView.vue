<template>
  <AppLayout>
    <div class="space-y-6">
      <section
        class="page-header mb-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="min-w-0">
          <h2 class="page-title">
            {{ t("admin.plugins.title") }}
          </h2>
          <p class="page-description max-w-3xl">
            {{ t("admin.plugins.description") }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span class="badge">{{ t("admin.plugins.onlyOpenAI") }}</span>
            <span class="badge">{{ t("admin.plugins.noAccountCoupling") }}</span>
          </div>
        </div>

        <div class="flex flex-shrink-0 items-center gap-2">
          <input
            ref="fileInput"
            class="hidden"
            type="file"
            accept=".s2plugin,application/zip"
            @change="handleFileSelected"
          />
          <button
            type="button"
            class="btn btn-primary"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <Icon name="upload" size="sm" />
            {{ uploading ? t("common.processing") : t("admin.plugins.upload") }}
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-icon"
            :disabled="loading"
            :title="t('common.refresh')" :aria-label="t('common.refresh')"
            @click="loadPlugins"
          >
            <Icon name="refresh" size="sm" />
            <span class="sr-only">{{ t("common.refresh") }}</span>
          </button>
        </div>
      </section>

      <div class="border border-accent/40 bg-accent-weak px-4 py-3 text-body text-accent-strong">
        <p>{{ t("admin.plugins.runtimeNotice") }}</p>
        <p class="mt-1">{{ t("admin.plugins.menuNotice") }}</p>
        <p class="mt-2 border-t border-accent/30 pt-2 text-meta text-fg-muted">
          {{ t("admin.plugins.uploadHint") }}
        </p>
      </div>

      <div
        v-if="loading"
        class="flex min-h-48 items-center justify-center text-body text-fg-muted"
      >
        {{ t("common.loading") }}
      </div>

      <div v-else-if="plugins.length === 0" class="card empty-state">
        <Icon name="cube" size="xl" class="empty-state-icon" />
        <p class="empty-state-title">
          {{ t("admin.plugins.empty") }}
        </p>
        <p class="empty-state-description max-w-lg">
          {{ t("admin.plugins.emptyHint") }}
        </p>
      </div>

      <section v-else class="card">
        <div class="card-header flex items-baseline justify-between gap-3">
          <h3 class="card-title">{{ t("admin.plugins.title") }}</h3>
          <span class="text-meta tabular-nums text-fg-muted">{{ plugins.length }}</span>
        </div>
        <ol class="divide-y divide-border">
          <li
            v-for="(plugin, index) in plugins"
            :key="plugin.id"
            class="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <!-- Register entry: identity -->
            <div class="flex min-w-0 gap-3">
              <span class="w-6 shrink-0 pt-0.5 text-right text-meta tabular-nums text-fg-subtle">{{ index + 1 }}</span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-h3 font-bold text-fg">
                    {{ plugin.name }}
                  </h3>
                  <span class="font-mono text-meta text-fg-muted">v{{ plugin.version }}</span>
                  <span class="badge" :class="stateClass(plugin.state)">
                    {{ t(`admin.plugins.${plugin.state}`) }}
                  </span>
                </div>
                <p class="mt-1 break-all text-meta text-fg-muted">
                  <span class="font-mono">{{ plugin.plugin_key }}</span><span v-if="plugin.author"> · {{ plugin.author }}</span>
                </p>
                <p v-if="plugin.description" class="mt-2 text-body text-fg-muted">
                  {{ plugin.description }}
                </p>
              </div>
            </div>

            <!-- Compatibility -->
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-meta font-medium text-fg-muted">{{ t("admin.plugins.compatibility") }}</span>
                <span class="badge" :class="compatibilityClass(plugin.compatibility.status)">
                  {{ t(`admin.plugins.${plugin.compatibility.status}`) }}
                </span>
              </div>
              <p class="mt-1 text-meta text-fg-muted">
                {{ plugin.compatibility.message }}
              </p>
              <dl class="mt-2 grid grid-cols-[auto,1fr] gap-x-3 border-t border-border pt-2 text-meta">
                <dt class="text-fg-muted">
                  {{ t("admin.plugins.currentVersion") }}
                </dt>
                <dd class="font-mono text-fg">
                  {{ plugin.compatibility.current_sub2api_version }}
                </dd>
                <dt class="text-fg-muted">
                  {{ t("admin.plugins.requiredVersion") }}
                </dt>
                <dd class="font-mono text-fg">
                  {{ plugin.compatibility.required_sub2api_version }}
                </dd>
                <dt class="text-fg-muted">
                  {{ t("admin.plugins.recommendedVersion") }}
                </dt>
                <dd class="font-mono text-fg">
                  {{ plugin.compatibility.recommended_sub2api_version || "-" }}
                </dd>
              </dl>
            </div>

            <!-- Runtime, rollout, actions -->
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-meta font-medium text-fg-muted">{{ t("admin.plugins.runtime") }}</span>
                <span
                  class="badge"
                  :class="plugin.runtime_healthy ? 'badge-success' : 'badge-gray'"
                >
                  {{
                    plugin.runtime_healthy
                      ? t("admin.plugins.healthy")
                      : t("admin.plugins.unhealthy")
                  }}
                </span>
                <span class="badge">
                  {{ t("admin.plugins.signature") }}:
                  {{ t(`admin.plugins.${plugin.signature_status}`) }}
                </span>
              </div>
              <p v-if="plugin.last_error" class="mt-1 break-words text-meta text-danger">
                {{ plugin.last_error }}
              </p>
              <p v-else-if="plugin.runtime_message" class="mt-1 break-words text-meta text-fg-muted">
                {{ plugin.runtime_message }}
              </p>

              <div class="mt-2 border-t border-border pt-2">
                <label class="flex items-center justify-between gap-4 text-meta font-medium text-fg-muted">
                  <span>{{ t("admin.plugins.rollout") }}</span>
                  <span class="w-11 text-right tabular-nums text-fg">{{
                    rolloutValues[plugin.id] ?? currentRollout(plugin)
                  }}%</span>
                </label>
                <input
                  :value="rolloutValues[plugin.id] ?? currentRollout(plugin)"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  class="mt-1 w-full"
                  :disabled="hasEnabledBinding(plugin)"
                  @input="setRollout(plugin.id, $event)"
                />
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="openConfiguration(plugin)"
                >
                  <Icon name="cog" size="sm" />
                  {{ t("admin.plugins.configure") }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  :disabled="busyID === plugin.id"
                  @click="testPlugin(plugin)"
                >
                  <Icon name="beaker" size="sm" />
                  {{ t("admin.plugins.test") }}
                </button>
                <button
                  v-if="hasEnabledBinding(plugin)"
                  type="button"
                  class="btn btn-secondary btn-sm"
                  :disabled="busyID === plugin.id"
                  @click="disablePlugin(plugin)"
                >
                  <Icon name="ban" size="sm" />
                  {{ t("admin.plugins.disable") }}
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="
                    busyID === plugin.id ||
                    plugin.state === 'starting' ||
                    !plugin.compatibility.compatible
                  "
                  @click="enablePlugin(plugin)"
                >
                  <Icon name="play" size="sm" />
                  {{ t("admin.plugins.enable") }}
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  :disabled="busyID === plugin.id || hasEnabledBinding(plugin)"
                  @click="uninstallPlugin(plugin)"
                >
                  <Icon name="trash" size="sm" />
                  {{ t("admin.plugins.uninstall") }}
                </button>
              </div>
            </div>
          </li>
        </ol>
      </section>
      <BaseDialog
        :show="configPlugin !== null"
        :title="
          t('admin.plugins.configTitle', { name: configPlugin?.name || '' })
        "
        width="full"
        @close="closeConfiguration"
      >
        <div
          class="relative min-h-[520px] overflow-hidden bg-surface-sunken"
          :style="{ height: `${iframeHeight}px` }"
        >
          <div
            v-if="uiLoading"
            class="absolute inset-0 z-10 flex items-center justify-center text-sm text-fg-muted"
          >
            {{ t("admin.plugins.loadingUI") }}
          </div>
          <div
            v-if="uiError"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center"
          >
            <Icon name="exclamationTriangle" size="xl" class="text-warning" />
            <p class="mt-3 font-medium text-fg">
              {{ t("admin.plugins.uiUnavailable") }}
            </p>
            <p class="mt-1 max-w-xl text-sm text-fg-muted">{{ uiError }}</p>
          </div>
          <iframe
            v-if="uiSession"
            ref="pluginFrame"
            :src="uiSession.url"
            sandbox="allow-scripts"
            referrerpolicy="no-referrer"
            class="h-full w-full border-0 bg-surface"
            :title="
              t('admin.plugins.configTitle', { name: configPlugin?.name || '' })
            "
            @load="handlePluginFrameLoad"
          />
        </div>
      </BaseDialog>

      <TotpStepUpDialog :controller="pluginStepUp" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  adminAPI,
  type PluginInstallation,
  type PluginUISession,
} from "@/api/admin";
import { useAppStore } from "@/stores";
import AppLayout from "@/components/layout/AppLayout.vue";
import BaseDialog from "@/components/common/BaseDialog.vue";
import Icon from "@/components/icons/Icon.vue";
import TotpStepUpDialog from "@/components/auth/TotpStepUpDialog.vue";
import {
  isStepUpBlocked,
  isStepUpCancelled,
  stepUpBlockReason,
  useStepUp,
} from "@/composables/useStepUp";

interface PluginBridgeMessage {
  source?: string;
  bridge_token?: string;
  type?: string;
  request_id?: string;
  config?: unknown;
  height?: unknown;
  level?: unknown;
  message?: unknown;
}

const { t } = useI18n();
const appStore = useAppStore();
const pluginStepUp = useStepUp();
const plugins = ref<PluginInstallation[]>([]);
const loading = ref(false);
const uploading = ref(false);
const busyID = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const rolloutValues = ref<Record<number, number>>({});
const configPlugin = ref<PluginInstallation | null>(null);
const uiSession = ref<PluginUISession | null>(null);
const pluginFrame = ref<HTMLIFrameElement | null>(null);
const uiLoading = ref(false);
const uiError = ref("");
const iframeHeight = ref(640);
const pluginFrameLoaded = ref(false);
const pendingBridgeRequests = new Map<string, number>();

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(
      (error as { message?: unknown }).message || t("common.unknownError"),
    );
  }
  return t("common.unknownError");
}

function reportSensitiveActionError(error: unknown): void {
  if (isStepUpCancelled(error)) return;
  if (isStepUpBlocked(error)) {
    appStore.showError(
      stepUpBlockReason(error) === "STEP_UP_ADMIN_API_KEY_FORBIDDEN"
        ? t("stepUp.adminApiKeyForbidden")
        : t("stepUp.notEnabled"),
    );
    return;
  }
  appStore.showError(errorMessage(error));
}

async function loadPlugins(): Promise<void> {
  loading.value = true;
  try {
    plugins.value = await adminAPI.plugins.list();
    for (const plugin of plugins.value) {
      rolloutValues.value[plugin.id] = currentRollout(plugin);
    }
  } catch (error: unknown) {
    appStore.showError(errorMessage(error));
  } finally {
    loading.value = false;
  }
}

async function handleFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file || !file.name.toLowerCase().endsWith(".s2plugin")) {
    appStore.showError(t("admin.plugins.fileRequired"));
    return;
  }
  uploading.value = true;
  try {
    await pluginStepUp.run(() => adminAPI.plugins.upload(file));
    appStore.showSuccess(t("admin.plugins.uploadSuccess"));
    await loadPlugins();
  } catch (error: unknown) {
    reportSensitiveActionError(error);
  } finally {
    uploading.value = false;
  }
}

function currentRollout(plugin: PluginInstallation): number {
  return (
    plugin.bindings.find(
      (binding) => binding.capability === "openai.oauth.outbound_transport.v1",
    )?.rollout_percent || 100
  );
}

function hasEnabledBinding(plugin: PluginInstallation): boolean {
  return plugin.bindings.some((binding) => binding.enabled);
}

function setRollout(id: number, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  rolloutValues.value[id] = Math.min(100, Math.max(1, value));
}

async function enablePlugin(plugin: PluginInstallation): Promise<void> {
  let acceptUntested = false;
  if (!plugin.compatibility.tested) {
    acceptUntested = window.confirm(t("admin.plugins.confirmUntested"));
    if (!acceptUntested) return;
  }
  busyID.value = plugin.id;
  try {
    await pluginStepUp.run(() =>
      adminAPI.plugins.enable(
        plugin.id,
        rolloutValues.value[plugin.id] || 100,
        acceptUntested,
      ),
    );
    appStore.showSuccess(t("admin.plugins.enableSuccess"));
    await loadPlugins();
  } catch (error: unknown) {
    reportSensitiveActionError(error);
  } finally {
    busyID.value = null;
  }
}

async function disablePlugin(plugin: PluginInstallation): Promise<void> {
  if (!window.confirm(t("admin.plugins.confirmDisable"))) return;
  busyID.value = plugin.id;
  try {
    await pluginStepUp.run(() => adminAPI.plugins.disable(plugin.id));
    appStore.showSuccess(t("admin.plugins.disableSuccess"));
    await loadPlugins();
  } catch (error: unknown) {
    reportSensitiveActionError(error);
  } finally {
    busyID.value = null;
  }
}

async function uninstallPlugin(plugin: PluginInstallation): Promise<void> {
  if (!window.confirm(t("admin.plugins.confirmUninstall"))) return;
  busyID.value = plugin.id;
  try {
    await pluginStepUp.run(() => adminAPI.plugins.remove(plugin.id));
    appStore.showSuccess(t("admin.plugins.uninstallSuccess"));
    await loadPlugins();
  } catch (error: unknown) {
    reportSensitiveActionError(error);
  } finally {
    busyID.value = null;
  }
}

async function testPlugin(plugin: PluginInstallation): Promise<void> {
  busyID.value = plugin.id;
  try {
    const result = await pluginStepUp.run(() =>
      adminAPI.plugins.test(plugin.id),
    );
    if (result.success)
      appStore.showSuccess(result.message || t("admin.plugins.testSuccess"));
    else appStore.showError(result.message || t("common.error"));
  } catch (error: unknown) {
    reportSensitiveActionError(error);
  } finally {
    busyID.value = null;
  }
}

async function openConfiguration(plugin: PluginInstallation): Promise<void> {
  configPlugin.value = plugin;
  uiSession.value = null;
  pluginFrameLoaded.value = false;
  clearPendingBridgeRequests();
  uiLoading.value = true;
  uiError.value = "";
  iframeHeight.value = 640;
  try {
    uiSession.value = await adminAPI.plugins.createUISession(plugin.id);
  } catch (error: unknown) {
    uiLoading.value = false;
    uiError.value = errorMessage(error);
  }
}

function closeConfiguration(): void {
  clearPendingBridgeRequests();
  pluginFrameLoaded.value = false;
  configPlugin.value = null;
  uiSession.value = null;
  uiLoading.value = false;
  uiError.value = "";
}

function clearPendingBridgeRequests(): void {
  for (const timeout of pendingBridgeRequests.values()) window.clearTimeout(timeout);
  pendingBridgeRequests.clear();
}

function handlePluginFrameLoad(): void {
  // A load can also be caused by a plugin navigating its iframe. Drop all
  // outstanding responses so a late config response is never sent to the new document.
  if (pluginFrameLoaded.value) clearPendingBridgeRequests();
  pluginFrameLoaded.value = true;
  uiLoading.value = false;
}

function registerBridgeRequest(requestID: string): void {
  const timeout = window.setTimeout(() => {
    pendingBridgeRequests.delete(requestID);
  }, 30_000);
  pendingBridgeRequests.set(requestID, timeout);
}

function postBridgeResult(
  request: PluginBridgeMessage,
  payload: Record<string, unknown>,
): void {
  if (!pluginFrame.value?.contentWindow || !uiSession.value) return;
  const requestID = typeof request.request_id === "string" ? request.request_id.trim() : "";
  const timeout = pendingBridgeRequests.get(requestID);
  if (!requestID || timeout === undefined) return;
  window.clearTimeout(timeout);
  pendingBridgeRequests.delete(requestID);
  pluginFrame.value.contentWindow.postMessage(
    {
      source: "sub2api-plugin-host",
      bridge_token: uiSession.value.bridge_token,
      type: `${request.type}.result`,
      request_id: requestID,
      ...payload,
    },
    // The sandboxed iframe has an opaque origin, so no fixed target origin exists.
    // Pending request tracking plus load invalidation prevents cross-navigation leaks.
    "*",
  );
}

async function handleBridgeMessage(event: MessageEvent): Promise<void> {
  if (
    !uiSession.value ||
    !configPlugin.value ||
    event.source !== pluginFrame.value?.contentWindow ||
    event.origin !== "null"
  )
    return;
  const message = event.data as PluginBridgeMessage;
  if (
    !message ||
    message.source !== "sub2api-plugin-ui" ||
    message.bridge_token !== uiSession.value.bridge_token
  )
    return;

  const requestID = typeof message.request_id === "string" ? message.request_id.trim() : "";
  const expectsResponse =
    message.type === "config.load" ||
    message.type === "config.save" ||
    message.type === "config.test";
  if (expectsResponse) {
    if (!requestID || pendingBridgeRequests.has(requestID)) return;
    registerBridgeRequest(requestID);
  }

  try {
    switch (message.type) {
      case "sub2api.plugin.ready":
        uiLoading.value = false;
        break;
      case "config.load": {
        const config = await adminAPI.plugins.getConfig(configPlugin.value.id);
        postBridgeResult(message, { ok: true, config });
        break;
      }
      case "config.save": {
        if (
          !message.config ||
          typeof message.config !== "object" ||
          Array.isArray(message.config)
        ) {
          throw new Error(t("admin.plugins.bridgeRejected"));
        }
        const config = await pluginStepUp.run(() =>
          adminAPI.plugins.saveConfig(
            configPlugin.value!.id,
            message.config as Record<string, unknown>,
          ),
        );
        postBridgeResult(message, { ok: true, config });
        appStore.showSuccess(t("common.saved"));
        break;
      }
      case "config.test": {
        const result = await pluginStepUp.run(() =>
          adminAPI.plugins.test(configPlugin.value!.id),
        );
        postBridgeResult(message, { ok: result.success, result });
        if (result.success)
          appStore.showSuccess(
            result.message || t("admin.plugins.testSuccess"),
          );
        else appStore.showError(result.message || t("common.error"));
        break;
      }
      case "ui.resize": {
        const height = Number(message.height);
        if (Number.isFinite(height))
          iframeHeight.value = Math.min(960, Math.max(520, Math.round(height)));
        break;
      }
      case "ui.notify": {
        const text =
          typeof message.message === "string"
            ? message.message.slice(0, 500)
            : "";
        if (!text) break;
        if (message.level === "error") appStore.showError(text);
        else if (message.level === "success") appStore.showSuccess(text);
        else appStore.showInfo(text);
        break;
      }
    }
  } catch (error: unknown) {
    if (isStepUpBlocked(error)) reportSensitiveActionError(error);
    postBridgeResult(message, {
      ok: false,
      error: isStepUpCancelled(error) ? t("common.cancel") : errorMessage(error),
    });
  }
}

function stateClass(state: PluginInstallation["state"]): string {
  if (state === "enabled") return "badge-success";
  if (state === "error" || state === "incompatible") return "badge-danger";
  if (state === "starting") return "badge-warning";
  return "badge-gray";
}

function compatibilityClass(
  status: PluginInstallation["compatibility"]["status"],
): string {
  if (status === "compatible") return "badge-success";
  if (status === "untested") return "badge-warning";
  return "badge-danger";
}

onMounted(() => {
  window.addEventListener("message", handleBridgeMessage);
  void loadPlugins();
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleBridgeMessage);
  clearPendingBridgeRequests();
});
</script>
