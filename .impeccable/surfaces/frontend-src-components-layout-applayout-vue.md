---
version: 1
slug: "frontend-src-components-layout-applayout-vue"
primary_target: "frontend/src/components/layout/AppLayout.vue"
related_targets: ["frontend/src/views"]
---

# App console (user portal + admin) — replacement world

Scope: every authenticated surface (AppLayout shell, user portal, admin console), auth pages, payment pages, public home/model plaza. Mode: Operate (home page Persuade inherits the world).
Audience/job: see PRODUCT.md. Customer complaint: current UI reads as generic AI-generated SaaS.
Constraints: operator branding at runtime, light + dark, mobile complete, Vietnamese diacritics, keep all behavior/copy/i18n keys.

## Direction contract

THESIS: The console is a metered utility bill. Usage is a meter reading (previous, current, consumed), pricing is a tier table, paying is a tear-off stub. Refuses the category default: sidebar + row of same-size stat cards with icon tiles + teal accent + rounded panels.

OWN-WORLD: White bill stock (night: deep ink-navy stock). Bill blue #1F4E8C carries headers, rules and primary action; meter yellow #F2C230 only marks the live/current reading and attention; ink #20242A. Be Vietnam Pro, one face, tabular figures; JetBrains Mono only for keys, IDs, codes. Sections are bill sections: bold blue section title on a 2px blue top rule, no card boxes, no shadows, radius 2px. Tables are printed grids: pale-blue header band, full hairline grid, right-aligned figures, total row on a double rule. Meter figures sit in ruled digit boxes. Status = outlined rectangular stamp. Payment/redeem/key reveal = perforated stub (dashed edge with notches).

STORY: A customer sees at once what they have (balance), what they used (reading), what it cost (tier table), and how to pay (stub). An operator reads dense ruled registers with the same grammar.

FIRST VIEWPORT: User dashboard. Top band: account block (site name/logo left, account name + customer ID + balance in meter boxes right). Below: "This period" meter strip — previous / current (yellow-marked) / consumed tokens and cost in ruled cells across the full width. Then the usage trend and tier table side by side; recent requests as a printed register. Primary action "Top up" sits on the right of the account band as a stub edge.

FORM: Metered utility bill — position 1 (my top-ranked grounded candidate, chosen by user as IMPECCABLE'S PICK); seed key 1a72424b. Signature interaction: meter digits roll to new values on refresh (per-digit vertical roll, reduced-motion = instant). Motion grammar: one roll, nothing else animates on load.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Vietnamese locale (vi) not yet added; separate task.
