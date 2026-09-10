module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
    extraFileExtensions: [".vue"],
  },
  plugins: ["vue", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-essential",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-constant-condition": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-useless-escape": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-use-v-if-with-v-for": "off",
    // 设计系统约束（openspec: rebuild-frontend-design-system）
    // 模板 class 里禁止：令牌之外的原始色族、原始 hex、渐变、大圆角、发光阴影、毛玻璃
    "vue/no-restricted-class": [
      "error",
      "/\\b(?:[a-z]+-)*(?:blue|sky|indigo|violet|purple|fuchsia|pink|cyan|lime|teal|zinc|slate|emerald|green|amber|yellow|orange|red|rose)-\\d{2,3}\\b/",
      "/\\[#[0-9a-fA-F]{3,8}\\]/",
      "/\\bbg-gradient-to-/",
      "/\\brounded(?:-[trbl]{1,2})?-(?:2xl|3xl)\\b/",
      "/\\bshadow-glow/",
      "/\\bbackdrop-blur/",
    ],
    // <script> 里的 class 字符串同样受限
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Literal[value=/\\b(?:[a-z]+-)*(?:blue|sky|indigo|violet|purple|fuchsia|pink|cyan|lime|teal|zinc|slate|emerald|green|amber|yellow|orange|red|rose)-\\d{2,3}\\b/]",
        message: "使用语义色令牌（accent/success/warning/danger/gray），不要使用原始色族。",
      },
      {
        selector: "Literal[value=/\\bbg-gradient-to-|\\bbackdrop-blur|\\brounded(?:-[trbl]{1,2})?-(?:2xl|3xl)\\b|\\bshadow-glow/]",
        message: "设计系统不允许渐变、毛玻璃、2xl/3xl 圆角和发光阴影。",
      },
    ],
  },
  overrides: [
    {
      // 测试里允许出现旧类名字符串（用于断言迁移行为）
      files: ["**/__tests__/**", "**/*.spec.ts", "**/*.test.ts"],
      rules: { "no-restricted-syntax": "off", "vue/no-restricted-class": "off" },
    },
  ],
};
