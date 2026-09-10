// 由 GroupsView.vue 的 <script setup> 纯移动而来（openspec: rebuild-frontend-design-system Phase 3）。
// 所有状态、计算属性与方法在此定义，通过 provide/inject 供各 Tab 组件使用。
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { adminAPI } from "@/api/admin";
import type {
  AdminGroup,
  CodexModelsManifestConfig,
  CompositeModelRoute,
  CompositeModelRouteInput,
  CompositeRouteDecision,
  CompositeRouteEndpoint,
  CompositeRouteMatchType,
  GroupPlatform,
  SubscriptionType,
} from "@/types";
import {
  CONCRETE_PLATFORM_OPTIONS,
  GROUP_PLATFORM_OPTIONS,
} from "@/constants/platforms";
import type { Column } from "@/components/common/types";
import type { PricingFormEntry } from "@/components/admin/channel/types";
import {
  apiIntervalsToForm,
  createDefaultTimePricingForm,
  formIntervalsToAPI,
  mTokToPerToken,
  perTokenToMTok,
  toNullableNumber,
} from "@/components/admin/channel/types";
import type { ChannelModelPricing } from "@/api/admin/channels";
import { createStableObjectKeyResolver } from "@/utils/stableObjectKey";
import { extractApiErrorMessage } from "@/utils/apiError";
import { useKeyedDebouncedSearch } from "@/composables/useKeyedDebouncedSearch";
import { getPersistedPageSize } from "@/composables/usePersistedPageSize";
import {
  createDefaultMessagesDispatchFormState,
  messagesDispatchConfigToFormState,
  messagesDispatchFormStateToConfig,
  resetMessagesDispatchFormState,
  supportsMessagesDispatchPlatform,
  type MessagesDispatchMappingRow,
} from "../groupsMessagesDispatch";
import {
  normalizeGroupOpenAIFast,
  supportsGroupOpenAIFast,
} from "../groupsOpenAIFast";
import {
  addCustomModelAllowlistItem,
  buildModelAllowlistConfig,
  createModelAllowlistState as createInitialModelAllowlistState,
  invertModelAllowlistSelection,
  moveModelAllowlistItem,
  selectAllModelAllowlistItems,
  setModelAllowlistCandidates,
} from "../groupModelAllowlist";
import { createModelAllowlistCandidatesTracker } from "../modelAllowlistCandidates";
import { normalizeSupportedModelScopesForPlatform } from "../groupsSupportedModelScopes";
import {
  isProfitControlPlatform,
  profitPercentToDecimal,
  profitDecimalToPercent,
  validateProfitControlFormState,
  type ProfitControlFormState,
} from "../groupsProfitControl";
import {
  normalizeReasoningEffortForPlatform,
  normalizeReasoningEffortOverLimit,
  reasoningEffortMappingsToAPI,
  reasoningEffortMappingsToRows,
  reasoningEffortOverLimitDowngrade,
  supportsReasoningEffortPolicyPlatform,
  type ReasoningEffortMappingRow,
} from "../groupsReasoningEffort";
import {
  getDefaultImagePreviewPrice,
  getDefaultVideoPreviewPrice,
  getImagePricePlaceholder,
  getVideoPricePlaceholder,
  imagePricingI18nKey,
  supportsImagePricingPlatform,
  supportsVideoPricingPlatform,
  videoPricingI18nKey,
} from "../groupsImagePricing";
import {
  createVideoModelPricesForm,
  grokVideoPriceResolutions,
  serializeVideoModelPrices,
  videoModelPriceFamilyRows,
} from "../groupsVideoModelPricing";

export type GroupUsageSummary = {
  today_cost: number;
  yesterday_cost: number;
  total_cost: number;
};

export type ConcreteGroupPlatform = Exclude<GroupPlatform, "composite">;

export type CompositeRouteFormState = {
  public_model: string;
  match_type: CompositeRouteMatchType;
  target_platform: ConcreteGroupPlatform;
  upstream_model: string;
  endpoint: CompositeRouteEndpoint;
  priority: number;
  enabled: boolean;
  notes: string;
};

export type ReasoningEffortPolicyFieldsExpose = {
  validate: () => boolean;
  resetValidation: () => void;
};

export type CodexManifestAccountsFieldExpose = {
  validate: () => boolean;
  resetValidation: () => void;
};

export interface SimpleAccount {
  id: number;
  name: string;
}

export interface ModelRoutingRule {
  pattern: string;
  accounts: SimpleAccount[]; // 选中的账号对象数组
}

export type ImagePricingFormState = {
  platform: GroupPlatform;
  allow_image_generation: boolean;
  allow_batch_image_generation: boolean;
  rate_multiplier: number;
  image_rate_independent: boolean;
  image_rate_multiplier: number;
  batch_image_discount_multiplier: number;
  batch_image_hold_multiplier: number;
  image_price_1k: number | string | null;
  image_price_2k: number | string | null;
  image_price_4k: number | string | null;
  peak_rate_enabled: boolean;
  peak_start: string;
  peak_end: string;
  peak_rate_multiplier: number;
};

export type VideoPricingFormState = {
  platform: GroupPlatform;
  rate_multiplier: number;
  video_rate_independent: boolean;
  video_rate_multiplier: number;
  video_price_480p: number | string | null;
  video_price_720p: number | string | null;
  video_price_1080p: number | string | null;
};

