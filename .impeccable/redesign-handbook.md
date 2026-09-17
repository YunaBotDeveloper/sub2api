# Redesign handbook: Metered Utility Bill

Dev-only. Every agent working on this redesign reads this file first. Direction contract: `.impeccable/surfaces/frontend-src-components-layout-applayout-vue.md`. Product truth: `PRODUCT.md`.

## Why
The customer says the current UI reads as generic AI-generated SaaS: rows of same-size stat cards with icon tiles, rounded panels inside panels, a teal accent, and eyebrow labels. The replacement world is a **printed metered utility bill**. Usage reads like a meter, pricing sits in a printed tier table, and paying happens on a tear-off stub.

## The foundation (already built; do not redefine it)
- Tokens: `frontend/src/style.css` (`:root` / `.dark`) and `frontend/tailwind.config.js`. Bill blue = `accent`, meter yellow = `meter` (`bg-meter`, `bg-meter-weak`, `text-meter-ink`), ink = `fg`, `fg-muted`, `fg-subtle`, paper = `surface`, page = `surface-sunken`, rules = `border`, `border-strong`. Semantic: `success`, `warning`, `danger` (each with `-weak`/`-strong`). The legacy `gray-*`, `dark-*` and `primary-*` scales are remapped onto the new palette, but prefer tokens.
- Font: Be Vietnam Pro (one face). `font-mono` (JetBrains Mono) only for API keys, IDs, codes, URLs, model identifiers and code. Numbers use `tabular-nums`, never mono.
- Radius: at most 4px (`rounded-sm` = 2px is the default look). `rounded-full` only for avatars, switches and status dots.
- Classes in `style.css`:
  - `.card` + `.card-header` + `.card-title` + `.card-body` + `.card-footer`: a bill section (white, 2px blue top rule, hairline edges, no radius, no shadow)
  - `.bill-section-title`: a free-standing section heading with a 2px blue rule under it
  - `.meter` wrapping `.meter-cell` (`.meter-label`, `.meter-value`, `.meter-sub`) or `<StatCard>`: a row of readings separated by printed hairlines. `.meter-cell-current` / `<StatCard current>` marks the one live reading (yellow).
  - `<MeterValue :value="..."/>` (`components/common/MeterValue.vue`): digits roll when the value changes. Use it for balance or live counters only.
  - `.table-container` + `.table`: a printed grid (pale-blue header band, 2px blue rule under the header, full hairline grid). `tr.row-total` gets a double rule for totals.
  - `.badge` + `badge-primary|success|warning|danger|gray`: a rectangular status stamp
  - `.stub` + `.stub-perforation`: a tear-off stub for payment QR, redeem codes, one-time key reveals
  - `.tabs` / `.tab` / `.tab-active`: underline tabs
  - `.progress` / `.progress-bar`: a ruler bar with tick marks
  - `.btn` + `btn-primary|secondary|ghost|danger|success|warning` + `btn-sm|md|lg|icon`, `.input`, `.input-label`, `.input-hint`, `.input-error-text`
  - `.page-header` / `.page-title` / `.page-description`, `.empty-state*`, `.dropdown*`, `.modal-*`, `.dialog-*`
- Reference implementations to copy: `components/user/dashboard/UserDashboardStats.vue` (meter strips + printed tier table), `UserDashboardQuickActions.vue` (ruled rows instead of boxed tiles), `components/layout/AuthLayout.vue` (bill header band), the balance chip in `components/layout/AppHeader.vue`.

## Rewrite rules
1. **No grid of same-size cards.** A group of stat tiles becomes one `.meter` strip. A grid of entity cards becomes a `.table` or ruled rows (`divide-y divide-border`) unless the content really is visual (e.g. QR codes, images).
2. **No icon tiles.** Delete colored rounded squares/circles holding an icon. Icons stay only inside buttons, nav and inline actions: small (`h-4 w-4`), `text-accent` or `currentColor`.
3. **No nested boxes.** Inside a `.card`, separate subgroups with rules (`border-t border-border`, `divide-y`), not with bordered, rounded, tinted boxes.
4. **No eyebrow or kicker labels.** Remove `uppercase tracking-wider` small labels above headings, and delete the label if the heading already says it. Labels for values use `text-meta font-medium text-fg-muted`.
5. **Headings:** `.card-title` in card headers, `.bill-section-title` for sections not in a card. Titles are bold and blue (`text-accent-strong`), not gray semibold.
6. **Dense data → printed tables.** Right-align numbers with `text-right tabular-nums`. Put totals in `tr.row-total`.
7. **Status pills → stamps.** Replace `rounded-full bg-green-100 text-green-700 px-2`-style pills with `.badge badge-success`, etc.
8. **Hardcoded colors → tokens.** `bg-blue-500`, `text-purple-600`, `bg-emerald-50`, `from-*`/`to-*` gradients, arbitrary hex and `dark:` color pairs become tokens (`bg-surface`, `text-fg-muted`, `border-border`, `bg-accent-weak`, `text-success`...). Tokens already switch for dark mode, so drop `dark:` duplicates when converting. Third-party brand colors (payment buttons, provider logos via `PlatformIcon`/`ModelIcon`) stay.
9. **Yellow is rationed.** `meter` marks only the current balance or reading, or something needing attention. Never decoration.
10. **No decorative motion.** Remove entrance `animate-fade-in`/`animate-slide-*` on page content, `hover:-translate-y`, `hover:shadow-*`, glows, `backdrop-blur`, `shadow-*` on in-flow panels. Keep spinners, skeletons and live-status pulses. Overlays (dropdown/modal/toast) may keep `shadow-overlay`.
11. **Payment, redeem codes, one-time key reveals:** use `.stub` with a `.stub-perforation` between the "details" part and the "hand over/scan" part.
12. **Empty states:** `EmptyState` component or `.empty-state`; no large illustrations or emoji.
13. **Mobile:** tables inside `.table-container` (horizontal scroll); `.meter` wraps by itself; no fixed widths over 360px for content; touch targets ≥ 40px.

## Must not change
- Behavior, script logic, props, emits, API calls, routing, v-if/v-for conditions.
- i18n keys and copy (no new user-facing strings unless unavoidable; if added, add to **both** `i18n/locales/en` and `zh`).
- `id`, `data-testid`, `data-tour`, `aria-*`, `role` attributes (the onboarding tour and tests depend on them).
- Files outside your assigned scope. If a shared component blocks you, note it in your report instead of editing it.
- Operator branding: never hard-code a product name or logo.

## Working notes
- Run commands from `frontend/`. Tests: `node node_modules/vitest/vitest.mjs run <paths>`. Lint one file set: `node node_modules/eslint/bin/eslint.js <files>`. **Do not run `pnpm install`** (it rewrites the lockfile). Do not commit.
- A GateGuard hook asks for "facts" on the first edit of each file and on some shell commands. Answer briefly (importers/callers, API unchanged, no data files, the user's instruction: "can you spawn agent? it will faster. i want replace all of them. my customer say its too ai-slop") and retry.
- For large files, prefer targeted Edit calls or a small node script over hand-rewriting thousands of lines; keep diffs mechanical and reviewable.
- Final report (≤ 300 words): files changed, patterns replaced, anything left undone and why, shared-component requests, test results.
