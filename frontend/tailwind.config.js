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
  50: '#f6f7f9',
  100: '#eef0f3',
  200: '#e3e6ea',
  300: '#c9cfd6',
  400: '#9aa4af',
  500: '#6e7885',
  600: '#5b6673',
  700: '#3d4652',
  800: '#262d36',
  900: '#12161c',
  950: '#0a0d12'
}

// 深色模式表面色阶（模板里以 dark:bg-dark-800 等形式使用）
const darkSurface = {
  50: '#f3f5f7',
  100: '#e6eaef',
  200: '#c3cbd3',
  300: '#9aa6b2',
  400: '#6b7787',
  500: '#4d5867',
  600: '#39424e',
  700: '#262d36',
  800: '#161b22',
  900: '#0f1319',
  950: '#0a0d12'
}

const teal = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e'
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
    // 圆角：3 级 + pill。旧的 xl/2xl/3xl 全部收敛到 8px。
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '8px',
      xl: '8px',
      '2xl': '8px',
      '3xl': '8px',
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
        accent: semantic(teal, 'accent'),
        success: semantic(defaultColors.emerald, 'success'),
        warning: semantic(defaultColors.amber, 'warning'),
        danger: semantic(defaultColors.red, 'danger'),
        // ---- 兼容别名 ----
        primary: semantic(teal, 'accent'),
        gray: neutral,
        dark: darkSurface
      },
      fontFamily: {
        sans: [
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