export function useGroupsView() {

  const supportsLivePlatform = (platform: string): boolean =>
    platform === "openai" || platform === "composite";

  const emptyGroupPricing = (): PricingFormEntry => ({
    models: [],
    billing_mode: "token",
    input_price: null,
    output_price: null,
    cache_write_price: null,
    cache_write_1h_price: null,
    cache_read_price: null,
    image_input_price: null,
    image_output_price: null,
    per_request_price: null,
    intervals: [],
    time_pricing: createDefaultTimePricingForm(),
  });

  const addGroupPricing = (entries: PricingFormEntry[]) =>
    entries.push(emptyGroupPricing());

  const groupPricingFromAPI = (
    pricing: ChannelModelPricing[] | undefined,
  ): PricingFormEntry[] =>
    (pricing || []).map((entry) => ({
      models: entry.models || [],
      billing_mode: entry.billing_mode || "token",
      input_price: perTokenToMTok(entry.input_price),
      output_price: perTokenToMTok(entry.output_price),
      cache_write_price: perTokenToMTok(entry.cache_write_price),
      cache_write_1h_price: perTokenToMTok(entry.cache_write_1h_price),
      cache_read_price: perTokenToMTok(entry.cache_read_price),
      image_input_price: perTokenToMTok(entry.image_input_price),
      image_output_price: perTokenToMTok(entry.image_output_price),
      per_request_price: entry.per_request_price,
      intervals: apiIntervalsToForm(entry.intervals || []),
      time_pricing: createDefaultTimePricingForm(),
    }));

  const groupPricingToAPI = (
    pricing: PricingFormEntry[],
    platform: string,
  ): ChannelModelPricing[] =>
    pricing
      .filter((entry) => entry.models.length > 0)
      .map((entry) => ({
        platform,
        models: entry.models,
        billing_mode: entry.billing_mode,
        input_price: mTokToPerToken(entry.input_price),
        output_price: mTokToPerToken(entry.output_price),
        cache_write_price: mTokToPerToken(entry.cache_write_price),
        cache_write_1h_price: mTokToPerToken(entry.cache_write_1h_price),
        cache_read_price: mTokToPerToken(entry.cache_read_price),
        image_input_price: mTokToPerToken(entry.image_input_price),
        image_output_price: mTokToPerToken(entry.image_output_price),
        per_request_price: toNullableNumber(entry.per_request_price),
        intervals:
          entry.billing_mode === "token"
            ? []
            : formIntervalsToAPI(entry.intervals || []),
        time_pricing: null,
      }));

  const { t } = useI18n();
  const appStore = useAppStore();
  const authStore = useAuthStore();
  const onboardingStore = useOnboardingStore();

  const ALWAYS_VISIBLE_COLUMNS = new Set(["name", "actions"]);
  // Default hidden columns (hidden on first load / after schema bumps).
  const DEFAULT_HIDDEN_COLUMNS = ["id"];
  const HIDDEN_COLUMNS_KEY = "group-hidden-columns";
  // Bump when adding new default-hidden columns so existing admins pick them up once.
  const COLUMN_SETTINGS_VERSION_KEY = "group-column-settings-version";
  const COLUMN_SETTINGS_VERSION = 2;
  const VERSION_NEW_HIDDEN_COLUMNS: Record<number, string[]> = {
    2: ["id"],
  };

  const allColumns = computed<Column[]>(() => {
    const basic: Column[] = [
      { key: "name", label: t("admin.groups.columns.name"), sortable: true },
      { key: "id", label: t("admin.groups.columns.id"), sortable: true },
      { key: "platform", label: t("admin.groups.columns.platform"), sortable: true },
      { key: "account_count", label: t("admin.groups.columns.accounts"), sortable: true },
      { key: "status", label: t("admin.groups.columns.status"), sortable: true },
      { key: "actions", label: t("admin.groups.columns.actions"), sortable: false },
    ];
    if (authStore.isSimpleMode) return basic;
    return [
      ...basic.slice(0, 3),
      { key: "billing_type", label: t("admin.groups.columns.billingType"), sortable: true },
      { key: "rate_multiplier", label: t("admin.groups.columns.rateMultiplier"), sortable: true },
      { key: "is_exclusive", label: t("admin.groups.columns.type"), sortable: true },
      basic[3],
      { key: "capacity", label: t("admin.groups.columns.capacity"), sortable: false },
      { key: "usage", label: t("admin.groups.columns.usage"), sortable: false },
      ...basic.slice(4),
    ];
  });

  const toggleableColumns = computed(() =>
    allColumns.value.filter((col) => !ALWAYS_VISIBLE_COLUMNS.has(col.key)),
  );
  const hiddenColumns = reactive<Set<string>>(new Set());
  const showColumnDropdown = ref(false);
  const columnDropdownRef = ref<HTMLElement | null>(null);

  const getValidHiddenColumnKeys = () =>
    new Set(toggleableColumns.value.map((col) => col.key));

  const loadSavedColumns = () => {
    hiddenColumns.clear();
    try {
      const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY);
      const validKeys = getValidHiddenColumnKeys();

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed
            .filter(
              (key): key is string =>
                typeof key === "string" && validKeys.has(key),
            )
            .forEach((key) => hiddenColumns.add(key));
        }

        // Existing admins: auto-hide columns newly added as default-hidden.
        const storedVersion = Number(
          localStorage.getItem(COLUMN_SETTINGS_VERSION_KEY) ?? "1",
        );
        if (storedVersion < COLUMN_SETTINGS_VERSION) {
          let mutated = false;
          for (let v = storedVersion + 1; v <= COLUMN_SETTINGS_VERSION; v++) {
            for (const key of VERSION_NEW_HIDDEN_COLUMNS[v] ?? []) {
              if (validKeys.has(key) && !hiddenColumns.has(key)) {
                hiddenColumns.add(key);
                mutated = true;
              }
            }
          }
          if (mutated) {
            saveColumnsToStorage();
          } else {
            localStorage.setItem(
              COLUMN_SETTINGS_VERSION_KEY,
              String(COLUMN_SETTINGS_VERSION),
            );
          }
        }
      } else {
        DEFAULT_HIDDEN_COLUMNS.forEach((key) => {
          if (validKeys.has(key)) hiddenColumns.add(key);
        });
        saveColumnsToStorage();
      }
    } catch (error) {
      console.error("Failed to load group column settings:", error);
      DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key));
    }
  };

  const saveColumnsToStorage = () => {
    try {
      const validKeys = getValidHiddenColumnKeys();
      const keys = [...hiddenColumns].filter((key) => validKeys.has(key));
      localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(keys));
      localStorage.setItem(
        COLUMN_SETTINGS_VERSION_KEY,
        String(COLUMN_SETTINGS_VERSION),
      );
    } catch (error) {
      console.error("Failed to save group column settings:", error);
    }
  };

  const isColumnVisible = (key: string) => !hiddenColumns.has(key);
  const hasVisibleUsageSummaryConsumer = computed(
    () => !authStore.isSimpleMode && (isColumnVisible("usage") || isColumnVisible("billing_type")),
  );
  const hasVisibleCapacityColumn = computed(() => !authStore.isSimpleMode && isColumnVisible("capacity"));

  const toggleColumn = (key: string) => {
    const validKeys = getValidHiddenColumnKeys();
    if (!validKeys.has(key)) return;

    const wasHidden = hiddenColumns.has(key);
    if (wasHidden) {
      hiddenColumns.delete(key);
    } else {
      hiddenColumns.add(key);
    }
    saveColumnsToStorage();

    if (wasHidden && (key === "usage" || key === "billing_type")) {
      loadUsageSummary();
    }
    if (wasHidden && key === "capacity") {
      loadCapacitySummary();
    }
  };

  const columns = computed<Column[]>(() =>
    allColumns.value.filter(
      (col) => ALWAYS_VISIBLE_COLUMNS.has(col.key) || !hiddenColumns.has(col.key),
    ),
  );

  if (typeof window !== "undefined") {
    loadSavedColumns();
  }

  // Filter options
  const statusOptions = computed(() => [
    { value: "", label: t("admin.groups.allStatus") },
    { value: "active", label: t("admin.accounts.status.active") },
    { value: "inactive", label: t("admin.accounts.status.inactive") },
  ]);

  const exclusiveOptions = computed(() => [
    { value: "", label: t("admin.groups.allGroups") },
    { value: "true", label: t("admin.groups.exclusive") },
    { value: "false", label: t("admin.groups.nonExclusive") },
  ]);

  const platformOptions = computed(() =>
    GROUP_PLATFORM_OPTIONS.filter(
      (option) => !authStore.isSimpleMode || option.value !== "composite",
    ),
  );

  const platformFilterOptions = computed(() => [
    { value: "", label: t("admin.groups.allPlatforms") },
    ...GROUP_PLATFORM_OPTIONS,
  ]);

  const compositeRoutePlatformOptions = computed(() => [
    ...CONCRETE_PLATFORM_OPTIONS,
  ]);

  const compositeRouteEndpointOptions = computed(() => [
    { value: "any", label: t("admin.groups.compositeRoutes.endpoints.any") },
    {
      value: "messages",
      label: t("admin.groups.compositeRoutes.endpoints.messages"),
    },
    {
      value: "count_tokens",
      label: t("admin.groups.compositeRoutes.endpoints.countTokens"),
    },
    {
      value: "responses",
      label: t("admin.groups.compositeRoutes.endpoints.responses"),
    },
    {
      value: "chat_completions",
      label: t("admin.groups.compositeRoutes.endpoints.chatCompletions"),
    },
    {
      value: "embeddings",
      label: t("admin.groups.compositeRoutes.endpoints.embeddings"),
    },
    { value: "images", label: t("admin.groups.compositeRoutes.endpoints.images") },
    { value: "gemini", label: t("admin.groups.compositeRoutes.endpoints.gemini") },
  ]);

  const compositeRouteMatchOptions = computed(() => [
    { value: "exact", label: t("admin.groups.compositeRoutes.match.exact") },
    { value: "prefix", label: t("admin.groups.compositeRoutes.match.prefix") },
  ]);

  const editStatusOptions = computed(() => [
    { value: "active", label: t("admin.accounts.status.active") },
    { value: "inactive", label: t("admin.accounts.status.inactive") },
  ]);

  const subscriptionTypeOptions = computed(() => [
    { value: "standard", label: t("admin.groups.subscription.standard") },
    { value: "subscription", label: t("admin.groups.subscription.subscription") },
  ]);

  // 降级分组选项（创建时）- 仅包含 anthropic 平台且未启用 claude_code_only 的分组
  const fallbackGroupOptions = computed(() => {
    const options: { value: number | null; label: string }[] = [
      { value: null, label: t("admin.groups.claudeCode.noFallback") },
    ];
    const eligibleGroups = groups.value.filter(
      (g) =>
        g.platform === "anthropic" &&
        !g.claude_code_only &&
        g.status === "active",
    );
    eligibleGroups.forEach((g) => {
      options.push({ value: g.id, label: g.name });
    });
    return options;
  });

  // 降级分组选项（编辑时）- 排除自身
  const fallbackGroupOptionsForEdit = computed(() => {
    const options: { value: number | null; label: string }[] = [
      { value: null, label: t("admin.groups.claudeCode.noFallback") },
    ];
    const currentId = editingGroup.value?.id;
    const eligibleGroups = groups.value.filter(
      (g) =>
        g.platform === "anthropic" &&
        !g.claude_code_only &&
        g.status === "active" &&
        g.id !== currentId,
    );
    eligibleGroups.forEach((g) => {
      options.push({ value: g.id, label: g.name });
    });
    return options;
  });

  // 无效请求兜底分组选项（创建时）- 仅包含 anthropic 平台、非订阅且未配置兜底的分组
  const invalidRequestFallbackOptions = computed(() => {
    const options: { value: number | null; label: string }[] = [
      { value: null, label: t("admin.groups.invalidRequestFallback.noFallback") },
    ];
    const eligibleGroups = groups.value.filter(
      (g) =>
        g.platform === "anthropic" &&
        g.status === "active" &&
        g.subscription_type !== "subscription" &&
        g.fallback_group_id_on_invalid_request === null,
    );
    eligibleGroups.forEach((g) => {
      options.push({ value: g.id, label: g.name });
    });
    return options;
  });

  // 无效请求兜底分组选项（编辑时）- 排除自身
  const invalidRequestFallbackOptionsForEdit = computed(() => {
    const options: { value: number | null; label: string }[] = [
      { value: null, label: t("admin.groups.invalidRequestFallback.noFallback") },
    ];
    const currentId = editingGroup.value?.id;
    const eligibleGroups = groups.value.filter(
      (g) =>
        g.platform === "anthropic" &&
        g.status === "active" &&
        g.subscription_type !== "subscription" &&
        g.fallback_group_id_on_invalid_request === null &&
        g.id !== currentId,
    );
    eligibleGroups.forEach((g) => {
      options.push({ value: g.id, label: g.name });
    });
    return options;
  });

  const canCopyAccountsFromGroup = (targetPlatform: GroupPlatform, sourcePlatform: GroupPlatform) =>
    targetPlatform === "composite" || sourcePlatform === targetPlatform;

  const copyAccountsGroupLabel = (g: AdminGroup) => {
    const count = g.account_count || 0;
    const platform = t("admin.groups.platforms." + g.platform);
    return `${g.name} - ${platform} (${t("admin.groups.accountsCount", { count })})`;
  };

  // 复制账号的源分组选项（创建时）- 相同平台；composite 分组可汇总各平台账号
  const copyAccountsGroupOptions = computed(() => {
    const eligibleGroups = groups.value.filter(
      (g) =>
        canCopyAccountsFromGroup(createForm.platform, g.platform) &&
        (g.account_count || 0) > 0,
    );
    return eligibleGroups.map((g) => ({
      value: g.id,
      label: copyAccountsGroupLabel(g),
    }));
  });

  // 复制账号的源分组选项（编辑时）- 相同平台；composite 分组可汇总各平台账号，排除自身
  const copyAccountsGroupOptionsForEdit = computed(() => {
    const currentId = editingGroup.value?.id;
    const eligibleGroups = groups.value.filter(
      (g) =>
        canCopyAccountsFromGroup(editForm.platform, g.platform) &&
        (g.account_count || 0) > 0 &&
        g.id !== currentId,
    );
    return eligibleGroups.map((g) => ({
      value: g.id,
      label: copyAccountsGroupLabel(g),
    }));
  });

  const groups = ref<AdminGroup[]>([]);
  const loading = ref(false);

  const usageMap = ref<Map<number, GroupUsageSummary>>(new Map());
  const usageLoading = ref(false);
  const capacityMap = ref<
    Map<
      number,
      {
        concurrencyUsed: number;
        concurrencyMax: number;
        sessionsUsed: number;
        sessionsMax: number;
        rpmUsed: number;
        rpmMax: number;
      }
    >
  >(new Map());
  const searchQuery = ref("");
  const filters = reactive({
    platform: "",
    status: "",
    is_exclusive: "",
  });
  const pagination = reactive({
    page: 1,
    page_size: getPersistedPageSize(),
    total: 0,
    pages: 0,
  });
  const sortState = reactive({
    sort_by: "sort_order",
    sort_order: "asc" as "asc" | "desc",
  });

  let abortController: AbortController | null = null;

  const showCreateModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteDialog = ref(false);
  const pendingLiveForm = ref<"create" | "edit" | null>(null);
  const showUnsupportedLiveConfirm = computed(
    () => pendingLiveForm.value !== null,
  );
  const liveCapability = ref<{ supported: boolean; reason?: string } | null>(null);
  let liveCapabilityRequest: Promise<{
    supported: boolean;
    reason?: string;
  }> | null = null;
  const showSortModal = ref(false);
  const submitting = ref(false);
  const sortSubmitting = ref(false);
  const editingGroup = ref<AdminGroup | null>(null);
  const deletingGroup = ref<AdminGroup | null>(null);
  const duplicatingGroupIds = reactive(new Set<number>());
  const showRateMultipliersModal = ref(false);
  const rateMultipliersGroup = ref<AdminGroup | null>(null);
  const showRPMOverridesModal = ref(false);
  const rpmOverridesGroup = ref<AdminGroup | null>(null);
  const sortableGroups = ref<AdminGroup[]>([]);

  const showCompositeRoutesModal = ref(false);
  const compositeRoutesGroup = ref<AdminGroup | null>(null);
  const compositeRoutes = ref<CompositeModelRoute[]>([]);
  const compositeRoutesLoading = ref(false);
  const compositeRouteSaving = ref(false);
  const compositeRouteEditingId = ref<number | null>(null);
  const compositePreviewModel = ref("");
  const compositePreviewEndpoint = ref<CompositeRouteEndpoint>("any");
  const compositePreviewLoading = ref(false);
  const compositePreviewDecision = ref<CompositeRouteDecision | null>(null);
  const compositeRouteForm = reactive<CompositeRouteFormState>({
    public_model: "",
    match_type: "exact",
    target_platform: "openai",
    upstream_model: "",
    endpoint: "any",
    priority: 100,
    enabled: true,
    notes: "",
  });
  const createMessagesDispatchDefaults = createDefaultMessagesDispatchFormState();
  const editMessagesDispatchDefaults = createDefaultMessagesDispatchFormState();
  const createModelAllowlistState = reactive(createInitialModelAllowlistState());
  const editModelAllowlistState = reactive(createInitialModelAllowlistState());
  const createModelAllowlistLoading = ref(false);
  const editModelAllowlistLoading = ref(false);
  const createReasoningEffortPolicyRef = ref<ReasoningEffortPolicyFieldsExpose | null>(null);
  const editReasoningEffortPolicyRef = ref<ReasoningEffortPolicyFieldsExpose | null>(null);

  // 固定账号获取 Codex Model Manifest（仅 openai 分组编辑对话框）
  const editCodexManifestRef = ref<CodexManifestAccountsFieldExpose | null>(null);
  const createCodexManifestDefaults = (): CodexModelsManifestConfig => ({
    enabled: false,
    account_ids: [],
    fallback_to_scheduler: false,
  });
  const editCodexManifestConfig = ref<CodexModelsManifestConfig>(createCodexManifestDefaults());
  const editCodexManifestAccountNames = ref<Record<number, string>>({});
  const modelAllowlistCandidatesTracker = createModelAllowlistCandidatesTracker();
  const createModelAllowlistSelectedCount = computed(
    () => createModelAllowlistState.items.filter((item) => item.selected).length,
  );
  const editModelAllowlistSelectedCount = computed(
    () => editModelAllowlistState.items.filter((item) => item.selected).length,
  );
  const createAllowlistCustomEntry = ref("");
  const editAllowlistCustomEntry = ref("");
  const createAllowlistCustomErrorKey = ref<string | null>(null);
  const editAllowlistCustomErrorKey = ref<string | null>(null);
  const submitCreateAllowlistCustomEntry = () => {
    const error = addCustomModelAllowlistItem(
      createModelAllowlistState,
      createAllowlistCustomEntry.value,
    );
    if (error === null) {
      createAllowlistCustomEntry.value = "";
      createAllowlistCustomErrorKey.value = null;
    } else {
      createAllowlistCustomErrorKey.value = `admin.groups.modelAllowlist.errors.${error}`;
    }
  };
  const submitEditAllowlistCustomEntry = () => {
    const error = addCustomModelAllowlistItem(
      editModelAllowlistState,
      editAllowlistCustomEntry.value,
    );
    if (error === null) {
      editAllowlistCustomEntry.value = "";
      editAllowlistCustomErrorKey.value = null;
    } else {
      editAllowlistCustomErrorKey.value = `admin.groups.modelAllowlist.errors.${error}`;
    }
  };

  const createForm = reactive({
    name: "",
    description: "",
    platform: "anthropic" as GroupPlatform,
    rate_multiplier: 1.0,
    is_exclusive: false,
    subscription_type: "standard" as SubscriptionType,
    daily_limit_usd: null as number | null,
    weekly_limit_usd: null as number | null,
    monthly_limit_usd: null as number | null,
    long_context_pricing_enabled: true,
    force_openai_fast: false,
    free_openai_fast: false,
    disable_openai_fast: false,
    force_openai_ultrafast: false,
    model_pricing: [] as PricingFormEntry[],
    // 图片生成计费配置
    allow_image_generation: false,
    allow_batch_image_generation: false,
    image_rate_independent: false,
    image_rate_multiplier: 1,
    batch_image_discount_multiplier: 0.5,
    batch_image_hold_multiplier: 0.6,
    image_price_1k: null as number | null,
    image_price_2k: null as number | null,
    image_price_4k: null as number | null,
    // 视频生成计费配置（仅 Grok 平台）
    video_rate_independent: false,
    video_rate_multiplier: 1,
    video_price_480p: null as number | null,
    video_price_720p: null as number | null,
    video_price_1080p: null as number | null,
    video_model_prices: createVideoModelPricesForm(),
    // Codex 网页搜索按次计费（仅 openai 平台使用）；null = 使用默认价 0.01
    web_search_price_per_call: null as number | null,
    search_price_per_1k: null as number | null,
    audio_realtime_price_per_min: null as number | null,
    audio_tts_price_per_million_chars: null as number | null,
    audio_stt_price_per_hour: null as number | null,
    // 高峰时段倍率配置
    peak_rate_enabled: false,
    peak_start: "",
    peak_end: "",
    peak_rate_multiplier: 1.0,
    // 分组利润控制（五个 token 平台）；界面按百分比输入，提交时转小数
    profit_control_enabled: false,
    profit_min_margin_percent: 0,
    profit_safety_buffer_percent: 0,
    // Claude Code 客户端限制（仅 anthropic 平台使用）
    claude_code_only: false,
    fallback_group_id: null as number | null,
    fallback_group_id_on_invalid_request: null as number | null,
    // OpenAI Messages 调度配置（仅 openai 平台使用）
    allow_messages_dispatch: false,
    allow_live: false,
    opus_mapped_model: createMessagesDispatchDefaults.opus_mapped_model,
    sonnet_mapped_model: createMessagesDispatchDefaults.sonnet_mapped_model,
    haiku_mapped_model: createMessagesDispatchDefaults.haiku_mapped_model,
    exact_model_mappings: [] as MessagesDispatchMappingRow[],
    // 账号过滤控制（OpenAI/Antigravity 平台）
    require_oauth_only: false,
    require_privacy_set: false,
    // 模型路由开关
    model_routing_enabled: false,
    // 支持的模型系列（仅 antigravity 平台）
    supported_model_scopes: ["claude", "gemini_text", "gemini_image"] as string[],
    // MCP XML 协议注入开关（仅 antigravity 平台）
    mcp_xml_inject: true,
    // 从分组复制账号
    copy_accounts_from_group_ids: [] as number[],
    // 分组级 RPM 限制（每用户每分钟最大请求数；0 = 不限制）
    rpm_limit: 0 as number,
    // 分组级并发限制（每用户最大并发请求数；0 = 回退到用户级 concurrency）
    concurrency: 0 as number,
    max_reasoning_effort: "",
    max_reasoning_effort_over_limit: reasoningEffortOverLimitDowngrade,
    reasoning_effort_mappings: [] as ReasoningEffortMappingRow[],
  });

  // 简单账号类型（用于模型路由选择）

  // 模型路由规则类型

  // 创建表单的模型路由规则
  const createModelRoutingRules = ref<ModelRoutingRule[]>([]);

  // 编辑表单的模型路由规则
  const editModelRoutingRules = ref<ModelRoutingRule[]>([]);

  // 规则对象稳定 key（避免使用 index 导致状态错位）
  const resolveCreateRuleKey =
    createStableObjectKeyResolver<ModelRoutingRule>("create-rule");
  const resolveEditRuleKey =
    createStableObjectKeyResolver<ModelRoutingRule>("edit-rule");
  const resolveCreateMessagesDispatchRowKey =
    createStableObjectKeyResolver<MessagesDispatchMappingRow>(
      "create-messages-dispatch-row",
    );
  const resolveEditMessagesDispatchRowKey =
    createStableObjectKeyResolver<MessagesDispatchMappingRow>(
      "edit-messages-dispatch-row",
    );

  const getCreateRuleRenderKey = (rule: ModelRoutingRule) =>
    resolveCreateRuleKey(rule);
  const getEditRuleRenderKey = (rule: ModelRoutingRule) =>
    resolveEditRuleKey(rule);
  const getCreateMessagesDispatchRowKey = (row: MessagesDispatchMappingRow) =>
    resolveCreateMessagesDispatchRowKey(row);
  const getEditMessagesDispatchRowKey = (row: MessagesDispatchMappingRow) =>
    resolveEditMessagesDispatchRowKey(row);

  const getCreateRuleSearchKey = (rule: ModelRoutingRule) =>
    `create-${resolveCreateRuleKey(rule)}`;
  const getEditRuleSearchKey = (rule: ModelRoutingRule) =>
    `edit-${resolveEditRuleKey(rule)}`;

  const getRuleSearchKey = (rule: ModelRoutingRule, isEdit: boolean = false) => {
    return isEdit ? getEditRuleSearchKey(rule) : getCreateRuleSearchKey(rule);
  };

  // 账号搜索相关状态
  const accountSearchKeyword = ref<Record<string, string>>({});
  const accountSearchResults = ref<Record<string, SimpleAccount[]>>({});
  const showAccountDropdown = ref<Record<string, boolean>>({});

  const clearAccountSearchStateByKey = (key: string) => {
    delete accountSearchKeyword.value[key];
    delete accountSearchResults.value[key];
    delete showAccountDropdown.value[key];
  };

  const clearAllAccountSearchState = () => {
    accountSearchKeyword.value = {};
    accountSearchResults.value = {};
    showAccountDropdown.value = {};
  };

  const accountSearchRunner = useKeyedDebouncedSearch<SimpleAccount[]>({
    delay: 300,
    search: async (keyword, { signal }) => {
      const res = await adminAPI.accounts.list(
        1,
        20,
        {
          search: keyword,
          platform: "anthropic",
        },
        { signal },
      );
      return res.items.map((account) => ({ id: account.id, name: account.name }));
    },
    onSuccess: (key, result) => {
      accountSearchResults.value[key] = result;
    },
    onError: (key) => {
      accountSearchResults.value[key] = [];
    },
  });

  // 搜索账号（仅限 anthropic 平台）
  const searchAccounts = (key: string) => {
    accountSearchRunner.trigger(key, accountSearchKeyword.value[key] || "");
  };

  const searchAccountsByRule = (
    rule: ModelRoutingRule,
    isEdit: boolean = false,
  ) => {
    searchAccounts(getRuleSearchKey(rule, isEdit));
  };

  // 选择账号
  const selectAccount = (
    rule: ModelRoutingRule,
    account: SimpleAccount,
    isEdit: boolean = false,
  ) => {
    if (!rule) return;

    // 检查是否已选择
    if (!rule.accounts.some((a) => a.id === account.id)) {
      rule.accounts.push(account);
    }

    // 清空搜索
    const key = getRuleSearchKey(rule, isEdit);
    accountSearchKeyword.value[key] = "";
    showAccountDropdown.value[key] = false;
  };

  // 移除已选账号
  const removeSelectedAccount = (
    rule: ModelRoutingRule,
    accountId: number,
    _isEdit: boolean = false,
  ) => {
    if (!rule) return;

    rule.accounts = rule.accounts.filter((a) => a.id !== accountId);
  };

  // 切换创建表单的模型系列选择
  const toggleCreateScope = (scope: string) => {
    const idx = createForm.supported_model_scopes.indexOf(scope);
    if (idx === -1) {
      createForm.supported_model_scopes.push(scope);
    } else {
      createForm.supported_model_scopes.splice(idx, 1);
    }
  };

  // 切换编辑表单的模型系列选择
  const toggleEditScope = (scope: string) => {
    const idx = editForm.supported_model_scopes.indexOf(scope);
    if (idx === -1) {
      editForm.supported_model_scopes.push(scope);
    } else {
      editForm.supported_model_scopes.splice(idx, 1);
    }
  };

  // 处理账号搜索输入框聚焦
  const onAccountSearchFocus = (
    rule: ModelRoutingRule,
    isEdit: boolean = false,
  ) => {
    const key = getRuleSearchKey(rule, isEdit);
    showAccountDropdown.value[key] = true;
    // 如果没有搜索结果，触发一次搜索
    if (!accountSearchResults.value[key]?.length) {
      searchAccounts(key);
    }
  };

  // 添加创建表单的路由规则
  const addCreateRoutingRule = () => {
    createModelRoutingRules.value.push({ pattern: "", accounts: [] });
  };

  // 删除创建表单的路由规则
  const removeCreateRoutingRule = (rule: ModelRoutingRule) => {
    const index = createModelRoutingRules.value.indexOf(rule);
    if (index === -1) return;

    const key = getCreateRuleSearchKey(rule);
    accountSearchRunner.clearKey(key);
    clearAccountSearchStateByKey(key);
    createModelRoutingRules.value.splice(index, 1);
  };

  // 添加编辑表单的路由规则
  const addEditRoutingRule = () => {
    editModelRoutingRules.value.push({ pattern: "", accounts: [] });
  };

  // 删除编辑表单的路由规则
  const removeEditRoutingRule = (rule: ModelRoutingRule) => {
    const index = editModelRoutingRules.value.indexOf(rule);
    if (index === -1) return;

    const key = getEditRuleSearchKey(rule);
    accountSearchRunner.clearKey(key);
    clearAccountSearchStateByKey(key);
    editModelRoutingRules.value.splice(index, 1);
  };

  const resetModelAllowlistState = (
    state: typeof createModelAllowlistState,
    config?: Parameters<typeof createInitialModelAllowlistState>[0],
  ) => {
    const fresh = createInitialModelAllowlistState(config);
    state.enabled = fresh.enabled;
    state.savedModels = fresh.savedModels;
    state.items = fresh.items;
  };

  const loadModelAllowlistCandidates = async (
    mode: "create" | "edit",
    groupID: number,
    platform: GroupPlatform,
  ) => {
    if (authStore.isSimpleMode) return;
    const request = { mode, groupID, platform };
    const requestID = modelAllowlistCandidatesTracker.next(request);
    const state = mode === "create" ? createModelAllowlistState : editModelAllowlistState;
    const loadingRef = mode === "create" ? createModelAllowlistLoading : editModelAllowlistLoading;
    loadingRef.value = true;
    try {
      const models = await adminAPI.groups.getModelAllowlistCandidates(groupID, platform);
      if (!modelAllowlistCandidatesTracker.isCurrent(requestID, request)) {
        return;
      }
      setModelAllowlistCandidates(state, models);
    } catch (error) {
      if (!modelAllowlistCandidatesTracker.isCurrent(requestID, request)) {
        return;
      }
      console.error("Error loading group models list candidates:", error);
    } finally {
      if (modelAllowlistCandidatesTracker.isCurrent(requestID, request)) {
        loadingRef.value = false;
      }
    }
  };

  const moveCreateModelAllowlistItem = (fromIndex: number, toIndex: number) => {
    moveModelAllowlistItem(createModelAllowlistState, fromIndex, toIndex);
  };

  const moveEditModelAllowlistItem = (fromIndex: number, toIndex: number) => {
    moveModelAllowlistItem(editModelAllowlistState, fromIndex, toIndex);
  };

  // 将 UI 格式的路由规则转换为 API 格式
  const convertRoutingRulesToApiFormat = (
    rules: ModelRoutingRule[],
  ): Record<string, number[]> | null => {
    const result: Record<string, number[]> = {};
    let hasValidRules = false;

    for (const rule of rules) {
      const pattern = rule.pattern.trim();
      if (!pattern) continue;

      const accountIds = rule.accounts.map((a) => a.id).filter((id) => id > 0);

      if (accountIds.length > 0) {
        result[pattern] = accountIds;
        hasValidRules = true;
      }
    }

    return hasValidRules ? result : null;
  };

  // 将 API 格式的路由规则转换为 UI 格式（需要加载账号名称）
  const convertApiFormatToRoutingRules = async (
    apiFormat: Record<string, number[]> | null,
  ): Promise<ModelRoutingRule[]> => {
    if (!apiFormat) return [];

    const rules: ModelRoutingRule[] = [];
    for (const [pattern, accountIds] of Object.entries(apiFormat)) {
      // 加载账号信息
      const accounts: SimpleAccount[] = [];
      for (const id of accountIds) {
        try {
          const account = await adminAPI.accounts.getById(id);
          accounts.push({ id: account.id, name: account.name });
        } catch {
          // 如果账号不存在，仍然显示 ID
          accounts.push({ id, name: `#${id}` });
        }
      }
      rules.push({ pattern, accounts });
    }
    return rules;
  };

  const editForm = reactive({
    name: "",
    description: "",
    platform: "anthropic" as GroupPlatform,
    rate_multiplier: 1.0,
    is_exclusive: false,
    status: "active" as "active" | "inactive",
    subscription_type: "standard" as SubscriptionType,
    daily_limit_usd: null as number | null,
    weekly_limit_usd: null as number | null,
    monthly_limit_usd: null as number | null,
    long_context_pricing_enabled: true,
    force_openai_fast: false,
    free_openai_fast: false,
    disable_openai_fast: false,
    force_openai_ultrafast: false,
    model_pricing: [] as PricingFormEntry[],
    // 图片生成计费配置
    allow_image_generation: false,
    allow_batch_image_generation: false,
    image_rate_independent: false,
    image_rate_multiplier: 1,
    batch_image_discount_multiplier: 0.5,
    batch_image_hold_multiplier: 0.6,
    image_price_1k: null as number | null,
    image_price_2k: null as number | null,
    image_price_4k: null as number | null,
    // 视频生成计费配置（仅 Grok 平台）
    video_rate_independent: false,
    video_rate_multiplier: 1,
    video_price_480p: null as number | null,
    video_price_720p: null as number | null,
    video_price_1080p: null as number | null,
    video_model_prices: createVideoModelPricesForm(),
    // Codex 网页搜索按次计费（仅 openai 平台使用）；null = 使用默认价 0.01
    web_search_price_per_call: null as number | null,
    search_price_per_1k: null as number | null,
    audio_realtime_price_per_min: null as number | null,
    audio_tts_price_per_million_chars: null as number | null,
    audio_stt_price_per_hour: null as number | null,
    // 高峰时段倍率配置
    peak_rate_enabled: false,
    peak_start: "",
    peak_end: "",
    peak_rate_multiplier: 1.0,
    // 分组利润控制（五个 token 平台）；界面按百分比输入，提交时转小数
    profit_control_enabled: false,
    profit_min_margin_percent: 0,
    profit_safety_buffer_percent: 0,
    // Claude Code 客户端限制（仅 anthropic 平台使用）
    claude_code_only: false,
    fallback_group_id: null as number | null,
    fallback_group_id_on_invalid_request: null as number | null,
    // OpenAI Messages 调度配置（仅 openai 平台使用）
    allow_messages_dispatch: false,
    allow_live: false,
    default_mapped_model: '',
    opus_mapped_model: editMessagesDispatchDefaults.opus_mapped_model,
    sonnet_mapped_model: editMessagesDispatchDefaults.sonnet_mapped_model,
    haiku_mapped_model: editMessagesDispatchDefaults.haiku_mapped_model,
    exact_model_mappings: [] as MessagesDispatchMappingRow[],
    // 账号过滤控制（OpenAI/Antigravity 平台）
    require_oauth_only: false,
    require_privacy_set: false,
    // 模型路由开关
    model_routing_enabled: false,
    // 支持的模型系列（仅 antigravity 平台）
    supported_model_scopes: ["claude", "gemini_text", "gemini_image"] as string[],
    // MCP XML 协议注入开关（仅 antigravity 平台）
    mcp_xml_inject: true,
    // 从分组复制账号
    copy_accounts_from_group_ids: [] as number[],
    // 分组级 RPM 限制（每用户每分钟最大请求数；0 = 不限制）
    rpm_limit: 0 as number,
    // 分组级并发限制（每用户最大并发请求数；0 = 回退到用户级 concurrency）
    concurrency: 0 as number,
    max_reasoning_effort: "",
    max_reasoning_effort_over_limit: reasoningEffortOverLimitDowngrade,
    reasoning_effort_mappings: [] as ReasoningEffortMappingRow[],
  });



  const imagePricingTiers = [
    { key: "image_price_1k", label: "1K" },
    { key: "image_price_2k", label: "2K" },
    { key: "image_price_4k", label: "4K" },
  ] as const;

  const videoPricingTiers = [
    { key: "video_price_480p", label: "480p" },
    { key: "video_price_720p", label: "720p" },
    { key: "video_price_1080p", label: "1080p" },
  ] as const;

  const normalizePreviewNumber = (value: number | string | null | undefined, fallback = 0) => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parsePreviewPrice = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const formatImagePricePreview = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return t("admin.groups.imagePricing.notConfigured");
    }
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) {
      return t("admin.groups.imagePricing.notConfigured");
    }
    return `$${price.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  };

  const formatVideoPricePreview = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return t("admin.groups.videoPricing.notConfigured");
    }
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) {
      return t("admin.groups.videoPricing.notConfigured");
    }
    return `$${price.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  };

  const buildImageFinalPricePreview = (form: ImagePricingFormState) => {
    const imageMultiplier = form.image_rate_independent
      ? normalizePreviewNumber(form.image_rate_multiplier, 1)
      : normalizePreviewNumber(form.rate_multiplier, 1);
    const multiplier = imageMultiplier;
    return imagePricingTiers.map((tier) => {
      const basePrice =
        parsePreviewPrice(form[tier.key]) ??
        getDefaultImagePreviewPrice(form.platform, tier.key);
      return {
        label: tier.label,
        value: basePrice !== null
          ? formatImagePricePreview(basePrice * multiplier)
          : t("admin.groups.imagePricing.notConfigured"),
      };
    });
  };

  const buildVideoFinalPricePreview = (form: VideoPricingFormState) => {
    const multiplier = form.video_rate_independent
      ? normalizePreviewNumber(form.video_rate_multiplier, 1)
      : normalizePreviewNumber(form.rate_multiplier, 1);
    return videoPricingTiers.map((tier) => {
      const basePrice =
        parsePreviewPrice(form[tier.key]) ??
        getDefaultVideoPreviewPrice(form.platform, tier.key);
      return {
        label: tier.label,
        value: basePrice !== null
          ? formatVideoPricePreview(basePrice * multiplier)
          : t("admin.groups.videoPricing.notConfigured"),
      };
    });
  };

  const createImageFinalPricePreview = computed(() =>
    buildImageFinalPricePreview(createForm),
  );
  const editImageFinalPricePreview = computed(() =>
    buildImageFinalPricePreview(editForm),
  );
  const createVideoFinalPricePreview = computed(() =>
    buildVideoFinalPricePreview(createForm),
  );
  const editVideoFinalPricePreview = computed(() =>
    buildVideoFinalPricePreview(editForm),
  );

  // Codex 网页搜索单次默认价（与后端 defaultWebSearchPricePerCall 一致，官方 $10/1000 次）
  const DEFAULT_WEB_SEARCH_PRICE_PER_CALL = 0.01;

  const buildWebSearchFinalPricePreview = (form: {
    web_search_price_per_call: number | string | null;
    rate_multiplier: number | string | null;
  }) => {
    const basePrice =
      parsePreviewPrice(form.web_search_price_per_call) ??
      DEFAULT_WEB_SEARCH_PRICE_PER_CALL;
    const multiplier = normalizePreviewNumber(form.rate_multiplier, 1);
    return formatImagePricePreview(basePrice * multiplier);
  };

  const createWebSearchFinalPricePreview = computed(() =>
    buildWebSearchFinalPricePreview(createForm),
  );
  const editWebSearchFinalPricePreview = computed(() =>
    buildWebSearchFinalPricePreview(editForm),
  );

  const resetDisabledBatchImagePricing = (
    form: Pick<
      ImagePricingFormState,
      "platform" | "allow_image_generation" | "allow_batch_image_generation" | "batch_image_discount_multiplier" | "batch_image_hold_multiplier"
    >,
  ) => {
    if (form.platform !== "gemini" || !form.allow_image_generation) {
      form.allow_batch_image_generation = false;
    }
    if (!form.allow_batch_image_generation) {
      form.batch_image_discount_multiplier = 0.5;
      form.batch_image_hold_multiplier = 0.6;
    }
  };

  // 根据分组类型返回不同的删除确认消息
  const deleteConfirmMessage = computed(() => {
    if (!deletingGroup.value) {
      return "";
    }
    if (deletingGroup.value.subscription_type === "subscription") {
      return t("admin.groups.deleteConfirmSubscription", {
        name: deletingGroup.value.name,
      });
    }
    return t("admin.groups.deleteConfirm", { name: deletingGroup.value.name });
  });

  const loadLiveCapability = async () => {
    if (liveCapability.value) return liveCapability.value;
    if (!liveCapabilityRequest) {
      liveCapabilityRequest = adminAPI.groups
        .getLiveCapability()
        .catch(() => ({ supported: false }))
        .finally(() => {
          liveCapabilityRequest = null;
        });
    }
    liveCapability.value = await liveCapabilityRequest;
    return liveCapability.value ?? { supported: false };
  };

  const toggleLive = async (target: "create" | "edit") => {
    const form = target === "create" ? createForm : editForm;
    if (form.allow_live) {
      form.allow_live = false;
      return;
    }
    const capability = await loadLiveCapability();
    if (capability.supported) {
      form.allow_live = true;
      return;
    }
    pendingLiveForm.value = target;
  };

  const confirmUnsupportedLive = () => {
    if (pendingLiveForm.value === "create") createForm.allow_live = true;
    if (pendingLiveForm.value === "edit") editForm.allow_live = true;
    pendingLiveForm.value = null;
  };

  const cancelUnsupportedLive = () => {
    pendingLiveForm.value = null;
  };

  const loadGroups = async () => {
    if (abortController) {
      abortController.abort();
    }
    const currentController = new AbortController();
    abortController = currentController;
    const { signal } = currentController;
    loading.value = true;
    try {
      const response = await adminAPI.groups.list(
        pagination.page,
        pagination.page_size,
        {
          platform: (filters.platform as GroupPlatform) || undefined,
          status: filters.status as any,
          is_exclusive: !authStore.isSimpleMode && filters.is_exclusive
            ? filters.is_exclusive === "true"
            : undefined,
          search: searchQuery.value.trim() || undefined,
          sort_by: sortState.sort_by,
          sort_order: sortState.sort_order,
        },
        { signal },
      );
      if (signal.aborted) return;
      groups.value = response.items;
      pagination.total = response.total;
      pagination.pages = response.pages;
      if (hasVisibleUsageSummaryConsumer.value) {
        loadUsageSummary();
      } else {
        usageLoading.value = false;
      }
      if (hasVisibleCapacityColumn.value) {
        loadCapacitySummary();
      }
    } catch (error: any) {
      if (
        signal.aborted ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }
      appStore.showError(t("admin.groups.failedToLoad"));
      console.error("Error loading groups:", error);
    } finally {
      if (abortController === currentController && !signal.aborted) {
        loading.value = false;
      }
    }
  };

  const formatCost = (cost: number): string => {
    if (cost >= 1000) return cost.toFixed(0);
    if (cost >= 100) return cost.toFixed(1);
    return cost.toFixed(2);
  };

  const formatUsd = (cost: number | null | undefined): string =>
    `$${formatCost(cost ?? 0)}`;

  const getQuotaUsageClass = (
    used: number,
    limit: number | null | undefined,
  ): string => {
    if (!limit || limit <= 0) {
      return "font-medium text-gray-700 dark:text-gray-300";
    }
    const ratio = used / limit;
    if (ratio >= 1) {
      return "font-semibold text-danger-600 dark:text-danger-400";
    }
    if (ratio >= 0.8) {
      return "font-semibold text-warning-600 dark:text-warning-400";
    }
    return "font-medium text-gray-700 dark:text-gray-300";
  };

  const loadUsageSummary = async () => {
    if (!hasVisibleUsageSummaryConsumer.value) {
      usageLoading.value = false;
      return;
    }
    usageLoading.value = true;
    try {
      const data = await adminAPI.groups.getUsageSummary();
      const map = new Map<number, GroupUsageSummary>();
      for (const item of data) {
        map.set(item.group_id, {
          today_cost: item.today_cost,
          yesterday_cost: item.yesterday_cost,
          total_cost: item.total_cost,
        });
      }
      usageMap.value = map;
    } catch (error) {
      console.error("Error loading group usage summary:", error);
    } finally {
      usageLoading.value = false;
    }
  };

  const loadCapacitySummary = async () => {
    if (!hasVisibleCapacityColumn.value) {
      return;
    }
    try {
      const data = await adminAPI.groups.getCapacitySummary();
      const map = new Map<
        number,
        {
          concurrencyUsed: number;
          concurrencyMax: number;
          sessionsUsed: number;
          sessionsMax: number;
          rpmUsed: number;
          rpmMax: number;
        }
      >();
      for (const item of data) {
        map.set(item.group_id, {
          concurrencyUsed: item.concurrency_used,
          concurrencyMax: item.concurrency_max,
          sessionsUsed: item.sessions_used,
          sessionsMax: item.sessions_max,
          rpmUsed: item.rpm_used,
          rpmMax: item.rpm_max,
        });
      }
      capacityMap.value = map;
    } catch (error) {
      console.error("Error loading group capacity summary:", error);
    }
  };

  let searchTimeout: ReturnType<typeof setTimeout>;
  const handleSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      pagination.page = 1;
      loadGroups();
    }, 300);
  };

  const handlePageChange = (page: number) => {
    pagination.page = page;
    loadGroups();
  };

  const handlePageSizeChange = (pageSize: number) => {
    pagination.page_size = pageSize;
    pagination.page = 1;
    loadGroups();
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    sortState.sort_by = key;
    sortState.sort_order = order;
    pagination.page = 1;
    loadGroups();
  };

  const openCreateModal = () => {
    showCreateModal.value = true;
    loadModelAllowlistCandidates("create", 0, createForm.platform);
  };

  const closeCreateModal = () => {
    showCreateModal.value = false;
    createModelRoutingRules.value.forEach((rule) => {
      accountSearchRunner.clearKey(getCreateRuleSearchKey(rule));
    });
    clearAllAccountSearchState();
    createForm.name = "";
    createForm.description = "";
    createForm.platform = "anthropic";
    createForm.rate_multiplier = 1.0;
    createForm.is_exclusive = false;
    createForm.subscription_type = "standard";
    createForm.daily_limit_usd = null;
    createForm.weekly_limit_usd = null;
    createForm.monthly_limit_usd = null;
    createForm.allow_image_generation = false;
    createForm.allow_batch_image_generation = false;
    createForm.image_rate_independent = false;
    createForm.image_rate_multiplier = 1;
    createForm.batch_image_discount_multiplier = 0.5;
    createForm.batch_image_hold_multiplier = 0.6;
    createForm.image_price_1k = null;
    createForm.image_price_2k = null;
    createForm.image_price_4k = null;
    createForm.video_rate_independent = false;
    createForm.video_rate_multiplier = 1;
    createForm.video_price_480p = null;
    createForm.video_price_720p = null;
    createForm.video_price_1080p = null;
    createForm.video_model_prices = createVideoModelPricesForm();
    createForm.long_context_pricing_enabled = true;
    createForm.force_openai_fast = false;
    createForm.free_openai_fast = false;
    createForm.disable_openai_fast = false;
    createForm.force_openai_ultrafast = false;
    createForm.model_pricing = [];
    createForm.web_search_price_per_call = null;
    createForm.search_price_per_1k = null;
    createForm.audio_realtime_price_per_min = null;
    createForm.audio_tts_price_per_million_chars = null;
    createForm.audio_stt_price_per_hour = null;
    createForm.peak_rate_enabled = false;
    createForm.peak_start = "";
    createForm.peak_end = "";
    createForm.peak_rate_multiplier = 1.0;
    createForm.profit_control_enabled = false;
    createForm.profit_min_margin_percent = 0;
    createForm.profit_safety_buffer_percent = 0;
    createForm.claude_code_only = false;
    createForm.fallback_group_id = null;
    createForm.fallback_group_id_on_invalid_request = null;
    resetMessagesDispatchFormState(createForm);
    createForm.allow_live = false;
    createForm.require_oauth_only = false;
    createForm.require_privacy_set = false;
    createForm.supported_model_scopes = ["claude", "gemini_text", "gemini_image"];
    createForm.mcp_xml_inject = true;
    createForm.copy_accounts_from_group_ids = [];
    createForm.rpm_limit = 0;
    createForm.concurrency = 0;
    createForm.max_reasoning_effort = "";
    createForm.max_reasoning_effort_over_limit = reasoningEffortOverLimitDowngrade;
    createForm.reasoning_effort_mappings = [];
    createReasoningEffortPolicyRef.value?.resetValidation();
    resetModelAllowlistState(createModelAllowlistState);
    createModelRoutingRules.value = [];
  };

  const normalizeOptionalLimit = (
    value: number | string | null | undefined,
  ): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    return Number.isFinite(value) && value > 0 ? value : null;
  };

  const normalizeRateMultiplier = (
    value: number | string | null | undefined,
  ): number => {
    if (value === null || value === undefined || value === "") {
      return 1;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
  };

  // 利润控制表单辅助（换算与校验逻辑见 groupsProfitControl.ts，便于单测）。
  const percentToDecimal = profitPercentToDecimal;
  const decimalToPercent = profitDecimalToPercent;

  const validateProfitControlForm = (form: ProfitControlFormState): boolean => {
    const errorKey = validateProfitControlFormState(form);
    if (errorKey) {
      appStore.showError(t(`admin.groups.profitControl.${errorKey}`));
      return false;
    }
    return true;
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      appStore.showError(t("admin.groups.nameRequired"));
      return;
    }
    if (
      supportsReasoningEffortPolicyPlatform(createForm.platform) &&
      createReasoningEffortPolicyRef.value &&
      !createReasoningEffortPolicyRef.value.validate()
    ) {
      return;
    }
    if (!validateProfitControlForm(createForm)) {
      return;
    }
    // 模型白名单：开启且没有任何条目时阻止提交，与后端 400 对齐。
    if (
      createModelAllowlistState.enabled &&
      createModelAllowlistSelectedCount.value === 0
    ) {
      appStore.showError(t("admin.groups.modelAllowlist.emptySelectionError"));
      return;
    }
    submitting.value = true;
    try {
      const {
        video_model_prices: _createFormVideoModelPrices,
        ...createGroupForm
      } = createForm;
      const videoModelPrices = serializeVideoModelPrices(
        createForm.video_model_prices,
      );
      // 构建请求数据，包含模型路由配置
      const requestData = {
        ...createGroupForm,
        force_openai_fast: normalizeGroupOpenAIFast(
          createForm.platform,
          createForm.force_openai_fast,
        ),
        free_openai_fast: normalizeGroupOpenAIFast(
          createForm.platform,
          createForm.free_openai_fast,
        ),
        disable_openai_fast: normalizeGroupOpenAIFast(
          createForm.platform,
          createForm.disable_openai_fast,
        ),
        force_openai_ultrafast: normalizeGroupOpenAIFast(
          createForm.platform,
          createForm.force_openai_ultrafast,
        ),
        model_pricing: groupPricingToAPI(
          createForm.model_pricing,
          createForm.platform,
        ),
        daily_limit_usd: normalizeOptionalLimit(
          createForm.daily_limit_usd as number | string | null,
        ),
        weekly_limit_usd: normalizeOptionalLimit(
          createForm.weekly_limit_usd as number | string | null,
        ),
        monthly_limit_usd: normalizeOptionalLimit(
          createForm.monthly_limit_usd as number | string | null,
        ),
        ...(Object.keys(videoModelPrices).length > 0
          ? { video_model_prices: videoModelPrices }
          : {}),
        model_routing: convertRoutingRulesToApiFormat(
          createModelRoutingRules.value,
        ),
        model_allowlist: buildModelAllowlistConfig(createModelAllowlistState),
        // 创建时固定账号 manifest 固定发送关闭状态（后端创建路径禁止开启）
        codex_models_manifest_config: createCodexManifestDefaults(),
        supported_model_scopes: normalizeSupportedModelScopesForPlatform(
          createForm.platform,
          createForm.supported_model_scopes,
        ),
        messages_dispatch_model_config:
          createForm.platform === "openai"
            ? messagesDispatchFormStateToConfig({
                allow_messages_dispatch: createForm.allow_messages_dispatch,
                opus_mapped_model: createForm.opus_mapped_model,
                sonnet_mapped_model: createForm.sonnet_mapped_model,
                haiku_mapped_model: createForm.haiku_mapped_model,
                exact_model_mappings: createForm.exact_model_mappings,
              })
            : undefined,
        reasoning_effort_mappings: reasoningEffortMappingsToAPI(
          createForm.reasoning_effort_mappings,
        ),
        // 利润控制：界面百分比转小数提交；仅五个 token 平台可启用
        profit_control_enabled:
          isProfitControlPlatform(createForm.platform) &&
          createForm.profit_control_enabled,
        profit_min_margin: percentToDecimal(createForm.profit_min_margin_percent),
        profit_safety_buffer: percentToDecimal(
          createForm.profit_safety_buffer_percent,
        ),
      };
      delete (requestData as Record<string, unknown>).profit_min_margin_percent;
      delete (requestData as Record<string, unknown>).profit_safety_buffer_percent;
      // v-model.number 清空输入框时产生 ""，转为 null 让后端设为无限制
      const emptyToNull = (v: any) => (v === "" ? null : v);
      requestData.daily_limit_usd = emptyToNull(requestData.daily_limit_usd);
      requestData.weekly_limit_usd = emptyToNull(requestData.weekly_limit_usd);
      requestData.monthly_limit_usd = emptyToNull(requestData.monthly_limit_usd);
      requestData.image_rate_multiplier = normalizeRateMultiplier(
        requestData.image_rate_multiplier,
      );
      resetDisabledBatchImagePricing(requestData);
      requestData.batch_image_discount_multiplier = normalizeRateMultiplier(
        requestData.batch_image_discount_multiplier,
      );
      requestData.batch_image_hold_multiplier = normalizeRateMultiplier(
        requestData.batch_image_hold_multiplier,
      );
      requestData.video_rate_multiplier = normalizeRateMultiplier(
        requestData.video_rate_multiplier,
      );
      // 媒体价格输入清空时 v-model.number 产生 ""，直接提交会被后端 *float64 反序列化拒绝（400），
      // 创建时按"未配置"（null）处理。
      requestData.image_price_1k = emptyToNull(requestData.image_price_1k);
      requestData.image_price_2k = emptyToNull(requestData.image_price_2k);
      requestData.image_price_4k = emptyToNull(requestData.image_price_4k);
      requestData.video_price_480p = emptyToNull(requestData.video_price_480p);
      requestData.video_price_720p = emptyToNull(requestData.video_price_720p);
      requestData.video_price_1080p = emptyToNull(requestData.video_price_1080p);
      requestData.search_price_per_1k = emptyToNull(
        requestData.search_price_per_1k,
      );
      requestData.audio_realtime_price_per_min = emptyToNull(
        requestData.audio_realtime_price_per_min,
      );
      requestData.audio_tts_price_per_million_chars = emptyToNull(
        requestData.audio_tts_price_per_million_chars,
      );
      requestData.audio_stt_price_per_hour = emptyToNull(
        requestData.audio_stt_price_per_hour,
      );
      requestData.web_search_price_per_call = emptyToNull(
        requestData.web_search_price_per_call,
      );
      requestData.peak_rate_enabled = createForm.peak_rate_enabled;
      requestData.peak_start = createForm.peak_start;
      requestData.peak_end = createForm.peak_end;
      requestData.peak_rate_multiplier = normalizeRateMultiplier(
        createForm.peak_rate_multiplier,
      );
      const payload = authStore.isSimpleMode
        ? {
            name: createForm.name,
            description: createForm.description,
            platform: createForm.platform,
          }
        : requestData;
      await adminAPI.groups.create(payload);
      appStore.showSuccess(t("admin.groups.groupCreated"));
      closeCreateModal();
      loadGroups();
      // Only advance tour if active, on submit step, and creation succeeded
      if (onboardingStore.isCurrentStep('[data-tour="group-form-submit"]')) {
        onboardingStore.nextStep(500);
      }
    } catch (error: any) {
      appStore.showError(
        extractApiErrorMessage(error, t("admin.groups.failedToCreate")),
      );
      console.error("Error creating group:", error);
      // Don't advance tour on error
    } finally {
      submitting.value = false;
    }
  };

  const handleEdit = async (group: AdminGroup) => {
    editingGroup.value = group;
    editForm.name = group.name;
    editForm.description = group.description || "";
    editForm.platform = group.platform;
    editForm.rate_multiplier = group.rate_multiplier;
    editForm.is_exclusive = group.is_exclusive;
    editForm.status = group.status;
    editForm.subscription_type = group.subscription_type || "standard";
    editForm.daily_limit_usd = group.daily_limit_usd;
    editForm.weekly_limit_usd = group.weekly_limit_usd;
    editForm.monthly_limit_usd = group.monthly_limit_usd;
    editForm.long_context_pricing_enabled =
      group.long_context_pricing_enabled ?? true;
    editForm.force_openai_fast = group.force_openai_fast ?? false;
    editForm.free_openai_fast = group.free_openai_fast ?? false;
    editForm.disable_openai_fast = group.disable_openai_fast ?? false;
    editForm.force_openai_ultrafast = group.force_openai_ultrafast ?? false;
    editForm.model_pricing = groupPricingFromAPI(group.model_pricing);
    editForm.allow_image_generation = group.allow_image_generation ?? false;
    editForm.allow_batch_image_generation =
      group.allow_batch_image_generation ?? false;
    editForm.image_rate_independent = group.image_rate_independent ?? false;
    editForm.image_rate_multiplier = group.image_rate_multiplier ?? 1;
    editForm.batch_image_discount_multiplier =
      group.batch_image_discount_multiplier ?? 0.5;
    editForm.batch_image_hold_multiplier = group.batch_image_hold_multiplier ?? 0.6;
    editForm.image_price_1k = group.image_price_1k;
    editForm.image_price_2k = group.image_price_2k;
    editForm.image_price_4k = group.image_price_4k;
    editForm.video_rate_independent = group.video_rate_independent ?? false;
    editForm.video_rate_multiplier = group.video_rate_multiplier ?? 1;
    editForm.video_price_480p = group.video_price_480p;
    editForm.video_price_720p = group.video_price_720p;
    editForm.video_price_1080p = group.video_price_1080p;
    editForm.video_model_prices = createVideoModelPricesForm(
      group.video_model_prices,
    );
    editForm.web_search_price_per_call = group.web_search_price_per_call ?? null;
    editForm.search_price_per_1k = group.search_price_per_1k ?? null;
    editForm.audio_realtime_price_per_min = group.audio_realtime_price_per_min ?? null;
    editForm.audio_tts_price_per_million_chars = group.audio_tts_price_per_million_chars ?? null;
    editForm.audio_stt_price_per_hour = group.audio_stt_price_per_hour ?? null;
    editForm.peak_rate_enabled = group.peak_rate_enabled ?? false;
    editForm.peak_start = group.peak_start ?? "";
    editForm.peak_end = group.peak_end ?? "";
    editForm.peak_rate_multiplier = group.peak_rate_multiplier ?? 1.0;
    editForm.profit_control_enabled = group.profit_control_enabled ?? false;
    editForm.profit_min_margin_percent = decimalToPercent(
      group.profit_min_margin ?? 0,
    );
    editForm.profit_safety_buffer_percent = decimalToPercent(
      group.profit_safety_buffer ?? 0,
    );
    editForm.claude_code_only = group.claude_code_only || false;
    editForm.fallback_group_id = group.fallback_group_id;
    editForm.fallback_group_id_on_invalid_request =
      group.fallback_group_id_on_invalid_request;
    const messagesDispatchFormState = messagesDispatchConfigToFormState(
      group.messages_dispatch_model_config,
    );
    editForm.allow_messages_dispatch =
      group.allow_messages_dispatch ||
      messagesDispatchFormState.allow_messages_dispatch;
    editForm.allow_live = group.allow_live ?? false;
    editForm.opus_mapped_model = messagesDispatchFormState.opus_mapped_model;
    editForm.sonnet_mapped_model = messagesDispatchFormState.sonnet_mapped_model;
    editForm.haiku_mapped_model = messagesDispatchFormState.haiku_mapped_model;
    editForm.exact_model_mappings =
      messagesDispatchFormState.exact_model_mappings;
    editForm.require_oauth_only = group.require_oauth_only ?? false;
    editForm.require_privacy_set = group.require_privacy_set ?? false;
    editForm.model_routing_enabled = group.model_routing_enabled || false;
    editForm.supported_model_scopes = group.supported_model_scopes || [
      "claude",
      "gemini_text",
      "gemini_image",
    ];
    editForm.mcp_xml_inject = group.mcp_xml_inject ?? true;
    editForm.copy_accounts_from_group_ids = []; // 复制账号字段每次编辑时重置为空
    editForm.rpm_limit = group.rpm_limit ?? 0;
    editForm.concurrency = group.concurrency ?? 0;
    editForm.max_reasoning_effort = normalizeReasoningEffortForPlatform(
      group.platform,
      group.max_reasoning_effort,
    );
    editForm.max_reasoning_effort_over_limit = normalizeReasoningEffortOverLimit(
      group.max_reasoning_effort_over_limit,
    );
    editForm.reasoning_effort_mappings = reasoningEffortMappingsToRows(
      group.reasoning_effort_mappings,
      group.platform,
    );
    resetModelAllowlistState(editModelAllowlistState, group.model_allowlist);
    // 固定账号 manifest 配置：回显配置并异步解析已存账号名称（失败显示 #<id>）
    const savedCodexManifestConfig =
      group.codex_models_manifest_config ?? createCodexManifestDefaults();
    editCodexManifestConfig.value = {
      enabled: savedCodexManifestConfig.enabled ?? false,
      account_ids: [...(savedCodexManifestConfig.account_ids ?? [])],
      fallback_to_scheduler: savedCodexManifestConfig.fallback_to_scheduler ?? false,
    };
    editCodexManifestAccountNames.value = {};
    for (const id of editCodexManifestConfig.value.account_ids) {
      adminAPI.accounts
        .getById(id)
        .then((account) => {
          editCodexManifestAccountNames.value = {
            ...editCodexManifestAccountNames.value,
            [id]: account.name,
          };
        })
        .catch(() => {
          // 无法解析名称时由组件回退展示 #<id>，提示管理员清理脏 ID。
        });
    }
    // 加载模型路由规则（异步加载账号名称）
    editModelRoutingRules.value = await convertApiFormatToRoutingRules(
      group.model_routing,
    );
    loadModelAllowlistCandidates("edit", group.id, group.platform);
    showEditModal.value = true;
  };

  const closeEditModal = () => {
    editModelRoutingRules.value.forEach((rule) => {
      accountSearchRunner.clearKey(getEditRuleSearchKey(rule));
    });
    clearAllAccountSearchState();
    showEditModal.value = false;
    editingGroup.value = null;
    editForm.max_reasoning_effort = "";
    editForm.max_reasoning_effort_over_limit = reasoningEffortOverLimitDowngrade;
    editForm.reasoning_effort_mappings = [];
    editReasoningEffortPolicyRef.value?.resetValidation();
    editModelRoutingRules.value = [];
    editForm.copy_accounts_from_group_ids = [];
    editForm.peak_rate_enabled = false;
    editForm.peak_start = "";
    editForm.peak_end = "";
    editForm.peak_rate_multiplier = 1.0;
    editForm.profit_control_enabled = false;
    editForm.profit_min_margin_percent = 0;
    editForm.profit_safety_buffer_percent = 0;
    editForm.video_rate_independent = false;
    editForm.video_rate_multiplier = 1;
    editForm.video_price_480p = null;
    editForm.video_price_720p = null;
    editForm.video_price_1080p = null;
    editForm.video_model_prices = createVideoModelPricesForm();
    editForm.long_context_pricing_enabled = true;
    editForm.force_openai_fast = false;
    editForm.free_openai_fast = false;
    editForm.disable_openai_fast = false;
    editForm.force_openai_ultrafast = false;
    editForm.model_pricing = [];
    editForm.web_search_price_per_call = null;
    editForm.search_price_per_1k = null;
    editForm.audio_realtime_price_per_min = null;
    editForm.audio_tts_price_per_million_chars = null;
    editForm.audio_stt_price_per_hour = null;
    resetMessagesDispatchFormState(editForm);
    editForm.allow_live = false;
    resetModelAllowlistState(editModelAllowlistState);
    editCodexManifestConfig.value = createCodexManifestDefaults();
    editCodexManifestAccountNames.value = {};
    editCodexManifestRef.value?.resetValidation?.();
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup.value) return;
    if (!editForm.name.trim()) {
      appStore.showError(t("admin.groups.nameRequired"));
      return;
    }
    if (
      supportsReasoningEffortPolicyPlatform(editForm.platform) &&
      editReasoningEffortPolicyRef.value &&
      !editReasoningEffortPolicyRef.value.validate()
    ) {
      return;
    }
    if (!validateProfitControlForm(editForm)) {
      return;
    }
    // 模型白名单：开启且没有任何条目时阻止提交，与后端 400 对齐。
    if (
      editModelAllowlistState.enabled &&
      editModelAllowlistSelectedCount.value === 0
    ) {
      appStore.showError(t("admin.groups.modelAllowlist.emptySelectionError"));
      return;
    }
    // 固定账号 manifest：开启后至少一个账号，前端阻止提交并提示。
    if (
      editForm.platform === "openai" &&
      editCodexManifestConfig.value.enabled &&
      editCodexManifestConfig.value.account_ids.length === 0
    ) {
      appStore.showError(t("admin.groups.codexModelsManifest.selectAtLeastOne"));
      editCodexManifestRef.value?.validate();
      return;
    }

    submitting.value = true;
    try {
      // 转换 fallback_group_id: null -> 0 (后端使用 0 表示清除)
      const payload = {
        ...editForm,
        force_openai_fast: normalizeGroupOpenAIFast(
          editForm.platform,
          editForm.force_openai_fast,
        ),
        free_openai_fast: normalizeGroupOpenAIFast(
          editForm.platform,
          editForm.free_openai_fast,
        ),
        disable_openai_fast: normalizeGroupOpenAIFast(
          editForm.platform,
          editForm.disable_openai_fast,
        ),
        force_openai_ultrafast: normalizeGroupOpenAIFast(
          editForm.platform,
          editForm.force_openai_ultrafast,
        ),
        model_pricing: groupPricingToAPI(
          editForm.model_pricing,
          editForm.platform,
        ),
        daily_limit_usd: normalizeOptionalLimit(
          editForm.daily_limit_usd as number | string | null,
        ),
        weekly_limit_usd: normalizeOptionalLimit(
          editForm.weekly_limit_usd as number | string | null,
        ),
        monthly_limit_usd: normalizeOptionalLimit(
          editForm.monthly_limit_usd as number | string | null,
        ),
        video_model_prices: serializeVideoModelPrices(
          editForm.video_model_prices,
        ),
        fallback_group_id:
          editForm.fallback_group_id === null ? 0 : editForm.fallback_group_id,
        fallback_group_id_on_invalid_request:
          editForm.fallback_group_id_on_invalid_request === null
            ? 0
            : editForm.fallback_group_id_on_invalid_request,
        model_routing: convertRoutingRulesToApiFormat(
          editModelRoutingRules.value,
        ),
        model_allowlist: buildModelAllowlistConfig(editModelAllowlistState),
        // 非 openai 平台提交关闭状态，与后端归一化一致
        codex_models_manifest_config:
          editForm.platform === "openai"
            ? {
                enabled: editCodexManifestConfig.value.enabled,
                account_ids: [...editCodexManifestConfig.value.account_ids],
                fallback_to_scheduler: editCodexManifestConfig.value.fallback_to_scheduler,
              }
            : createCodexManifestDefaults(),
        supported_model_scopes: normalizeSupportedModelScopesForPlatform(
          editForm.platform,
          editForm.supported_model_scopes,
        ),
        messages_dispatch_model_config:
          editForm.platform === "openai"
            ? messagesDispatchFormStateToConfig({
                allow_messages_dispatch: editForm.allow_messages_dispatch,
                opus_mapped_model: editForm.opus_mapped_model,
                sonnet_mapped_model: editForm.sonnet_mapped_model,
                haiku_mapped_model: editForm.haiku_mapped_model,
                exact_model_mappings: editForm.exact_model_mappings,
              })
            : undefined,
        reasoning_effort_mappings: reasoningEffortMappingsToAPI(
          editForm.reasoning_effort_mappings,
        ),
        // 利润控制：界面百分比转小数提交；仅五个 token 平台可启用
        profit_control_enabled:
          isProfitControlPlatform(editForm.platform) &&
          editForm.profit_control_enabled,
        profit_min_margin: percentToDecimal(editForm.profit_min_margin_percent),
        profit_safety_buffer: percentToDecimal(
          editForm.profit_safety_buffer_percent,
        ),
      };
      delete (payload as Record<string, unknown>).profit_min_margin_percent;
      delete (payload as Record<string, unknown>).profit_safety_buffer_percent;
      // v-model.number 清空输入框时产生 ""，转为 null 让后端设为无限制
      const emptyToNull = (v: any) => (v === "" ? null : v);
      payload.daily_limit_usd = emptyToNull(payload.daily_limit_usd);
      payload.weekly_limit_usd = emptyToNull(payload.weekly_limit_usd);
      payload.monthly_limit_usd = emptyToNull(payload.monthly_limit_usd);
      payload.image_rate_multiplier = normalizeRateMultiplier(
        payload.image_rate_multiplier,
      );
      resetDisabledBatchImagePricing(payload);
      payload.batch_image_discount_multiplier = normalizeRateMultiplier(
        payload.batch_image_discount_multiplier,
      );
      payload.batch_image_hold_multiplier = normalizeRateMultiplier(
        payload.batch_image_hold_multiplier,
      );
      payload.video_rate_multiplier = normalizeRateMultiplier(
        payload.video_rate_multiplier,
      );
      // 媒体价格输入清空时 v-model.number 产生 ""，直接提交会被后端 *float64 反序列化拒绝（400）。
      // 更新语义中 null 表示"不修改"，因此清空后的字段发送 -1：后端 normalizePrice 将负价归一为
      // NULL，从而真正清除已配置的价格。
      const emptyPriceToClear = (v: any) => (v === "" || v === null ? -1 : v);
      payload.image_price_1k = emptyPriceToClear(payload.image_price_1k);
      payload.image_price_2k = emptyPriceToClear(payload.image_price_2k);
      payload.image_price_4k = emptyPriceToClear(payload.image_price_4k);
      payload.video_price_480p = emptyPriceToClear(payload.video_price_480p);
      payload.video_price_720p = emptyPriceToClear(payload.video_price_720p);
      payload.video_price_1080p = emptyPriceToClear(payload.video_price_1080p);
      payload.search_price_per_1k = emptyPriceToClear(
        payload.search_price_per_1k,
      );
      payload.audio_realtime_price_per_min = emptyPriceToClear(
        payload.audio_realtime_price_per_min,
      );
      payload.audio_tts_price_per_million_chars = emptyPriceToClear(
        payload.audio_tts_price_per_million_chars,
      );
      payload.audio_stt_price_per_hour = emptyPriceToClear(
        payload.audio_stt_price_per_hour,
      );
      payload.web_search_price_per_call = emptyPriceToClear(
        payload.web_search_price_per_call,
      );
      payload.peak_rate_enabled = editForm.peak_rate_enabled;
      payload.peak_start = editForm.peak_start;
      payload.peak_end = editForm.peak_end;
      payload.peak_rate_multiplier = normalizeRateMultiplier(
        editForm.peak_rate_multiplier,
      );
      const requestData = authStore.isSimpleMode
        ? {
            name: editForm.name,
            description: editForm.description,
          }
        : payload;
      await adminAPI.groups.update(editingGroup.value.id, requestData);
      appStore.showSuccess(t("admin.groups.groupUpdated"));
      closeEditModal();
      loadGroups();
    } catch (error: any) {
      appStore.showError(
        extractApiErrorMessage(error, t("admin.groups.failedToUpdate")),
      );
      console.error("Error updating group:", error);
    } finally {
      submitting.value = false;
    }
  };

  const addCreateMessagesDispatchMapping = () => {
    createForm.exact_model_mappings.push({ claude_model: "", target_model: "" });
  };

  const removeCreateMessagesDispatchMapping = (
    row: MessagesDispatchMappingRow,
  ) => {
    const index = createForm.exact_model_mappings.indexOf(row);
    if (index !== -1) {
      createForm.exact_model_mappings.splice(index, 1);
    }
  };

  const addEditMessagesDispatchMapping = () => {
    editForm.exact_model_mappings.push({ claude_model: "", target_model: "" });
  };

  const removeEditMessagesDispatchMapping = (row: MessagesDispatchMappingRow) => {
    const index = editForm.exact_model_mappings.indexOf(row);
    if (index !== -1) {
      editForm.exact_model_mappings.splice(index, 1);
    }
  };

  const handleRateMultipliers = (group: AdminGroup) => {
    rateMultipliersGroup.value = group;
    showRateMultipliersModal.value = true;
  };

  const handleRPMOverrides = (group: AdminGroup) => {
    rpmOverridesGroup.value = group;
    showRPMOverridesModal.value = true;
  };

  const handleDuplicate = async (group: AdminGroup) => {
    if (duplicatingGroupIds.has(group.id)) return;

    duplicatingGroupIds.add(group.id);
    try {
      const duplicate = await adminAPI.groups.duplicate(group.id);
      appStore.showSuccess(
        t("admin.groups.duplicateSuccess", { name: duplicate.name }),
      );
      await loadGroups();
    } catch (error: unknown) {
      appStore.showError(
        extractApiErrorMessage(error, t("admin.groups.duplicateFailed")),
      );
    } finally {
      duplicatingGroupIds.delete(group.id);
    }
  };

  const compositeRouteMatchLabel = (matchType: CompositeRouteMatchType) =>
    compositeRouteMatchOptions.value.find((option) => option.value === matchType)
      ?.label || matchType;

  const formatCompositeEndpoint = (endpoint: CompositeRouteEndpoint) =>
    compositeRouteEndpointOptions.value.find((option) => option.value === endpoint)
      ?.label || endpoint;

  const formatCompositePlatform = (platform: string) => {
    if (!platform) return "—";
    return t(`admin.groups.platforms.${platform}`);
  };

  const compositeRouteSourceLabel = (source: string) => {
    if (source === "route") return t("admin.groups.compositeRoutes.sources.route");
    if (source === "detector") {
      return t("admin.groups.compositeRoutes.sources.detector");
    }
    return source || "—";
  };

  const resetCompositeRouteForm = () => {
    compositeRouteEditingId.value = null;
    compositeRouteForm.public_model = "";
    compositeRouteForm.match_type = "exact";
    compositeRouteForm.target_platform = "openai";
    compositeRouteForm.upstream_model = "";
    compositeRouteForm.endpoint = "any";
    compositeRouteForm.priority = 100;
    compositeRouteForm.enabled = true;
    compositeRouteForm.notes = "";
  };

  const toCompositeRouteInput = (): CompositeModelRouteInput => ({
    public_model: compositeRouteForm.public_model.trim(),
    match_type: compositeRouteForm.match_type,
    target_platform: compositeRouteForm.target_platform,
    upstream_model: compositeRouteForm.upstream_model.trim(),
    endpoint: compositeRouteForm.endpoint,
    priority: Number(compositeRouteForm.priority) || 100,
    enabled: compositeRouteForm.enabled,
    notes: compositeRouteForm.notes.trim(),
  });

  const loadCompositeRoutes = async () => {
    if (!compositeRoutesGroup.value) return;
    compositeRoutesLoading.value = true;
    try {
      const routes = await adminAPI.groups.listCompositeRoutes(
        compositeRoutesGroup.value.id,
      );
      compositeRoutes.value = routes.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.id - b.id;
      });
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          t("admin.groups.compositeRoutes.failedToLoad"),
      );
      console.error("Error loading composite routes:", error);
    } finally {
      compositeRoutesLoading.value = false;
    }
  };

  const handleCompositeRoutes = async (group: AdminGroup) => {
    compositeRoutesGroup.value = group;
    compositePreviewModel.value = "";
    compositePreviewEndpoint.value = "any";
    compositePreviewDecision.value = null;
    resetCompositeRouteForm();
    showCompositeRoutesModal.value = true;
    await loadCompositeRoutes();
  };

  const closeCompositeRoutesModal = () => {
    showCompositeRoutesModal.value = false;
    compositeRoutesGroup.value = null;
    compositeRoutes.value = [];
    compositePreviewDecision.value = null;
    resetCompositeRouteForm();
  };

  const editCompositeRoute = (route: CompositeModelRoute) => {
    compositeRouteEditingId.value = route.id;
    compositeRouteForm.public_model = route.public_model;
    compositeRouteForm.match_type = route.match_type;
    compositeRouteForm.target_platform = route.target_platform;
    compositeRouteForm.upstream_model = route.upstream_model;
    compositeRouteForm.endpoint = route.endpoint;
    compositeRouteForm.priority = route.priority || 100;
    compositeRouteForm.enabled = route.enabled;
    compositeRouteForm.notes = route.notes || "";
  };

  const saveCompositeRoute = async () => {
    if (!compositeRoutesGroup.value) return;
    if (!compositeRouteForm.public_model.trim()) {
      appStore.showError(t("admin.groups.compositeRoutes.publicModelRequired"));
      return;
    }
    compositeRouteSaving.value = true;
    try {
      const payload = toCompositeRouteInput();
      if (compositeRouteEditingId.value) {
        await adminAPI.groups.updateCompositeRoute(
          compositeRoutesGroup.value.id,
          compositeRouteEditingId.value,
          payload,
        );
        appStore.showSuccess(t("admin.groups.compositeRoutes.routeUpdated"));
      } else {
        await adminAPI.groups.createCompositeRoute(
          compositeRoutesGroup.value.id,
          payload,
        );
        appStore.showSuccess(t("admin.groups.compositeRoutes.routeCreated"));
      }
      resetCompositeRouteForm();
      await loadCompositeRoutes();
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          t("admin.groups.compositeRoutes.failedToSave"),
      );
      console.error("Error saving composite route:", error);
    } finally {
      compositeRouteSaving.value = false;
    }
  };

  const deleteCompositeRoute = async (route: CompositeModelRoute) => {
    if (!compositeRoutesGroup.value) return;
    if (!window.confirm(t("admin.groups.compositeRoutes.deleteConfirm"))) return;
    try {
      await adminAPI.groups.deleteCompositeRoute(
        compositeRoutesGroup.value.id,
        route.id,
      );
      if (compositeRouteEditingId.value === route.id) {
        resetCompositeRouteForm();
      }
      appStore.showSuccess(t("admin.groups.compositeRoutes.routeDeleted"));
      await loadCompositeRoutes();
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          t("admin.groups.compositeRoutes.failedToDelete"),
      );
      console.error("Error deleting composite route:", error);
    }
  };

  const previewCompositeRoute = async () => {
    if (!compositeRoutesGroup.value || !compositePreviewModel.value.trim()) {
      return;
    }
    compositePreviewLoading.value = true;
    try {
      compositePreviewDecision.value = await adminAPI.groups.previewCompositeRoute(
        compositeRoutesGroup.value.id,
        {
          model: compositePreviewModel.value.trim(),
          endpoint: compositePreviewEndpoint.value,
        },
      );
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          t("admin.groups.compositeRoutes.failedToPreview"),
      );
      console.error("Error previewing composite route:", error);
    } finally {
      compositePreviewLoading.value = false;
    }
  };

  const handleDelete = (group: AdminGroup) => {
    deletingGroup.value = group;
    showDeleteDialog.value = true;
  };

  const confirmDelete = async () => {
    if (!deletingGroup.value) return;

    try {
      await adminAPI.groups.delete(deletingGroup.value.id);
      appStore.showSuccess(t("admin.groups.groupDeleted"));
      showDeleteDialog.value = false;
      deletingGroup.value = null;
      loadGroups();
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail || t("admin.groups.failedToDelete"),
      );
      console.error("Error deleting group:", error);
    }
  };

  // 监听 subscription_type 变化，订阅模式时 is_exclusive 默认为 true；标准模式清空高峰配置
  watch(
    () => createForm.subscription_type,
    (newVal) => {
      if (newVal === "subscription") {
        createForm.is_exclusive = true;
        createForm.fallback_group_id_on_invalid_request = null;
      } else {
        createForm.peak_rate_enabled = false;
        createForm.peak_start = "";
        createForm.peak_end = "";
        createForm.peak_rate_multiplier = 1.0;
      }
    },
  );

  // 编辑表单：切回标准模式时清空高峰配置，避免残留随更新请求提交被后端拒绝
  watch(
    () => editForm.subscription_type,
    (newVal) => {
      if (newVal !== "subscription") {
        editForm.peak_rate_enabled = false;
        editForm.peak_start = "";
        editForm.peak_end = "";
        editForm.peak_rate_multiplier = 1.0;
      }
    },
  );

  watch(
    () => createForm.platform,
    (newVal) => {
      if (!["anthropic", "antigravity"].includes(newVal)) {
        createForm.fallback_group_id_on_invalid_request = null;
      }
      if (!supportsMessagesDispatchPlatform(newVal)) {
        resetMessagesDispatchFormState(createForm);
      }
      if (!supportsLivePlatform(newVal)) {
        createForm.allow_live = false;
      }
      if (!isProfitControlPlatform(newVal)) {
        createForm.profit_control_enabled = false;
        createForm.profit_min_margin_percent = 0;
        createForm.profit_safety_buffer_percent = 0;
      }
      createForm.max_reasoning_effort = normalizeReasoningEffortForPlatform(
        newVal,
        createForm.max_reasoning_effort,
      );
      createForm.max_reasoning_effort_over_limit = supportsReasoningEffortPolicyPlatform(
        newVal,
      )
        ? normalizeReasoningEffortOverLimit(
            createForm.max_reasoning_effort_over_limit,
          )
        : reasoningEffortOverLimitDowngrade;
      createForm.reasoning_effort_mappings = reasoningEffortMappingsToRows(
        reasoningEffortMappingsToAPI(createForm.reasoning_effort_mappings),
        newVal,
      );
      createReasoningEffortPolicyRef.value?.resetValidation();
      if (!["openai", "antigravity", "anthropic", "gemini"].includes(newVal)) {
        createForm.require_oauth_only = false;
        createForm.require_privacy_set = false;
      }
      resetDisabledBatchImagePricing(createForm);
      resetModelAllowlistState(createModelAllowlistState);
      loadModelAllowlistCandidates("create", 0, newVal);
    },
  );

  watch(
    () => createForm.allow_image_generation,
    () => {
      resetDisabledBatchImagePricing(createForm);
    },
  );

  watch(
    () => createForm.allow_batch_image_generation,
    () => {
      resetDisabledBatchImagePricing(createForm);
    },
  );

  watch(
    () => editForm.platform,
    (newVal) => {
      if (!["anthropic", "antigravity"].includes(newVal)) {
        editForm.fallback_group_id_on_invalid_request = null;
      }
      if (!supportsMessagesDispatchPlatform(newVal)) {
        resetMessagesDispatchFormState(editForm);
      }
      if (!supportsLivePlatform(newVal)) {
        editForm.allow_live = false;
      }
      if (!isProfitControlPlatform(newVal)) {
        editForm.profit_control_enabled = false;
        editForm.profit_min_margin_percent = 0;
        editForm.profit_safety_buffer_percent = 0;
      }
      editForm.max_reasoning_effort = normalizeReasoningEffortForPlatform(
        newVal,
        editForm.max_reasoning_effort,
      );
      editForm.max_reasoning_effort_over_limit = supportsReasoningEffortPolicyPlatform(
        newVal,
      )
        ? normalizeReasoningEffortOverLimit(
            editForm.max_reasoning_effort_over_limit,
          )
        : reasoningEffortOverLimitDowngrade;
      editForm.reasoning_effort_mappings = reasoningEffortMappingsToRows(
        reasoningEffortMappingsToAPI(editForm.reasoning_effort_mappings),
        newVal,
      );
      editReasoningEffortPolicyRef.value?.resetValidation();
      if (!["openai", "antigravity", "anthropic", "gemini"].includes(newVal)) {
        editForm.require_oauth_only = false;
        editForm.require_privacy_set = false;
      }
      resetDisabledBatchImagePricing(editForm);
      if (editingGroup.value) {
        resetModelAllowlistState(editModelAllowlistState, editForm.platform === editingGroup.value.platform ? editingGroup.value.model_allowlist : undefined);
        loadModelAllowlistCandidates("edit", editingGroup.value.id, newVal);
      }
    },
  );

  watch(
    () => editForm.allow_image_generation,
    () => {
      resetDisabledBatchImagePricing(editForm);
    },
  );

  watch(
    () => editForm.allow_batch_image_generation,
    () => {
      resetDisabledBatchImagePricing(editForm);
    },
  );

  watch(
    () => editForm.platform,
    (newVal) => {
      if (!['anthropic', 'antigravity'].includes(newVal)) {
        editForm.fallback_group_id_on_invalid_request = null
      }
      if (!supportsMessagesDispatchPlatform(newVal)) {
        editForm.allow_messages_dispatch = false
        editForm.default_mapped_model = ''
      }
      if (!supportsLivePlatform(newVal)) {
        editForm.allow_live = false
      }
    }
  )

  // 点击外部关闭账号搜索下拉框
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // 检查是否点击在下拉框或输入框内
    if (!target.closest(".account-search-container")) {
      Object.keys(showAccountDropdown.value).forEach((key) => {
        showAccountDropdown.value[key] = false;
      });
    }
    if (columnDropdownRef.value && !columnDropdownRef.value.contains(target)) {
      showColumnDropdown.value = false;
    }
  };

  // 打开排序弹窗
  const openSortModal = async () => {
    try {
      // 获取所有分组（不分页）
      const allGroups = await adminAPI.groups.getAll();
      // 按 sort_order 排序
      sortableGroups.value = [...allGroups].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      showSortModal.value = true;
    } catch (error) {
      appStore.showError(t("admin.groups.failedToLoad"));
      console.error("Error loading groups for sorting:", error);
    }
  };

  // 关闭排序弹窗
  const closeSortModal = () => {
    showSortModal.value = false;
    sortableGroups.value = [];
  };

  // 保存排序
  const saveSortOrder = async () => {
    sortSubmitting.value = true;
    try {
      const updates = sortableGroups.value.map((g, index) => ({
        id: g.id,
        sort_order: index * 10,
      }));
      await adminAPI.groups.updateSortOrder(updates);
      appStore.showSuccess(t("admin.groups.sortOrderUpdated"));
      closeSortModal();
      loadGroups();
    } catch (error: any) {
      appStore.showError(
        error.response?.data?.detail || t("admin.groups.failedToUpdateSortOrder"),
      );
      console.error("Error updating sort order:", error);
    } finally {
      sortSubmitting.value = false;
    }
  };

  onMounted(() => {
    loadGroups();
    if (!authStore.isSimpleMode) {
      void loadLiveCapability();
      loadModelAllowlistCandidates("create", 0, createForm.platform);
    }
    document.addEventListener("click", handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
    accountSearchRunner.clearAll();
    clearAllAccountSearchState();
  });

  return {
    supportsLivePlatform,
    emptyGroupPricing,
    addGroupPricing,
    groupPricingFromAPI,
    groupPricingToAPI,
    t,
    appStore,
    authStore,
    onboardingStore,
    ALWAYS_VISIBLE_COLUMNS,
    DEFAULT_HIDDEN_COLUMNS,
    HIDDEN_COLUMNS_KEY,
    COLUMN_SETTINGS_VERSION_KEY,
    COLUMN_SETTINGS_VERSION,
    VERSION_NEW_HIDDEN_COLUMNS,
    allColumns,
    toggleableColumns,
    hiddenColumns,
    showColumnDropdown,
    columnDropdownRef,
    getValidHiddenColumnKeys,
    loadSavedColumns,
    saveColumnsToStorage,
    isColumnVisible,
    hasVisibleUsageSummaryConsumer,
    hasVisibleCapacityColumn,
    toggleColumn,
    columns,
    statusOptions,
    exclusiveOptions,
    platformOptions,
    platformFilterOptions,
    compositeRoutePlatformOptions,
    compositeRouteEndpointOptions,
    compositeRouteMatchOptions,
    editStatusOptions,
    subscriptionTypeOptions,
    fallbackGroupOptions,
    fallbackGroupOptionsForEdit,
    invalidRequestFallbackOptions,
    invalidRequestFallbackOptionsForEdit,
    canCopyAccountsFromGroup,
    copyAccountsGroupLabel,
    copyAccountsGroupOptions,
    copyAccountsGroupOptionsForEdit,
    groups,
    loading,
    usageMap,
    usageLoading,
    capacityMap,
    searchQuery,
    filters,
    pagination,
    sortState,
    showCreateModal,
    showEditModal,
    showDeleteDialog,
    pendingLiveForm,
    showUnsupportedLiveConfirm,
    liveCapability,
    showSortModal,
    submitting,
    sortSubmitting,
    editingGroup,
    deletingGroup,
    duplicatingGroupIds,
    showRateMultipliersModal,
    rateMultipliersGroup,
    showRPMOverridesModal,
    rpmOverridesGroup,
    sortableGroups,
    showCompositeRoutesModal,
    compositeRoutesGroup,
    compositeRoutes,
    compositeRoutesLoading,
    compositeRouteSaving,
    compositeRouteEditingId,
    compositePreviewModel,
    compositePreviewEndpoint,
    compositePreviewLoading,
    compositePreviewDecision,
    compositeRouteForm,
    createMessagesDispatchDefaults,
    editMessagesDispatchDefaults,
    createModelAllowlistState,
    editModelAllowlistState,
    createModelAllowlistLoading,
    editModelAllowlistLoading,
    createReasoningEffortPolicyRef,
    editReasoningEffortPolicyRef,
    editCodexManifestRef,
    createCodexManifestDefaults,
    editCodexManifestConfig,
    editCodexManifestAccountNames,
    modelAllowlistCandidatesTracker,
    createModelAllowlistSelectedCount,
    editModelAllowlistSelectedCount,
    createAllowlistCustomEntry,
    editAllowlistCustomEntry,
    createAllowlistCustomErrorKey,
    editAllowlistCustomErrorKey,
    submitCreateAllowlistCustomEntry,
    submitEditAllowlistCustomEntry,
    createForm,
    createModelRoutingRules,
    editModelRoutingRules,
    resolveCreateRuleKey,
    resolveEditRuleKey,
    resolveCreateMessagesDispatchRowKey,
    resolveEditMessagesDispatchRowKey,
    getCreateRuleRenderKey,
    getEditRuleRenderKey,
    getCreateMessagesDispatchRowKey,
    getEditMessagesDispatchRowKey,
    getCreateRuleSearchKey,
    getEditRuleSearchKey,
    getRuleSearchKey,
    accountSearchKeyword,
    accountSearchResults,
    showAccountDropdown,
    clearAccountSearchStateByKey,
    clearAllAccountSearchState,
    accountSearchRunner,
    searchAccounts,
    searchAccountsByRule,
    selectAccount,
    removeSelectedAccount,
    toggleCreateScope,
    toggleEditScope,
    onAccountSearchFocus,
    addCreateRoutingRule,
    removeCreateRoutingRule,
    addEditRoutingRule,
    removeEditRoutingRule,
    resetModelAllowlistState,
    loadModelAllowlistCandidates,
    moveCreateModelAllowlistItem,
    moveEditModelAllowlistItem,
    convertRoutingRulesToApiFormat,
    convertApiFormatToRoutingRules,
    editForm,
    imagePricingTiers,
    videoPricingTiers,
    normalizePreviewNumber,
    parsePreviewPrice,
    formatImagePricePreview,
    formatVideoPricePreview,
    buildImageFinalPricePreview,
    buildVideoFinalPricePreview,
    createImageFinalPricePreview,
    editImageFinalPricePreview,
    createVideoFinalPricePreview,
    editVideoFinalPricePreview,
    DEFAULT_WEB_SEARCH_PRICE_PER_CALL,
    buildWebSearchFinalPricePreview,
    createWebSearchFinalPricePreview,
    editWebSearchFinalPricePreview,
    resetDisabledBatchImagePricing,
    deleteConfirmMessage,
    loadLiveCapability,
    toggleLive,
    confirmUnsupportedLive,
    cancelUnsupportedLive,
    loadGroups,
    formatCost,
    formatUsd,
    getQuotaUsageClass,
    loadUsageSummary,
    loadCapacitySummary,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    openCreateModal,
    closeCreateModal,
    normalizeOptionalLimit,
    normalizeRateMultiplier,
    percentToDecimal,
    decimalToPercent,
    validateProfitControlForm,
    handleCreateGroup,
    handleEdit,
    closeEditModal,
    handleUpdateGroup,
    addCreateMessagesDispatchMapping,
    removeCreateMessagesDispatchMapping,
    addEditMessagesDispatchMapping,
    removeEditMessagesDispatchMapping,
    handleRateMultipliers,
    handleRPMOverrides,
    handleDuplicate,
    compositeRouteMatchLabel,
    formatCompositeEndpoint,
    formatCompositePlatform,
    compositeRouteSourceLabel,
    resetCompositeRouteForm,
    toCompositeRouteInput,
    loadCompositeRoutes,
    handleCompositeRoutes,
    closeCompositeRoutesModal,
    editCompositeRoute,
    saveCompositeRoute,
    deleteCompositeRoute,
    previewCompositeRoute,
    handleDelete,
    confirmDelete,
    handleClickOutside,
    openSortModal,
    closeSortModal,
    saveSortOrder,
    ref,
    reactive,
    computed,
    onMounted,
    onUnmounted,
    watch,
    useI18n,
    useAppStore,
    useAuthStore,
    useOnboardingStore,
    adminAPI,
    apiIntervalsToForm,
    createDefaultTimePricingForm,
    formIntervalsToAPI,
    mTokToPerToken,
    perTokenToMTok,
    toNullableNumber,
    createStableObjectKeyResolver,
    extractApiErrorMessage,
    useKeyedDebouncedSearch,
    getPersistedPageSize,
    createDefaultMessagesDispatchFormState,
    messagesDispatchConfigToFormState,
    messagesDispatchFormStateToConfig,
    resetMessagesDispatchFormState,
    supportsMessagesDispatchPlatform,
    normalizeGroupOpenAIFast,
    supportsGroupOpenAIFast,
    addCustomModelAllowlistItem,
    buildModelAllowlistConfig,
    createInitialModelAllowlistState,
    invertModelAllowlistSelection,
    moveModelAllowlistItem,
    selectAllModelAllowlistItems,
    setModelAllowlistCandidates,
    createModelAllowlistCandidatesTracker,
    normalizeSupportedModelScopesForPlatform,
    isProfitControlPlatform,
    profitPercentToDecimal,
    profitDecimalToPercent,
    validateProfitControlFormState,
    normalizeReasoningEffortForPlatform,
    normalizeReasoningEffortOverLimit,
    reasoningEffortMappingsToAPI,
    reasoningEffortMappingsToRows,
    reasoningEffortOverLimitDowngrade,
    supportsReasoningEffortPolicyPlatform,
    getDefaultImagePreviewPrice,
    getDefaultVideoPreviewPrice,
    getImagePricePlaceholder,
    getVideoPricePlaceholder,
    imagePricingI18nKey,
    supportsImagePricingPlatform,
    supportsVideoPricingPlatform,
    videoPricingI18nKey,
    createVideoModelPricesForm,
    grokVideoPriceResolutions,
    serializeVideoModelPrices,
    videoModelPriceFamilyRows,
  };
}

export type GroupsViewContext = ReturnType<typeof useGroupsView>;
