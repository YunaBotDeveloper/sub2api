import { computed, readonly, ref } from 'vue'

/**
 * Chart palette for the metered-utility-bill world.
 * Colors are read from the CSS tokens in style.css at runtime, so a theme toggle
 * (the `.dark` class on <html>) re-themes every chart that uses `useChartTheme()`.
 *
 * Series order: bill blue first, then ink, grey-blue, success, warning.
 * Meter yellow is not in the rotation; use `theme.meter` only for the current/highlight series.
 */

type Rgb = [number, number, number]

// Light-mode fallbacks (match :root in style.css) for SSR / jsdom where CSS vars are unavailable.
const FALLBACK: Record<string, Rgb> = {
  surface: [255, 255, 255],
  'surface-sunken': [243, 246, 250],
  border: [214, 223, 234],
  'border-strong': [158, 178, 204],
  fg: [32, 36, 42],
  'fg-muted': [84, 96, 112],
  'fg-subtle': [104, 116, 132],
  accent: [31, 78, 140],
  'accent-weak': [231, 238, 247],
  'accent-strong': [22, 58, 107],
  meter: [242, 194, 48],
  success: [21, 115, 71],
  'success-strong': [15, 90, 55],
  warning: [168, 90, 0],
  danger: [180, 35, 24]
}

const isDark = ref(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
let observing = false

function observeTheme() {
  if (observing || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
  observing = true
  new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

function readToken(name: string): Rgb {
  if (typeof document !== 'undefined' && typeof getComputedStyle === 'function') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
    const parts = raw.split(/[\s,]+/).map(Number)
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) return parts as Rgb
  }
  return FALLBACK[name]
}

/** `rgba(r, g, b, a)` string that chart.js and canvas both parse. */
export function tokenColor(name: string, alpha = 1): string {
  const [r, g, b] = readToken(name)
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Re-apply alpha to a color produced by `tokenColor`. */
export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})` : color
}

function readFontFamily(): string {
  if (typeof document !== 'undefined' && document.body && typeof getComputedStyle === 'function') {
    const family = getComputedStyle(document.body).fontFamily
    if (family) return family
  }
  return "'Be Vietnam Pro', system-ui, sans-serif"
}

export function buildChartTheme() {
  const theme = {
    dark: isDark.value,
    fg: tokenColor('fg'),
    fgMuted: tokenColor('fg-muted'),
    fgSubtle: tokenColor('fg-subtle'),
    border: tokenColor('border'),
    borderStrong: tokenColor('border-strong'),
    surface: tokenColor('surface'),
    accent: tokenColor('accent'),
    accentWeak: tokenColor('accent-weak'),
    accentStrong: tokenColor('accent-strong'),
    meter: tokenColor('meter'),
    success: tokenColor('success'),
    warning: tokenColor('warning'),
    danger: tokenColor('danger'),
    fontFamily: readFontFamily()
  }
  const series = [
    theme.accent,
    theme.fg,
    theme.borderStrong,
    theme.success,
    theme.warning,
    tokenColor('accent', 0.55),
    theme.fgMuted,
    tokenColor('success-strong'),
    theme.danger,
    tokenColor('fg', 0.35)
  ]
  return {
    ...theme,
    series,
    /** Categorical color by index; cycles through the bill palette. */
    seriesColor: (index: number) => series[index % series.length],
    /** Shared chart.js pieces: legend/ticks/grid/tooltip in bill grammar. */
    font: (size = 11, weight: number | 'normal' | 'bold' = 'normal') => ({ family: theme.fontFamily, size, weight }),
    tooltip: {
      backgroundColor: theme.surface,
      titleColor: theme.fg,
      bodyColor: theme.fg,
      footerColor: theme.fgMuted,
      borderColor: theme.borderStrong,
      borderWidth: 1,
      cornerRadius: 2,
      padding: 8,
      boxPadding: 4,
      titleFont: { family: theme.fontFamily, size: 12, weight: 'bold' as const },
      bodyFont: { family: theme.fontFamily, size: 12 },
      footerFont: { family: theme.fontFamily, size: 11 }
    }
  }
}

export type ChartTheme = ReturnType<typeof buildChartTheme>

/** Reactive chart theme; recomputes when the `.dark` class on <html> changes. */
export function useChartTheme() {
  observeTheme()
  return computed<ChartTheme>(() => {
    void isDark.value
    return buildChartTheme()
  })
}

export const chartDarkMode = readonly(isDark)
