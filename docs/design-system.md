# Design System — Saans

## 1. Intent

Saans helps a worried parent decide what to do in the next ten minutes. The design should feel **calm, clear and specific**, never alarmist. Smog is physical: you *see* it. So the one memorable element is the air itself: the **Haze Horizon** hero, where a city skyline disappears into haze in proportion to the real pollution. Everything else stays quiet and disciplined.

## 2. Principles

1. **Show the air, then the action.** Hero first, plan second, detail on demand.
2. **Every recommendation answers: what, why, how much.** No bare commands.
3. **Colour is never the only signal.** Category name, icon shape and pattern always accompany colour.
4. **Calm over alarm.** Severe air gets clear, direct words and a next step, not red flashing.
5. **Estimates are labelled.** Numbers from the model say "estimate" and show confidence.
6. **Small and fast.** System-first fonts, inline SVG, no UI kit.

## 3. Hero concept: Haze Horizon

A skyline of three depth layers (near, mid, far towers with a few trees) drawn as flat inline SVG. A haze overlay sits above them.

```
┌────────────────────────────────────────┐
│  AQI 312   Very poor                   │   big number + category word (left aligned)
│  You can see about 1.2 km              │   visibility from the provider, in plain words
│  ░░░░░ ▒▒▒▒ ▓▓▓  (skyline fading)      │   far layer vanishes first
│  PM2.5 148 · Wind 4 km/h · Stagnant    │   quiet status strip
└────────────────────────────────────────┘
```

Mapping (computed in a small pure function, tested):
- Haze opacity `= clamp(pm25 / 250, 0.05, 0.9)`.
- Layers are visible only if their nominal distance (0.5, 1, 2, 4 km) is within `visibilityKm`; otherwise they fade to the haze colour. If visibility is missing, derive it from opacity bands and omit the km sentence.
- Haze colour shifts by category tint, but the *words* carry the meaning.
- Reduced motion: static. Otherwise one slow haze drift on first load only (≤1.2 s, once).
- Accessibility: the SVG has `role="img"` and an `aria-label` that repeats the AQI, category and visibility sentence.

## 4. Colour tokens

Defined as CSS variables (Tailwind theme extends them). **Every text/background pair below must pass the contrast test in `tests/a11y/contrast.test.ts`** (≥4.5:1 text, ≥3:1 large text and UI). Hex values are starting points; adjust until the test passes.

### Brand and neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--haze` | `#EDF0F1` | `#0C1A21` | page background |
| `--surface` | `#FFFFFF` | `#14262F` | panels |
| `--line` | `#CBD5DA` | `#2B414C` | borders and dividers |
| `--ink` | `#10222B` | `#E8EEF0` | primary text |
| `--ink-muted` | `#4A5C66` | `#A9BAC2` | secondary text |
| `--sky` | `#0E6E8C` | `#5CC0DE` | brand, links, primary actions |
| `--sky-deep` | `#0A4C61` | `#8ED3E8` | focus ring, pressed state |
| `--on-sky` | `#FFFFFF` | `#071217` | text on `--sky` |

### AQI scale (India NAQI)

| Category | `--aqi-*` strong | text on strong | tint (backgrounds) | Icon | Pattern (charts) |
|---|---|---|---|---|---|
| Good | `#1B7F3B` | `#FFFFFF` | `#E3F3E7` | ● circle | solid |
| Satisfactory | `#4F7A12` | `#FFFFFF` | `#EAF1DC` | ◐ half circle | light dots |
| Moderate | `#F2C230` | `#1F1A00` | `#FBF1CB` | ▲ triangle | diagonal lines |
| Poor | `#E8730C` | `#1A1A1A` | `#FCE3CC` | ◆ diamond | cross-hatch |
| Very poor | `#C62828` | `#FFFFFF` | `#F8D9D9` | ■ square | dense hatch |
| Severe | `#7B1E3A` | `#FFFFFF` | `#EBD3DB` | ⬢ hexagon | solid + dots |

Rules: the category **word and icon** appear wherever its colour appears. Tints carry `--ink` text. Dark mode uses the same strong colours on `--surface` with a 1 px `--line` border so they keep their edge.

### Semantic

| Token | Light | Use |
|---|---|---|
| `--gain` | `#17794A` | exposure reduced (paired with ↓ and "lower") |
| `--caution` | `#8A5A00` | estimates, low confidence (paired with a label) |
| `--danger-text` | `#9B1C1C` | errors (paired with an icon and message) |

