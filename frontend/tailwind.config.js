import defaultColors from 'tailwindcss/colors'

// 设计令牌层（openspec: rebuild-frontend-design-system, Phase 1）
//
// 语义色通过 CSS 变量定义在 style.css 的 :root / .dark 中，模板里直接写
// `bg-surface`、`text-fg-muted`、`border-border`，无需 dark: 前缀。
// 旧的 gray-* / dark-* / primary-* 数值色阶保留为兼容别名，并重新映射到
// 新的中性色，这样现有 .vue 文件在不改动的情况下就会切换到新色板。
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

// 中性色阶（浅色模式）
const neutral = {
  50: '#f3f6fa',
  100: '#e9eef5',
  200: '#d6dfea',
  300: '#b7c5d6',
  400: '#8a9ab0',
  500: '#687484',
  600: '#546070',
  700: '#3a4452',
  800: '#2a313b',
  900: '#20242a',
  950: '#12161c'
}

// 深色模式表面色阶（模板里以 dark:bg-dark-800 等形式使用）
const darkSurface = {
  50: '#e8ecf2',
  100: '#d2dae5',
  200: '#b4c0d0',
  300: '#a0acbe',
  400: '#7d8ba0',
  500: '#56657c',
  600: '#405470',
  700: '#263347',
  800: '#161f2e',
  900: '#111824',
  950: '#0b1019'
}

// 账单蓝（Metered Utility Bill 视觉世界）
const billBlue = {
  50: '#f1f5fb',
  100: '#e7eef7',
  200: '#c7d7ec',
  300: '#9bb8dd',
  400: '#7aa6e0',
  500: '#3d6bab',
  600: '#1f4e8c',
  700: '#1f4e8c',
  800: '#163a6b',
  900: '#10294b',
  950: '#0a1a30'
}

// 电表黄：只标记“当前读数”和需要注意的位置
const meterYellow = {
  50: '#fefaeb',
  100: '#fdf3d0',
  200: '#fae59c',
  300: '#f6d468',
  400: '#f2c230',
  500: '#e0ab12',
  600: '#b3850a',
  700: '#8a650a',
  800: '#5c4500',
  900: '#3d2e00',
  950: '#261c00'
}

const semantic = (scale, name) => ({
  ...scale,
  DEFAULT: v(name),
  weak: v(`${name}-weak`),
  strong: v(`${name}-strong`)
})

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    // 字号：7 级，每级绑定行高。旧名称（xs/sm/…）映射到新刻度，供现有模板过渡。
    fontSize: {
      meta: ['12px', { lineHeight: '1.4' }],
      label: ['13px', { lineHeight: '1.4' }],
      body: ['14px', { lineHeight: '1.55' }],
      h3: ['15px', { lineHeight: '1.4' }],
      h2: ['18px', { lineHeight: '1.3' }],
      h1: ['24px', { lineHeight: '1.25' }],
      display: ['30px', { lineHeight: '1.15' }],
      // 兼容别名
      xs: ['12px', { lineHeight: '1.4' }],
      sm: ['14px', { lineHeight: '1.55' }],
      base: ['15px', { lineHeight: '1.4' }],
      lg: ['18px', { lineHeight: '1.3' }],
      xl: ['20px', { lineHeight: '1.3' }],
      '2xl': ['24px', { lineHeight: '1.25' }],
      '3xl': ['30px', { lineHeight: '1.15' }],
      '4xl': ['36px', { lineHeight: '1.1' }],
      '5xl': ['48px', { lineHeight: '1' }]
    },
    // 圆角：印刷账单的直角感，最大 4px；pill 仅留给开关/头像。
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '2px',
      md: '3px',
      lg: '4px',
      xl: '4px',
      '2xl': '4px',
      '3xl': '4px',
      full: '9999px'
    },
    // 阴影：只保留浮层一档。卡片用 1px 边框。
    boxShadow: {
      none: '0 0 #0000',
      sm: '0 0 #0000',
      DEFAULT: '0 0 #0000',
      md: '0 0 #0000',
      card: '0 0 #0000',
      inner: 'inset 0 1px 2px rgba(15, 20, 28, 0.08)',
      overlay: '0 8px 24px rgba(15, 20, 28, 0.12)',
      lg: '0 8px 24px rgba(15, 20, 28, 0.12)',
      xl: '0 8px 24px rgba(15, 20, 28, 0.12)',
      '2xl': '0 8px 24px rgba(15, 20, 28, 0.12)'
    },
    extend: {
      colors: {
        // ---- 语义令牌（CSS 变量，自动切换明暗）----
        surface: {
          DEFAULT: v('surface'),
          sunken: v('surface-sunken'),
          raised: v('surface-raised')
        },
        border: {
          DEFAULT: v('border'),
          strong: v('border-strong')
        },
        fg: {
          DEFAULT: v('fg'),
          muted: v('fg-muted'),
          subtle: v('fg-subtle')
        },
        accent: semantic(billBlue, 'accent'),
        meter: { ...meterYellow, DEFAULT: v('meter'), weak: v('meter-weak'), ink: v('meter-ink') },
        success: semantic(defaultColors.emerald, 'success'),
        warning: semantic(defaultColors.amber, 'warning'),
        danger: semantic(defaultColors.red, 'danger'),
        // ---- 兼容别名 ----
        primary: semantic(billBlue, 'accent'),
        gray: neutral,
        dark: darkSurface
      },
      fontFamily: {
        sans: [
          'Be Vietnam Pro',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
}
