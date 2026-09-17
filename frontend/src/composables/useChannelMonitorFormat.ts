/**
 * Shared formatting helpers for channel monitor views (admin + user).
 *
 * Centralises:
 *  - status / provider label + badge class lookups
 *  - latency / availability / percent number formatting
 *  - dashboard-style helpers (HSL for availability, provider gradient, relative time)
 *
 * i18n keys live under `monitorCommon.*` so admin and user views share the
 * same translation source.
 */

import { useI18n } from 'vue-i18n'
import type { CheckMode, MonitorStatus, Provider } from '@/api/admin/channelMonitor'
import {
  PROVIDER_OPENAI,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  PROVIDER_GROK,
  PROVIDER_ANTIGRAVITY,
  PROVIDER_KIMI,
  PROVIDER_ZHIPU,
  PROVIDER_DEEPSEEK,
  PROVIDER_MINIMAX,
  PROVIDER_OPENCODE_GO,
  PROVIDERS,
  STATUS_OPERATIONAL,
  STATUS_DEGRADED,
  STATUS_FAILED,
  STATUS_ERROR,
  CHECK_MODE_PROBE,
  CHECK_MODE_QUOTA,
  CHECK_MODE_QUOTA_PROBE,
} from '@/constants/channelMonitor'

const NEUTRAL_BADGE = 'bg-surface-sunken text-fg-muted'

/** Availability HSL hue multiplier: 0%=red(0) / 50%=yellow(60) / 100%=green(120). */
const HSL_HUE_PER_PERCENT = 1.2
const HSL_SATURATION = 72
const HSL_LIGHTNESS = 42

export interface AvailabilityRow {
  primary_status: MonitorStatus | ''
  availability_7d: number | null | undefined
}