## 5. Typography

| Role | Family | Fallback | Notes |
|---|---|---|---|
| Display and numbers | **Bricolage Grotesque** (variable) | `ui-sans-serif, system-ui` | Hero AQI, section titles; tabular figures for data |
| Body and UI | **Mukta** (400, 600, 700) | `ui-sans-serif, system-ui, "Noto Sans Devanagari"` | Latin and Devanagari in one family so Hindi matches English |

Load via `next/font` with Latin and Devanagari subsets only. If either font fails, the system stack must still look correct.

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| Hero number | 56 / 1.0 (mobile 48) | 700 display | AQI value |
| H1 | 32 / 1.15 | 700 display | page title |
| H2 | 24 / 1.2 | 700 display | section |
| H3 | 18 / 1.3 | 600 body | block title, action title |
| Body | 17 / 1.55 | 400 body | explanations |
| Small | 14 / 1.45 | 400 body | metadata, chips |

Line length ≤ 66 characters for prose. Left-aligned everywhere. Sentence case; no all-caps labels. Use `font-variant-numeric: tabular-nums` for numbers. Hindi text gets +0.05 line-height.

## 6. Layout, shape, depth

- **Mobile first** at 360 px. Single column up to 768 px; from 1024 px: plan timeline (left, 60%) and a sticky side panel for what-if and impact (right, 40%). Max content width 1120 px.
- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64. Page gutter 16 (mobile) / 32 (desktop).
- **Radius by hierarchy** (not one radius everywhere): hero 24, panels 16, controls 10, chips 999.
- **Depth:** borders and tints, not shadows. One subtle elevation (`0 1px 0 var(--line)`) only on sticky bars.
- **Structure carries meaning.** The plan is a vertical timeline with a spine because it *is* a sequence (times are real markers). Other sections are plain headed blocks, not identical rounded cards.
- **Touch targets** ≥ 44×44 px; spacing between targets ≥ 8 px.

## 7. Motion

- Motion confirms an action (toggle flips, bar animates 200 ms ease-out, sheet opens) or draws attention once (hero haze).
- No entrance animations on sections, no hover choreography.
- `prefers-reduced-motion: reduce` → no transitions beyond opacity at 0 ms; hero static.

## 8. Iconography
`lucide-react` (tree-shaken) or inline SVG, 20 px, 1.75 stroke, always with a text label or `aria-label`. Category icons are the custom shapes in §4.

## 9. Components

| Component | Purpose | Key states and notes |
|---|---|---|
| `HazeHero` | Live AQI, category, visibility sentence, skyline | loading skeleton (static), stale-data label ("12 min old"), manual-AQI mode |
| `StatusStrip` | PM2.5, PM10, wind, temp, humidity, stagnant flag | wraps on mobile; each item has a text label |
| `HourlyStrip` | 24-hour PM2.5 bars with best/worst window highlighted | bar pattern + category colour; `role="img"` with text summary; keyboard-focusable summary list for screen readers |
| `HouseholdStepper` | 5 short steps: location, people, home, commute, budget | progress text "Step 2 of 5", Back/Next, presets at step 1, Enter submits step |
| `PersonaPresets` | "Try as Priya / Mr. Mehta / Rohan / Anil" | buttons, fill the form, announce via `aria-live` |
| `RiskSummary` | One row per member: tier word, icon, one sentence | infant/senior bump explained in plain words |
| `PlanTimeline` | Blocks in time order, each with actions | block header: time span + environment ("at home", "commuting") |
| `ActionItem` | Title, why, impact, chips (cost, effort, confidence) | expandable detail; "Mark as doing" toggles what-if |
| `ImpactBar` | Before/after exposure with numbers | two bars + text: "Estimated exposure 100 → 64 (36% lower). Estimate, medium confidence" |
| `WhatIfPanel` | Toggles for purifier, mask, metro, windows, cooking | switches with labels; result updates `aria-live="polite"` |
| `ChatSheet` | Chat advisor | bottom sheet on mobile, side panel on desktop; suggested prompts; streaming indicator; focus trapped while open; Esc closes |
| `CommunityPack` | Households, adoption %, days → collective impact + copy text | sliders have text inputs; result in words |
| `SafetyNote` | "Not medical advice" + emergency line | always reachable from the footer and in chat |
| `ModeBanner` | "Rules-only mode" / "Using cached air data (18 min old)" | polite, dismissible, never blocks |
| `EmptyState`, `ErrorState` | Next step in plain words | errors say what happened and how to fix it, no apology |

