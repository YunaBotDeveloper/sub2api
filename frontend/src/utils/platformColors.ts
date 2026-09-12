/**
 * Centralized platform color definitions.
 *
 * All components that need platform-specific styling should import from here
 * instead of defining their own color mappings.
 */

export type Platform =
  | 'anthropic'
  | 'openai'
  | 'antigravity'
  | 'gemini'
  | 'grok'
  | 'kimi'
  | 'zhipu'
  | 'deepseek'
  | 'minimax'
  | 'opencode_go'
  | 'composite'

// ── Badge (bg + text + border, for inline badges with border) ───────
const BADGE: Record<Platform, string> = {
  anthropic: 'bg-warning-500/10 text-warning-600 border-warning-500/30 dark:text-warning-400',
  openai: 'bg-success-500/10 text-success-600 border-success-500/30 dark:text-success-400',
  antigravity: 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400',
  gemini: 'bg-accent-500/10 text-accent-600 border-accent-500/30 dark:text-accent-400',
  grok: 'bg-gray-800/10 text-gray-800 border-gray-800/30 dark:bg-gray-500/10 dark:text-gray-200 dark:border-gray-500/30',
  kimi: 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400',
  zhipu: 'bg-accent-500/10 text-accent-600 border-accent-500/30 dark:text-accent-400',
  deepseek: 'bg-accent-500/10 text-accent-600 border-accent-500/30 dark:text-accent-400',
  minimax: 'bg-danger-500/10 text-danger-600 border-danger-500/30 dark:text-danger-400',
  opencode_go: 'bg-warning-500/10 text-warning-700 border-warning-500/30 dark:text-warning-300',
  composite: 'bg-accent-500/10 text-accent-700 border-accent-500/30 dark:text-accent-300',
}
const BADGE_DEFAULT = 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400'

// ── Light badge (softer bg, no border) ──────────────────────────────
const BADGE_LIGHT: Record<Platform, string> = {
  anthropic: 'bg-warning-500/10 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300',
  openai: 'bg-success-500/10 text-success-600 dark:bg-success-500/10 dark:text-success-300',
  antigravity: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/10 dark:text-gray-300',
  gemini: 'bg-accent-500/10 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300',
  grok: 'bg-gray-800/10 text-gray-800 dark:bg-gray-500/10 dark:text-gray-200',
  kimi: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/10 dark:text-gray-300',
  zhipu: 'bg-accent-500/10 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300',
  deepseek: 'bg-accent-500/10 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300',
  minimax: 'bg-danger-500/10 text-danger-600 dark:bg-danger-500/10 dark:text-danger-300',
  opencode_go: 'bg-warning-500/10 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300',
  composite: 'bg-accent-500/10 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300',
}

// ── Border ──────────────────────────────────────────────────────────
const BORDER: Record<Platform, string> = {
  anthropic: 'border-warning-500/20 dark:border-warning-500/20',
  openai: 'border-success-500/20 dark:border-success-500/20',
  antigravity: 'border-gray-500/20 dark:border-gray-500/20',
  gemini: 'border-accent-500/20 dark:border-accent-500/20',
  grok: 'border-gray-800/20 dark:border-gray-500/20',
  kimi: 'border-gray-500/20 dark:border-gray-500/20',
  zhipu: 'border-accent-500/20 dark:border-accent-500/20',
  deepseek: 'border-accent-500/20 dark:border-accent-500/20',
  minimax: 'border-danger-500/20 dark:border-danger-500/20',
  opencode_go: 'border-warning-500/20 dark:border-warning-500/20',
  composite: 'border-accent-500/20 dark:border-accent-500/20',
}
const BORDER_DEFAULT = 'border-gray-200 dark:border-dark-700'

// ── Border strong (higher-contrast platform tint, e.g. plaza group cards) ──
const BORDER_STRONG: Record<Platform, string> = {
  anthropic: 'border-warning-500/35 dark:border-warning-500/30',
  openai: 'border-success-500/35 dark:border-success-500/30',
  antigravity: 'border-gray-500/35 dark:border-gray-500/30',
  gemini: 'border-accent-500/35 dark:border-accent-500/30',
  grok: 'border-gray-800/35 dark:border-gray-500/35',
  kimi: 'border-gray-500/35 dark:border-gray-500/30',
  zhipu: 'border-accent-500/35 dark:border-accent-500/30',
  deepseek: 'border-accent-500/35 dark:border-accent-500/30',
  minimax: 'border-danger-500/35 dark:border-danger-500/30',
  opencode_go: 'border-warning-500/35 dark:border-warning-500/30',
  composite: 'border-accent-500/35 dark:border-accent-500/30',
}
const BORDER_STRONG_DEFAULT = 'border-gray-300 dark:border-dark-600'

