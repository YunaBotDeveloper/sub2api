---
name: Sub2API Console
description: An AI API relay console printed as a metered utility bill. Readings, ruled registers, tear-off stubs.
colors:
  bill-blue: "#1F4E8C"
  bill-blue-weak: "#E7EEF7"
  bill-blue-strong: "#163A6B"
  meter-yellow: "#F2C230"
  meter-yellow-weak: "#FDF3D0"
  meter-ink: "#5C4500"
  bill-stock: "#FFFFFF"
  page-stock: "#F3F6FA"
  hairline: "#D6DFEA"
  rule-strong: "#9EB2CC"
  ink: "#20242A"
  ink-muted: "#546070"
  ink-subtle: "#687484"
  success: "#157347"
  success-weak: "#E5F3EB"
  success-strong: "#0F5A37"
  warning: "#A85A00"
  warning-weak: "#FDF1E0"
  warning-strong: "#864800"
  danger: "#B42318"
  danger-weak: "#FBE9E7"
  danger-strong: "#8E1B12"
  night-stock: "#111824"
  night-page: "#0B1019"
  night-raised: "#161F2E"
  night-hairline: "#263347"
  night-rule-strong: "#405470"
  night-ink: "#E8ECF2"
  night-ink-muted: "#A0ACBE"
  night-ink-subtle: "#7D8BA0"
  night-blue: "#7AA6E0"
  night-blue-weak: "#1A2840"
  night-blue-strong: "#A5C4EE"
  night-meter-weak: "#342A0C"
  night-meter-ink: "#F6D468"
  night-success: "#4AC484"
  night-success-weak: "#102C22"
  night-success-strong: "#7CDCA8"
  night-warning: "#F0B43C"
  night-warning-weak: "#30240C"
  night-warning-strong: "#F8CE6E"
  night-danger: "#F06E64"
  night-danger-weak: "#381616"
  night-danger-strong: "#FAA096"
typography:
  display:
    fontFamily: "Be Vietnam Pro, system-ui, -apple-system, Segoe UI, Roboto, Arial, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    fontFeature: "tnum"
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  section:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  meta:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0"
  sm: "2px"
  md: "3px"
  lg: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.bill-blue}"
    textColor: "{colors.bill-stock}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.bill-blue-strong}"
  button-secondary:
    backgroundColor: "{colors.bill-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-secondary-hover:
    textColor: "{colors.bill-blue-strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-ghost-hover:
    backgroundColor: "{colors.bill-blue-weak}"
    textColor: "{colors.bill-blue-strong}"
  input:
    backgroundColor: "{colors.bill-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  bill-section:
    backgroundColor: "{colors.bill-stock}"
    rounded: "{rounded.none}"
    padding: "20px"
  bill-section-title:
    textColor: "{colors.bill-blue-strong}"
    typography: "{typography.section}"
  meter-cell:
    backgroundColor: "{colors.bill-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "12px 16px"
  meter-cell-current:
    backgroundColor: "{colors.meter-yellow-weak}"
    textColor: "{colors.meter-ink}"
  table-header:
    backgroundColor: "{colors.bill-blue-weak}"
    textColor: "{colors.bill-blue-strong}"
    typography: "{typography.label}"
    padding: "8px 12px"
  table-cell:
    backgroundColor: "{colors.bill-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "8px 12px"
  badge-success:
    backgroundColor: "{colors.success-weak}"
    textColor: "{colors.success-strong}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
  badge-danger:
    backgroundColor: "{colors.danger-weak}"
    textColor: "{colors.danger-strong}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: "1px 6px"
  stub:
    backgroundColor: "{colors.bill-stock}"
    rounded: "{rounded.none}"
  tab-active:
    textColor: "{colors.bill-blue-strong}"
    typography: "{typography.label}"
    padding: "8px 12px"
  nav-link-active:
    backgroundColor: "{colors.bill-blue}"
    textColor: "{colors.bill-stock}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 14px 8px 17px"
---

# Design System: Sub2API Console

## Overview

**Creative North Star: "The Metered Utility Bill"**