### Action item anatomy
```
[icon] Run the purifier in the bedroom overnight                    ← H3, plain verb first
You spend about a third of the day asleep in one room, so cleaning that air helps most.   ← why
Exposure ↓ about 28% for Aarav (estimate · medium confidence)         ← impact, gain colour + arrow + words
[₹ medium] [Effort: easy]                                              ← chips with text
```

### Data visualisation rules
- Hand-written SVG, no chart library.
- Bars use category pattern plus colour; axis text ≥ 12 px; values labelled directly.
- Every chart has a text equivalent (summary sentence and a visually hidden list).
- Before/after bars share one scale starting at zero.

## 10. Accessibility spec (WCAG 2.2 AA)

- **Contrast:** automated test over all token pairs; fix tokens, not the test.
- **Keyboard:** every control reachable and operable; visible focus ring `3px solid var(--sky-deep)` with 2 px offset; logical tab order; skip link to main.
- **Screen readers:** landmarks (`header`, `main`, `nav`, `footer`), one `h1`, headings in order, labels bound to inputs, errors linked with `aria-describedby`, `aria-live="polite"` for plan/what-if/chat updates, no `aria-live` spam on typing.
- **Forms:** no placeholder-only labels; input types and `autocomplete` where relevant; validation on submit with clear text.
- **Motion and flashing:** respect reduced motion; nothing flashes.
- **Zoom and reflow:** usable at 200% zoom and 320 px width without horizontal scroll.
- **Targets:** ≥ 44 px (exceeds the 24 px minimum in 2.2).
- **Language:** `lang` attribute follows the toggle; Hindi content uses `lang="hi"`.
- **Cognitive load:** one primary action per screen; short sentences; plain words; no timeouts.
- **Tooling:** `eslint-plugin-jsx-a11y`, contrast test; optional axe check on the main page.

## 11. Content design

**Voice:** calm, practical, specific, warm. Active voice, sentence case, plain verbs. Say what to do, then why.

| Pattern | Example |
|---|---|
| Action + reason | "Open windows between 2 and 3 pm. That is the cleanest hour today." |
| Impact with honesty | "Lowers Aarav's estimated exposure by about 28%." |
| Severe air, calm tone | "Today is a stay-in day for the little ones. Here is how to keep the air at home clean." |
| Error | "We couldn't reach the air data service. Showing the reading from 18 minutes ago." |
| Empty | "Add your household to see today's plan." |
| Myth-bust | "Houseplants look nice but don't clean the air in a room in any meaningful way." |

Rules: never say "cure", "prevent disease" or give medical instructions; use "may", "can help" and "estimate". Numbers use `Intl.NumberFormat` with the chosen language; units stay as `µg/m³`, `km`, `kg CO₂e`. Button labels name the result ("Show my plan", not "Submit"); the same action keeps the same name everywhere. No arrows appended to link text.

## 12. Implementation notes

```css
:root {
  --haze:#EDF0F1; --surface:#FFFFFF; --line:#CBD5DA; --ink:#10222B; --ink-muted:#4A5C66;
  --sky:#0E6E8C; --sky-deep:#0A4C61; --on-sky:#FFFFFF;
  --aqi-good:#1B7F3B; --aqi-satisfactory:#4F7A12; --aqi-moderate:#F2C230;
  --aqi-poor:#E8730C; --aqi-very-poor:#C62828; --aqi-severe:#7B1E3A;
}
@media (prefers-color-scheme: dark) {
  :root { --haze:#0C1A21; --surface:#14262F; --line:#2B414C; --ink:#E8EEF0; --ink-muted:#A9BAC2; --sky:#5CC0DE; --sky-deep:#8ED3E8; --on-sky:#071217; }
}
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } }
:focus-visible { outline:3px solid var(--sky-deep); outline-offset:2px; }
```

Use whichever Tailwind configuration `create-next-app` generates; map tokens in one place. Keep only the CSS actually used.

## 13. Don'ts
- No gradient washes, glassmorphism or decorative blobs.
- No identical rounded cards for every section.
- No all-caps eyebrow labels, middle-dot meta strings or `→` on links.
- No red-alert styling that makes the page feel like an emergency when the user needs a plan.
- No colour-only meaning, no icon-only buttons without a name.