// ── Accent (single raw color per platform; consumers derive washes/tints
//    from it via CSS color-mix, e.g. plaza paid-price zone) ──
const ACCENT: Record<Platform, string> = {
  anthropic: '#f97316', // warning-500
  openai: '#22c55e', // success-500
  antigravity: '#a855f7', // gray-500
  gemini: '#3b82f6', // accent-500
  grok: '#71717a', // gray-500
  kimi: '#ec4899', // gray-500
  zhipu: '#6366f1', // accent-500
  deepseek: '#14b8a6', // accent-500
  minimax: '#f43f5e', // danger-500
  opencode_go: '#f59e0b', // warning-500
  composite: '#06b6d4', // accent-500
}
const ACCENT_DEFAULT = '#14b8a6' // primary-500 (teal)

// ── Accent bar (gradient) ───────────────────────────────────────────
const ACCENT_BAR: Record<Platform, string> = {
  anthropic: ' bg-warning-400',
  openai: ' bg-success-400',
  antigravity: ' bg-gray-400',
  gemini: ' bg-accent-400',
  grok: ' bg-gray-700',
  kimi: ' bg-gray-400',
  zhipu: ' bg-accent-400',
  deepseek: ' bg-accent-400',
  minimax: ' bg-danger-400',
  opencode_go: ' bg-warning-400',
  composite: ' bg-gray-500',
}
const ACCENT_BAR_DEFAULT = ' bg-primary-400'

// ── Text (price, icon) ─────────────────────────────────────────────
const TEXT: Record<Platform, string> = {
  anthropic: 'text-warning-600 dark:text-warning-400',
  openai: 'text-success-600 dark:text-success-400',
  antigravity: 'text-gray-600 dark:text-gray-400',
  gemini: 'text-accent-600 dark:text-accent-400',
  grok: 'text-gray-800 dark:text-gray-200',
  kimi: 'text-gray-600 dark:text-gray-400',
  zhipu: 'text-accent-600 dark:text-accent-400',
  deepseek: 'text-accent-600 dark:text-accent-400',
  minimax: 'text-danger-600 dark:text-danger-400',
  opencode_go: 'text-warning-700 dark:text-warning-300',
  composite: 'text-accent-700 dark:text-accent-300',
}
const TEXT_DEFAULT = 'text-primary-600 dark:text-primary-400'

// ── Icon (check mark etc.) ──────────────────────────────────────────
const ICON: Record<Platform, string> = {
  anthropic: 'text-warning-500 dark:text-warning-400',
  openai: 'text-success-500 dark:text-success-400',
  antigravity: 'text-gray-500 dark:text-gray-400',
  gemini: 'text-accent-500 dark:text-accent-400',
  grok: 'text-gray-800 dark:text-gray-200',
  kimi: 'text-gray-500 dark:text-gray-400',
  zhipu: 'text-accent-500 dark:text-accent-400',
  deepseek: 'text-accent-500 dark:text-accent-400',
  minimax: 'text-danger-500 dark:text-danger-400',
  opencode_go: 'text-warning-500 dark:text-warning-300',
  composite: 'text-accent-600 dark:text-accent-300',
}
const ICON_DEFAULT = 'text-primary-500 dark:text-primary-400'

// ── Button (solid bg) ───────────────────────────────────────────────
const BUTTON: Record<Platform, string> = {
  anthropic: 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 dark:bg-warning-500/80 dark:hover:bg-warning-500',
  openai: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 dark:bg-success-600/80 dark:hover:bg-success-600',
  antigravity: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 dark:bg-gray-500/80 dark:hover:bg-gray-500',
  gemini: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 dark:bg-accent-500/80 dark:hover:bg-accent-500',
  grok: 'bg-gray-800 text-white hover:bg-gray-900 active:bg-black dark:bg-gray-700 dark:hover:bg-gray-600',
  kimi: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 dark:bg-gray-500/80 dark:hover:bg-gray-500',
  zhipu: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 dark:bg-accent-500/80 dark:hover:bg-accent-500',
  deepseek: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 dark:bg-accent-500/80 dark:hover:bg-accent-500',
  minimax: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 dark:bg-danger-500/80 dark:hover:bg-danger-500',
  opencode_go: 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 dark:bg-warning-500/80 dark:hover:bg-warning-500',
  composite: 'bg-accent-700 text-white hover:bg-accent-800 active:bg-accent-900 dark:bg-accent-600 dark:hover:bg-accent-500',
}
const BUTTON_DEFAULT = 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500'

// ── Discount badge ──────────────────────────────────────────────────
const DISCOUNT: Record<Platform, string> = {
  anthropic: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  openai: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  antigravity: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  gemini: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  grok: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  kimi: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
  zhipu: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  deepseek: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  minimax: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300',
  opencode_go: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
  composite: 'bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300',
}
const DISCOUNT_DEFAULT = 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300'