Every authenticated surface, from the user portal to the admin console, auth and payment pages, is printed as a utility bill. Balance and usage are meter readings. Dense data sits in printed registers with a full hairline grid. Paying, redeeming and one-time key reveals happen on a tear-off stub. The system rejects the generic SaaS dashboard look: same-size stat cards with icon tiles, a teal accent, rounded panels nested in panels, eyebrow labels.

Hierarchy comes from line weight, type weight and size, not from shadows or fills. Paper is white bill stock on a faint blue-grey page (night mode: deep ink-navy stock). Bill blue carries headers, rules and the primary action. Meter yellow is rationed: it marks the one live reading or something that needs attention. Density is operator-grade. Tables are tight, figures are tabular and right-aligned, and a double rule marks the total.

The runtime source of truth is the RGB triplet tokens under `:root` and `.dark` in `frontend/src/style.css`. The frontmatter hex values mirror them exactly. Tokens switch with the theme, so templates never need `dark:` color pairs. Operator branding (site name and logo) is supplied at runtime and never hard-coded.

**Key Characteristics:**
- Bill sections: a 2px bill-blue top rule over hairline edges, square corners, no shadow.
- Meter strips: readings share 1px printed hairlines. The current reading gets a yellow ground and a yellow corner block.
- Boxed, rolling digits for live figures.
- Printed tables: pale-blue header band, 2px blue rule under the header, full hairline grid, double-ruled total row.
- Status shown as outlined rectangular stamps.
- Perforated tear-off stubs for payment, redeem and key reveals.
- One face (Be Vietnam Pro) with tabular figures. Mono only for machine strings.

**Known deviations in the shipped build (not rules):** no pricing tier table ships, because the API exposes no rate data (the dashboard register is per-platform cost); onboarding tour copy still carries emoji, inline tinted boxes and a hard-coded brand, pending the user's decision; settings grids are stacked rather than label-left; nothing here has been visually verified in a browser yet.

## Colors

A cool, printed palette: blue-grey rules on white stock, one institutional blue, one rationed yellow, and restrained status inks.

### Primary
- **Bill Blue** (bill-blue; night: night-blue): section rules, the header band under tables, the active nav link, primary buttons, focus outlines, caret and native control accent. On white it reaches 8.2:1 against white text.
- **Bill Blue Weak** (bill-blue-weak): table header band, hover wash on ghost buttons, dropdown items and rows (at 50% on table rows), skeleton fill.
- **Bill Blue Strong** (bill-blue-strong): section and card titles, table header text, hover state of primary.

### Secondary
- **Meter Yellow** (meter-yellow): the 8px corner block on the current meter cell, text selection (at 40%). The same value in both themes.
- **Meter Yellow Weak / Meter Ink** (meter-yellow-weak, meter-ink): ground and label ink of the current reading, the balance block in the account band, and the payment countdown in its final 60 seconds.

### Neutral
- **Bill Stock** (bill-stock): sections, tables, stubs, inputs, modals.
- **Page Stock** (page-stock): the page behind the bill, card and modal footers, disabled inputs, stub notches.
- **Hairline** (hairline): every grid line, section edge and divider.
- **Strong Rule** (rule-strong): input strokes, secondary button strokes, stub outline and perforation, badge outline for neutral stamps, digit boxes.
- **Ink / Ink Muted / Ink Subtle** (ink, ink-muted, ink-subtle): body figures; labels and sub-lines; placeholders and secondary figures.

### Status
- **Success, Warning, Danger** each ship as base, weak and strong. The base fills solid buttons and toast top rules. Weak plus strong make the stamp. Base tints numbers only when the number itself carries that meaning.

### Named Rules
**The Rationed Yellow Rule.** Meter yellow marks only the current reading, the live balance, or something that needs attention now (for example an expiring countdown). Never use it for decoration, never in the chart series rotation, and never more than one yellow cell per meter strip.

**The Token-Only Rule.** Colors come from the semantic tokens. No raw Tailwind hues, no arbitrary hex, no `dark:` color pairs. The only exceptions are third-party payment brand buttons (Stripe, Airwallex, Alipay, WeChat Pay) and provider logos.

## Typography

**Display Font:** Be Vietnam Pro (with system-ui, Segoe UI, Roboto, PingFang SC, Microsoft YaHei fallbacks)
**Body Font:** Be Vietnam Pro
**Label/Mono Font:** JetBrains Mono, for machine strings only