export function useChannelMonitorFormat() {
  const { t } = useI18n()

  function statusLabel(s: MonitorStatus | ''): string {
    if (!s) return t('monitorCommon.status.unknown')
    return t(`monitorCommon.status.${s}`)
  }

  function statusBadgeClass(s: MonitorStatus | ''): string {
    switch (s) {
      case STATUS_OPERATIONAL:
        return 'bg-success-weak text-success-strong'
      case STATUS_DEGRADED:
        return 'bg-warning-weak text-warning-strong'
      case STATUS_FAILED:
        return 'bg-danger-weak text-danger-strong'
      case STATUS_ERROR:
      default:
        return NEUTRAL_BADGE
    }
  }

  function providerLabel(p: Provider | string): string {
    if (PROVIDERS.includes(p as Provider)) {
      return t(`monitorCommon.providers.${p}`)
    }
    return p || '-'
  }

  function checkModeLabel(m: CheckMode | string): string {
    if (m === 'probe' || m === 'quota' || m === 'quota_probe') {
      return t(`monitorCommon.checkMode.${m}`)
    }
    return m || '-'
  }

  /**
   * Display label for a monitor's primary model. Pure-quota monitors carry the
   * literal placeholder "quota" (the probe target is an account, not a model),
   * which must not leak into the UI as a fake model name — render the
   * localized mode label instead. quota_probe keeps a real model name.
   */
  const QUOTA_MODEL_PLACEHOLDER = 'quota'

  function formatMonitorModel(model: string): string {
    if (model === QUOTA_MODEL_PLACEHOLDER) {
      return t('monitorCommon.checkMode.quota')
    }
    return model
  }

  function providerBadgeClass(p: Provider | string): string {
    switch (p) {
      case PROVIDER_OPENAI:
        return 'bg-success-weak text-success-strong'
      case PROVIDER_ANTHROPIC:
        return 'bg-warning-weak text-warning-strong'
      case PROVIDER_GEMINI:
        return 'bg-accent-weak text-accent-strong'
      case PROVIDER_GROK:
        return 'bg-surface-sunken text-fg-muted'
      // 配色与 utils/platformColors.ts 的平台色对齐：antigravity=purple /
      // kimi=pink / zhipu=indigo / deepseek=teal。
      case PROVIDER_ANTIGRAVITY:
        return 'bg-surface-sunken text-fg-muted'
      case PROVIDER_KIMI:
        return 'bg-surface-sunken text-fg-muted'
      case PROVIDER_ZHIPU:
        return 'bg-accent-weak text-accent-strong'
      case PROVIDER_DEEPSEEK:
        return 'bg-accent-weak text-accent-strong'
      case PROVIDER_MINIMAX:
        return 'bg-danger-weak text-danger-strong'
      case PROVIDER_OPENCODE_GO:
        return 'bg-warning-weak text-warning-strong'
      default:
        return NEUTRAL_BADGE
    }
  }

  /**
   * Tailwind class for the check-mode badge shown next to the provider badge
   * in the admin monitor list. Quota-bearing modes = blue (数据源是账号配额),
   * plain probe = neutral grey.
   */
  function checkModeBadgeClass(m: CheckMode | string): string {
    switch (m) {
      case CHECK_MODE_QUOTA:
      case CHECK_MODE_QUOTA_PROBE:
        return 'bg-accent-weak text-accent-strong'
      case CHECK_MODE_PROBE:
      default:
        return NEUTRAL_BADGE
    }
  }

  /**
   * Tailwind class for a provider radio-button-style picker (active/inactive state).
   * Reuses the same emerald/orange/sky palette as providerBadgeClass to keep
   * visual semantics consistent across badges and pickers.
   */
  function providerPickerClass(p: Provider | string, active: boolean): string {
    switch (p) {
      case PROVIDER_OPENAI:
        return active
          ? 'border-success bg-success-weak text-success-strong'
          : 'border-border bg-surface text-fg-muted hover:border-success hover:text-success-strong'
      case PROVIDER_ANTHROPIC:
        return active
          ? 'border-warning bg-warning-weak text-warning-strong'
          : 'border-border bg-surface text-fg-muted hover:border-warning hover:text-warning-strong'
      case PROVIDER_GEMINI:
        return active
          ? 'border-accent bg-accent-weak text-accent-strong'
          : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent-strong'
      case PROVIDER_GROK:
        return active
          ? 'border-border-strong bg-surface-sunken text-fg'
          : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
      case PROVIDER_ANTIGRAVITY:
        return active
          ? 'border-border-strong bg-surface-sunken text-fg'
          : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
      case PROVIDER_KIMI:
        return active
          ? 'border-border-strong bg-surface-sunken text-fg'
          : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
      case PROVIDER_ZHIPU:
        return active
          ? 'border-accent bg-accent-weak text-accent-strong'
          : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent-strong'
      case PROVIDER_DEEPSEEK:
        return active
          ? 'border-accent bg-accent-weak text-accent-strong'
          : 'border-border bg-surface text-fg-muted hover:border-accent hover:text-accent-strong'
      case PROVIDER_MINIMAX:
        return active
          ? 'border-danger bg-danger-weak text-danger-strong'
          : 'border-border bg-surface text-fg-muted hover:border-danger hover:text-danger-strong'
      case PROVIDER_OPENCODE_GO:
        return active
          ? 'border-warning bg-warning-weak text-warning-strong'
          : 'border-border bg-surface text-fg-muted hover:border-warning hover:text-warning-strong'
      default:
        return active
          ? 'border-border-strong bg-surface-sunken text-fg'
          : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
    }
  }

  function formatLatency(ms: number | null | undefined): string {
    if (ms == null) return t('monitorCommon.latencyEmpty')
    return String(Math.round(ms))
  }

  function formatPercent(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return '-'
    return `${v.toFixed(2)}%`
  }

  function formatAvailability(row: AvailabilityRow): string {
    if (!row.primary_status) return '-'
    return formatPercent(row.availability_7d)
  }

  function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return t('monitorCommon.latencyEmpty')
    const ts = Date.parse(iso)
    if (Number.isNaN(ts)) return t('monitorCommon.latencyEmpty')
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
    if (diffSec < 60) return t('monitorCommon.relativeSecondsAgo', { n: diffSec })
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return t('monitorCommon.relativeMinutesAgo', { n: diffMin })
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return t('monitorCommon.relativeHoursAgo', { n: diffHour })
    const diffDay = Math.floor(diffHour / 24)
    return t('monitorCommon.relativeDaysAgo', { n: diffDay })
  }

  return {
    statusLabel,
    statusBadgeClass,
    providerLabel,
    checkModeLabel,
    formatMonitorModel,
    providerBadgeClass,
    checkModeBadgeClass,
    providerPickerClass,
    formatLatency,
    formatPercent,
    formatAvailability,
    formatRelativeTime,
  }
}

/**
 * Map availability percent to an HSL colour (red -> yellow -> green).
 * Returns undefined for null/NaN so callers can fall back to a neutral colour.
 */
export function hslForPct(pct: number | null | undefined): string | undefined {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return undefined
  const clamped = Math.max(0, Math.min(100, pct))
  const hue = clamped * HSL_HUE_PER_PERCENT
  return `hsl(${hue} ${HSL_SATURATION}% ${HSL_LIGHTNESS}%)`
}

/**
 * Tailwind gradient class for the provider icon tile background.
 */
export function providerGradient(provider: string): string {
  switch (provider) {
    case PROVIDER_OPENAI:
      return ' bg-success-weak'
    case PROVIDER_ANTHROPIC:
      return ' bg-warning-weak'
    case PROVIDER_GEMINI:
      return ' bg-accent-weak'
    case PROVIDER_GROK:
      return ' bg-surface-sunken'
    case PROVIDER_ANTIGRAVITY:
      return ' bg-surface-sunken'
    case PROVIDER_KIMI:
      return ' bg-surface-sunken'
    case PROVIDER_ZHIPU:
      return ' bg-accent-weak'
    case PROVIDER_DEEPSEEK:
      return ' bg-accent-weak'
    case PROVIDER_MINIMAX:
      return ' bg-danger-weak'
    case PROVIDER_OPENCODE_GO:
      return ' bg-warning-weak'
    default:
      return ' bg-surface-sunken'
  }
}