// ── Header gradient (subscription confirm) ─────────────────────────
const GRADIENT: Record<Platform, string> = {
  anthropic: 'bg-warning-500',
  openai: 'bg-success-500',
  antigravity: 'bg-gray-500',
  gemini: 'bg-accent-500',
  grok: 'bg-gray-700',
  kimi: 'bg-gray-500',
  zhipu: 'bg-accent-500',
  deepseek: 'bg-accent-500',
  minimax: 'bg-danger-500',
  opencode_go: 'bg-warning-500',
  composite: 'bg-gray-600',
}
const GRADIENT_DEFAULT = 'bg-primary-500'

// ── Header text (light text on gradient bg) ────────────────────────
const GRADIENT_TEXT: Record<Platform, string> = {
  anthropic: 'text-warning-100',
  openai: 'text-success-100',
  antigravity: 'text-gray-100',
  gemini: 'text-accent-100',
  grok: 'text-gray-100',
  kimi: 'text-gray-100',
  zhipu: 'text-accent-100',
  deepseek: 'text-accent-100',
  minimax: 'text-danger-100',
  opencode_go: 'text-warning-100',
  composite: 'text-accent-100',
}
const GRADIENT_TEXT_DEFAULT = 'text-primary-100'

const GRADIENT_SUBTEXT: Record<Platform, string> = {
  anthropic: 'text-warning-200',
  openai: 'text-success-200',
  antigravity: 'text-gray-200',
  gemini: 'text-accent-200',
  grok: 'text-gray-300',
  kimi: 'text-gray-200',
  zhipu: 'text-accent-200',
  deepseek: 'text-accent-200',
  minimax: 'text-danger-200',
  opencode_go: 'text-warning-200',
  composite: 'text-accent-200',
}
const GRADIENT_SUBTEXT_DEFAULT = 'text-primary-200'

// ── Public API ──────────────────────────────────────────────────────

function isPlatform(p: string): p is Platform {
  return (
    p === 'anthropic' ||
    p === 'openai' ||
    p === 'antigravity' ||
    p === 'gemini' ||
    p === 'grok' ||
    p === 'kimi' ||
    p === 'zhipu' ||
    p === 'deepseek' ||
    p === 'minimax' ||
    p === 'opencode_go' ||
    p === 'composite'
  )
}

export function platformBadgeClass(p: string): string {
  return isPlatform(p) ? BADGE[p] : BADGE_DEFAULT
}

export function platformBadgeLightClass(p: string): string {
  return isPlatform(p) ? BADGE_LIGHT[p] : BADGE_DEFAULT
}

export function platformBorderClass(p: string): string {
  return isPlatform(p) ? BORDER[p] : BORDER_DEFAULT
}

export function platformBorderStrongClass(p: string): string {
  return isPlatform(p) ? BORDER_STRONG[p] : BORDER_STRONG_DEFAULT
}

export function platformAccentColor(p: string): string {
  return isPlatform(p) ? ACCENT[p] : ACCENT_DEFAULT
}

export function platformAccentBarClass(p: string): string {
  return isPlatform(p) ? ACCENT_BAR[p] : ACCENT_BAR_DEFAULT
}

export function platformTextClass(p: string): string {
  return isPlatform(p) ? TEXT[p] : TEXT_DEFAULT
}

export function platformIconClass(p: string): string {
  return isPlatform(p) ? ICON[p] : ICON_DEFAULT
}

export function platformButtonClass(p: string): string {
  return isPlatform(p) ? BUTTON[p] : BUTTON_DEFAULT
}

export function platformDiscountClass(p: string): string {
  return isPlatform(p) ? DISCOUNT[p] : DISCOUNT_DEFAULT
}

export function platformGradientClass(p: string): string {
  return isPlatform(p) ? GRADIENT[p] : GRADIENT_DEFAULT
}

export function platformGradientTextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_TEXT[p] : GRADIENT_TEXT_DEFAULT
}

export function platformGradientSubtextClass(p: string): string {
  return isPlatform(p) ? GRADIENT_SUBTEXT[p] : GRADIENT_SUBTEXT_DEFAULT
}

export function platformLabel(p: string): string {
  switch (p) {
    case 'anthropic': return 'Anthropic'
    case 'openai': return 'OpenAI'
    case 'antigravity': return 'Antigravity'
    case 'gemini': return 'Gemini'
    case 'grok': return 'Grok'
    case 'kimi': return 'Kimi'
    case 'zhipu': return 'Zhipu GLM'
    case 'deepseek': return 'DeepSeek'
    case 'minimax': return 'MiniMax'
    case 'opencode_go': return 'OpenCode'
    case 'composite': return 'Composite'
    default: return p || 'API'
  }
}