**Character:** A single humanist sans with full Vietnamese coverage, used like the type on a printed statement: bold blue headings, quiet grey labels, heavy tabular figures. Self-hosted in weights 400, 500, 600 and 700 (mono in 400 and 500), with vietnamese, latin-ext and latin subsets.

### Hierarchy
- **Display** (700, 30px, 1.15): rare large figures and public-page headlines.
- **Headline** (700, 24px, 1.25, tight tracking): page titles and meter values.
- **Title** (700, 18px, 1.3): modal titles and the account name in the account band.
- **Section** (700, 15px, 1.4, bill-blue-strong): card titles and bill section titles.
- **Body** (400, 14px, 1.55): table cells, inputs, descriptions.
- **Label** (600, 13px, 1.4): buttons, table headers, form labels, tabs, nav links.
- **Meta** (500, 12px, 1.4): meter labels, hints, stamps, small buttons.

### Named Rules
**The Tabular Figures Rule.** Every figure uses `tabular-nums` (table cells, meter values, stat values and `.num` get it by default), so auto-refresh never jiggles column widths. Figures are never set in mono.

**The Mono Is For Machines Rule.** JetBrains Mono appears only for API keys, IDs, order numbers, codes, URLs, environment variables, model identifiers and code blocks.

**The No Eyebrow Rule.** No small uppercase, letter-spaced label above a heading. If the heading already says it, the label goes. A value's label is Meta in ink-muted, in sentence case.

## Layout

The app shell is a fixed 256px left sidebar ("the bill index") on bill stock with a hairline right edge. Its header is 64px tall with a 2px bill-blue bottom rule. Content sits on page stock. Top-level blocks stack with a 24px gap, and the user dashboard pairs a 2/3 register with a 1/3 column from `lg` up.

The user dashboard opens with an account band: operator name and logo, account name and customer ID on the left, then the balance in boxed digits on a yellow-weak ground, then a "Top up" stub edge on the right. Below it comes the period meter strip (previous / current / consumed / charge), followed by a hairline-gridded detail list and the printed per-platform register.

Meter strips auto-fit cells at a minimum of 10rem, so they wrap on their own. Tables scroll horizontally inside their container on small screens. On phones the stub edge turns from a vertical perforation into a horizontal one, and the account band blocks stack full width. Touch targets are at least 40px (the top-up edge is 44px). Form controls render at 16px below 768px to stop iOS zoom.

Rhythm: cells pad 12px by 16px, card headers 12px by 20px, card bodies 20px, table cells 8px by 12px, modal body 12px by 16px (16px by 24px from `sm`).

## Elevation & Depth

The bill is flat. In-flow surfaces carry no shadow, and every in-flow shadow utility in the Tailwind config resolves to nothing. Depth comes from rules: hairline edges, a 2px blue top rule on sections, a 3px top rule on overlays, and page stock showing through as the ground. Only floating layers (dropdowns, modals, dialogs, toasts) lift, and they share one shadow. Overlays dim the page with an ink-navy scrim (`rgb(12 20 33 / 0.55)`) and no blur.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 24px rgba(15, 20, 28, 0.12)`): dropdowns, modals, dialogs, toasts only.
- **Inset** (`box-shadow: inset 0 1px 2px rgba(15, 20, 28, 0.08)`): available for pressed wells. Rarely used.

### Named Rules
**The Rules Not Shadows Rule.** An in-flow panel never gets a shadow, glow, blur or hover lift. If something needs more weight, give it a heavier rule.

## Shapes

Printed forms have square corners. Sections, meter strips, tables, stubs and the ruler progress bar use no radius. Controls use 2px (buttons, inputs, stamps, dropdowns, modals, code), and nothing goes past 4px. Full rounding is reserved for switches, avatars, status dots, spinners and the stub notches.

Line weights carry meaning:
- 1px hairline: grid and edges.
- 2px bill blue: section rule, header underline, active tab, sidebar header.
- 3px bill blue or status color: overlay top rule.
- 3px double ink: total row.
- 2px dashed: perforation.

### Named Rules
**The Thin Side Rule.** A vertical rule on the side of a block is never thicker than 1px. Accent weight goes on top or bottom rules, never on a colored side stripe.

**The No Nested Box Rule.** Inside a section, subgroups are divided by rules (`border-t`, `divide-y`, or 1px gaps on a hairline ground). They never get another bordered, rounded or tinted box.

## Components

### Buttons
Squared, firm and flat.
- **Shape:** gently squared (2px), 1px border in the fill color, 8px by 14px padding, Label type, 8px icon gap.
- **Primary:** bill blue fill with white text (night: page-stock text on the lighter night blue). Hover goes to bill-blue-strong.
- **Secondary:** bill stock with a strong-rule border and ink text. Hover turns the border and text blue.
- **Ghost:** transparent. Hover gets the blue-weak wash and blue-strong text.
- **Danger / Success / Warning:** solid status fill with the same structure.
- **Sizes:** sm (6px by 10px, Meta), md, lg (10px by 20px, Body), icon (8px square).
- **Focus / Disabled:** 2px bill-blue ring offset 2px on the surface; disabled at 50% opacity. Only colors transition (150ms ease-out). No movement.

### Status Stamps
- **Style:** an outlined rectangular stamp. 2px corners, 1px border at 60% of the status color, weak ground, strong ink, 1px by 6px padding, Meta weight 600.
- **Variants:** primary, success, warning, danger. Gray (also the legacy purple) uses the strong rule on page stock. Never pills, never fully rounded.

### Bill Sections (cards)
- **Corner Style:** square (0).
- **Background:** bill stock.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline on all sides and a 2px bill-blue top rule. The header has a hairline bottom rule, and the footer has a hairline top rule on page stock.
- **Internal Padding:** header 12px by 20px, body 20px.
- **Free-standing title:** a bill section title is Section type in bill-blue-strong with an 8px bottom pad and a 2px bill-blue rule under it. A trailing meta note sits right-aligned on the same baseline. The meter or table below drops its own top border to join the rule.

### Meter Strip
- A 1px hairline grid of reading cells (auto-fit, minimum 10rem). The gaps show the hairline ground.
- Each cell stacks a Meta label (ink-muted), a Headline value (tabular, tight), and a Meta sub-line.
- **Current reading:** a meter-yellow-weak ground, an 8px square of meter yellow in the top-left corner, and label and sub-line in meter ink. One per strip.
- A standalone StatCard outside a strip draws its own hairline box. Stat cards never show icons; the legacy icon prop renders nothing.

### Boxed Digits and the Digit Roll (MeterValue)
- Each digit is a 1.2em-tall window onto a vertical 0 to 9 strip. When the value changes, the strip slides to the new digit over 700ms `cubic-bezier(0.16, 1, 0.3, 1)`. The first render appears in place with no entrance roll. Screen readers get the full value once.
- **Boxed:** each digit sits in a 1ch cell with 0.2em side padding and a 1px strong-rule border, sharing borders with its neighbors on a bill-stock ground. Separators and currency symbols stay outside the boxes. Box padding is horizontal only, so neighboring digits on the strip never show.
- Use it for the balance, the current reading and live counters only. Under reduced motion the roll is instant.

### Printed Tables
- The container has a 1px hairline edge on bill stock and scrolls horizontally.
- **Header:** blue-weak band, blue-strong Label text, a 2px bill-blue rule under it, hairline column rules. Sticky headers keep the 2px blue rule.
- **Cells:** 8px by 12px, Body ink, full hairline grid, no outer rule on the last row or column. Row hover gets a 50% blue-weak wash.
- **Figures:** right-aligned and tabular.
- **Total row:** bold, with a 3px double ink rule on top. Use it for a table footer or a row marked as the total. An "other" aggregate row sits on page stock with muted ink.

### Tear-off Stub
- **Stub:** a bill-stock block with a 1px strong-rule outline. Details go above the perforation, and the hand-over part (QR code, code, key) goes below.
- **Perforation:** a 2px dashed strong-rule line, with a 16px half-circle notch at each end in page stock, cut into the outline.
- **Stub edge:** the tear line on a solid action strip, such as "Top up" in the account band. A 2px dashed line in the stock color runs down the left edge, with 12px page-stock notches at top and bottom. Below 640px it becomes a top edge with notches at the left and right.
- Use stubs for payment QR codes, redeem codes, one-time key reveals and the home page endpoint card.

### Underline Tabs
- A hairline baseline. Tabs are Label weight 600, ink-muted, 8px by 12px, with a transparent 2px bottom rule. The active tab takes a bill-blue rule and blue-strong text. Hover recolors text only.

### Ruler Progress
- An 8px bar with square corners, a hairline edge and a page-stock track, marked with a 1px hairline tick every 10%. The fill is bill blue (status colors when a threshold is crossed), with a 300ms width transition.

### Inputs / Fields
- **Style:** 1px strong-rule stroke, bill stock, 2px corners, 8px by 12px, Body ink, placeholder in ink-subtle. The label above is Label weight 600 in ink with a 6px gap. Hints are Meta in ink-muted.
- **Focus:** the border turns bill blue and gains a 1px bill-blue ring. The caret is bill blue.
- **Error / Disabled:** danger border and ring, error text in Meta danger. Disabled uses a hairline border on page stock with muted ink.

### Navigation
- **Sidebar:** bill stock with a hairline right edge. The header is 64px with a 2px blue bottom rule. Section titles are Meta bold in blue-strong over a hairline underline.
- **Links:** Label weight 500 in ink-muted with 2px corners. Hover gets the blue-weak wash and blue-strong text. The active link is a solid bill-blue fill with white text (night: page-stock text).
- **Page header:** a Headline title, a Body muted description, a 2px bill-blue rule underneath, and 24px below.

### Overlays
- **Modals and dialogs:** a sheet of bill stock with 2px corners, a strong-rule outline, a 3px bill-blue top rule and the overlay shadow. Header and footer are divided by hairlines, and the footer sits on page stock. Enter: opacity over 150ms plus an 8px rise over 180ms `cubic-bezier(0.16, 1, 0.3, 1)`. Leave: 120ms ease-in.
- **Toasts:** a slip with a 3px top rule in the status color, sliding in 12px from the right over 200ms.
- **Dropdowns:** strong-rule outline on raised stock, overlay shadow, and a 150ms scale from 0.98.

### Charts
- Colors are read at runtime from the CSS tokens and re-theme when the `.dark` class changes.
- **Series order:** bill blue, ink, strong rule, success, warning, blue at 55%, ink-muted, success-strong, danger, ink at 35%. Meter yellow is not in the rotation and is used only for a current or highlight series.
- **Tooltips:** bill stock, ink text, a 1px strong-rule border, 2px corners and 8px padding, set in Be Vietnam Pro (12px bold title, 12px body, 11px footer).

## Do's and Don'ts

### Do:
- **Do** open every section with a 2px bill-blue rule (a card top rule or a bill section title) and put its title in bold bill-blue-strong.
- **Do** collect a group of figures into one meter strip, and mark only the current reading with the yellow cell.
- **Do** put dense data in a printed table with right-aligned tabular figures and a double-ruled total row.
- **Do** show status as an outlined rectangular stamp (`badge badge-success|warning|danger|primary|gray`).
- **Do** put payment, redeem and one-time key reveals on a stub with a perforation between details and hand-over.
- **Do** use the digit roll only when a live value changes. Nothing else animates on load.
- **Do** keep corners at 2px on controls and square on sections, meters, tables and stubs.

### Don't:
- **Don't** build a grid of same-size stat cards, or put icons in colored rounded or circular tiles. Icons stay 16px in `currentColor` or bill blue, inside buttons, nav and inline actions.
- **Don't** nest bordered, rounded or tinted boxes inside a section. Divide with rules.
- **Don't** add eyebrow or kicker labels (small uppercase letter-spaced text above a heading).
- **Don't** use colored side stripes thicker than 1px.
- **Don't** use color gradients, gradient text, glows, backdrop blur, hover lifts or in-flow shadows. The only gradient allowed is the hard-stop tick pattern that draws the ruler progress bar.
- **Don't** set figures, prose or labels in mono. JetBrains Mono is for keys, IDs, codes, URLs and model identifiers.
- **Don't** use meter yellow for decoration, emphasis or chart series.
- **Don't** hard-code a product name or logo. Branding comes from the operator's runtime settings.
- **Don't** add entrance animations (`fade-in`, `slide-*`) to page content.
