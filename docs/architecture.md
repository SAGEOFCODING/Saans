# Architecture — Saans

## 1. Principles

1. **Deterministic core, AI at the edges.** What to recommend and how big the effect is are computed by a pure TypeScript engine. The LLM only *explains and personalises* what the engine already decided. This gives logical decision-making, testability and no hallucinated advice.
2. **Grounded generation.** The LLM may only use numbers and action IDs it was given. A guard verifies this before anything reaches the user.
3. **Graceful degradation.** Provider down → cache/manual. LLM down → rules-only text. The app never dead-ends.
4. **Privacy by design.** No database, no accounts. Coordinates rounded. Health flags never leave the server as raw labels.
5. **Lean.** Few dependencies, small files, data in JSON, no scaffold leftovers, no abstractions without two users.

## 2. System context

```
Browser (Next.js client)
  Onboarding ─ Dashboard (Haze hero, Plan, Indoor, Swaps, Impact, What-if) ─ Chat (SSE) ─ Community
        │  Zod-validated JSON            ▲ domain/ is shared: what-if runs in the browser
        ▼                                │
Next.js route handlers (server only touches env + network)
  /api/geocode   /api/air     /api/plan                 /api/chat            /api/health
       │            │            │                          │
       ▼            ▼            ▼                          ▼
  geocode.ts   airData.ts   plan orchestrator        chat orchestrator (tool loop ≤3)
  (Open-Meteo) (Open-Meteo  domain engine ► narrate  tools ► domain engine
               AQ+forecast) ► guard ► response       ► guard ► SSE stream
                   │                │                          │
                TTL cache       LLMProvider (Gemini | Mock)  ◄─┘
```

## 3. Stack and rationale

| Choice | Why |
|---|---|
| **Next.js (App Router) + TypeScript strict** | One deployable: UI and route handlers, shared types, zero-config hosting |
| **Tailwind CSS** | Tokens in one place (`design-system.md`), no component library bloat |
| **Zod** | Single source of truth for runtime validation and types |
| **Gemini via `@google/genai`** behind `LLMProvider` | Structured JSON output, function calling, streaming; swappable. Model ID comes from `GEMINI_MODEL` (use a current Flash-class model; verify the ID in the SDK docs) |
| **Open-Meteo** (air quality, forecast, geocoding) | No API key, hourly PM2.5/PM10, weather, visibility; works for judges |
| **Vitest** | Fast tests for the pure engine |
| **No DB, no state library** | React state + `sessionStorage` for the profile |

## 4. Repository layout

```
.
├─ AGENTS.md                 # from agents.md
├─ README.md
├─ docs/ prd.md architecture.md design-system.md
├─ src/
│  ├─ app/                   # layout, page, api/{geocode,air,plan,chat,health}/route.ts
│  ├─ components/            # presentational + small containers (no fetch inside leaf UI)
│  ├─ domain/                # PURE. No I/O, no env, no React
│  │   ├─ types.ts           # Zod schemas + inferred types
│  │   ├─ aqi.ts             # NAQI sub-indices, category, dominant pollutant
│  │   ├─ risk.ts            # per-member tier
│  │   ├─ schedule.ts        # household → day blocks + microenvironments
│  │   ├─ exposure.ts        # exposure index for a day under a set of modifiers
│  │   ├─ rules.ts           # predicate evaluator + action scoring and selection
│  │   ├─ impact.ts          # marginal Δ exposure, CO₂e, community math
│  │   ├─ window.ts          # best/worst hours, stagnation
│  │   ├─ context.ts         # season + civic (GRAP) hints
│  │   └─ plan.ts            # assembles the DayPlan
│  ├─ data/                  # tunable content, no code
│  │   ├─ actions.json  impact-factors.json  playbook.json
│  │   ├─ aqi-breakpoints.json  regions.json  presets.json  strings.{en,hi}.json
│  ├─ services/              # I/O adapters
│  │   ├─ airData.ts  geocode.ts  cache.ts  rateLimit.ts
│  │   └─ llm/ provider.ts gemini.ts mock.ts prompts.ts narrate.ts chat.ts tools.ts guard.ts
│  └─ lib/                   # i18n.ts, format.ts, http.ts (fetch with timeout/retry)
├─ tests/                    # mirrors src/domain and src/services/llm/guard
├─ scripts/check-size.sh
├─ .env.example  .gitignore  eslint.config.mjs  vitest.config.ts  tsconfig.json  package.json
```

**Dependency rule:** `domain` imports nothing from the other folders. `components` never import `services`. Only `app/api` and `services` read `process.env`.

## 5. Domain model (abridged)

```ts
type Band = 'infant' | 'child' | 'adult' | 'senior'
type Member = { band: Band; sensitive?: boolean }
type Household = {
  members: Member[]
  home: { type: 'apartment' | 'house'; floor: 'low' | 'mid' | 'high'; windows: 'leaky' | 'tight'
          ac: boolean; purifier: 'none' | 'bedroom' | 'living' | 'both'; cooking: 'lpg' | 'png' | 'induction' | 'biomass'; chimney: boolean }
  mobility: { mode: Mode; distance: 'short' | 'mid' | 'long'; wfhDays: number; schoolAge: boolean; exercisesOutdoors: boolean }
  budget: 'free' | 'low' | 'mid'
  lang: 'en' | 'hi'
}
type Air = { at: string; pm25: number; pm10: number; aqi: number; category: Category; dominant: 'pm25' | 'pm10'
             visibilityKm?: number; windKmh: number; tempC: number; rh: number; stagnant: boolean
             hourly: { t: string; pm25: number; aqi: number }[]; source: 'live' | 'cache' | 'manual'; ageMin: number }
type Category = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very-poor' | 'severe'
type DayPlan = { air: Air; risks: MemberRisk[]; blocks: Block[]; baseline: number; planned: number
                 window: { best: Span; worst: Span }; civic?: string; season?: string }
type Block = { id: BlockId; span: Span; env: Env; actions: ChosenAction[] }
type ChosenAction = { id: string; domain: 'indoor' | 'commute' | 'cooking' | 'heating' | 'community' | 'habit'
                      impact: { exposureDeltaPct?: number; co2eKgDay?: number; pmTier?: 'high' | 'medium' | 'low' }
                      confidence: 'high' | 'medium' | 'low'; effort: 1 | 2 | 3; cost: 'free' | 'low' | 'mid' }
```

## 6. Decision pipeline

```
1 Context    airData(lat,lon) → Air            (cache, fallback, manual)
2 Risk       Household + Air → MemberRisk[]    tier per member
3 Schedule   Household → Block[] with env + hours; picks target members
4 Baseline   exposure(blocks, Air, no actions) → baseline index
5 Candidates rules.matches(ctx) over actions.json
6 Select     score, per-block top-K, diversity, budget/feasibility filter
7 Impact     apply actions in score order; marginal Δ% each; planned index; CO₂e
8 Narrate    LLM rewrites text fields only (or template fallback)
9 Guard      validate IDs, numbers, banned content, length
10 Respond   DayPlan + narration + meta { mode: 'ai' | 'rules', air.source }
```

Steps 1 and 8–10 do I/O. Steps 2–7 are pure and run on both server and client (what-if re-runs 3–7 locally).

## 7. Algorithms

### 7.1 NAQI (India)
Sub-index by linear interpolation between CPCB breakpoints in `data/aqi-breakpoints.json`.

| Category | AQI | PM2.5 µg/m³ | PM10 µg/m³ |
|---|---|---|---|
| Good | 0–50 | 0–30 | 0–50 |
| Satisfactory | 51–100 | 31–60 | 51–100 |
| Moderate | 101–200 | 61–90 | 101–250 |
| Poor | 201–300 | 91–120 | 251–350 |
| Very poor | 301–400 | 121–250 | 351–430 |
| Severe | 401–500 | 250+ | 430+ |

`aqi = max(subIndex(pm25), subIndex(pm10))`. `dominant` is the argmax. (Official NAQI uses 24-hour averages; we use current-hour values and say so in the UI.)

### 7.2 Risk tiers
Tier index 0–5 from the category. Per member: `tier = min(5, base + bump)` where `bump = 1` for infant, senior or `sensitive`, otherwise 0. Output copy is tiered: *fine*, *take care*, *limit outdoor*, *stay in*.

### 7.3 Stagnation
`stagnant = windKmh < 6 && (tempC < 12 || hour is night/early morning) && rh > 60`. Escalates language and raises the priority of ventilation actions. Thresholds live in `data/regions.json` so they are tunable.

### 7.4 Best / worst window
Slide a window of `d` hours (default 1, activity-dependent: walk 1 h, ventilate 0.5 h) over the next 24 h hourly PM2.5; best = lowest mean, worst = highest. Weather-driven afternoon dips (higher mixing height) typically produce the best window; the algorithm needs no assumption, it reads the data.

### 7.5 Exposure index (the "direct impact" engine)
For each block `b` with hours `h`, environment `e`, activity `a`, protection `p`:

```
C_out(b)   = mean hourly PM2.5 over the block
C_env(b)   = C_out × envFactor[e] + indoorSource(b)        // infiltration, commute mode, indoor sources
Exposure   = Σ h × C_env × activityFactor[a] × protectionFactor[p]
Index      = Exposure / referenceDay × 100                  // referenceDay = 24 h at the NAQI "satisfactory" PM2.5 limit (60)
```

- `baseline` = no actions applied. `planned` = all selected actions applied.
- An action is a list of **modifiers** on blocks (`{block, set: {env|activity|protection}}` or `{block, source: -x}`), so the simulator and the rules engine share one mechanism.
- **Marginal impact of an action** = `(Index_without − Index_with)/baseline × 100`, computed sequentially in score order (diminishing returns handled naturally).
- Computed for two targets: **primary adult** (commuter) and **most vulnerable member** (largest bump, longest time at home). Show the vulnerable member's number first.
- Sleep (≈8 h at home) is usually the biggest lever, and the model reproduces that without special-casing.

### 7.6 Heuristic factors (`data/impact-factors.json`)
All planning values, **not measurements**. Each entry carries `source_hint` and `confidence`; the UI labels outputs "estimate". The agent must replace the illustrative values below with cited ones where a public source exists, and keep the file as the only place they live.

```json
{
  "_note": "Heuristic planning values, ILLUSTRATIVE. Cite in source_hint; do not hardcode elsewhere.",
  "indoorInfiltration": { "windowsOpen": 0.9, "closed": 0.6, "closed+purifier": 0.3, "sealed+purifier": 0.22 },
  "commute": { "walk": 1.1, "two-wheeler": 1.2, "auto": 1.1, "bus": 0.9, "metro": 0.7, "car-recirc": 0.5, "car-open": 1.0 },
  "activity": { "rest": 1.0, "light": 1.2, "exercise": 2.2 },
  "protection": { "none": 1.0, "surgical": 0.85, "n95-fitted": 0.25 },
  "indoorSources": { "biomass-cooking": 40, "incense": 25, "gas-cooking-no-chimney": 15 },
  "emissionsKgCO2ePerKm": { "petrol-car": 0.17, "two-wheeler": 0.04, "bus-pax": 0.03, "metro-pax": 0.03, "ev-two-wheeler": 0.02 }
}
```

`indoorSources` are µg/m³ additions during the cooking/incense block; they make "use the chimney" and "switch from chulha" quantifiable.

### 7.7 Action catalog and rules
`data/actions.json` entries (about 25–35; English required, Hindi optional with fallback):

```json
{
  "id": "bedroom-purifier-night",
  "domain": "indoor",
  "title": { "en": "Run the purifier in the bedroom overnight" },
  "why":   { "en": "You spend about a third of the day asleep in one room. Cleaning that air lowers exposure the most." },
  "when": { "all": [ { "f": "air.aqi", "op": ">=", "v": 151 }, { "f": "home.purifier", "op": "in", "v": ["none", "living"] } ] },
  "requires": { "budget": ["low", "mid"] },
  "modifiers": [ { "block": "night", "set": { "env": "closed+purifier" } } ],
  "effort": 1, "cost": "mid", "confidence": "medium", "protective": true,
  "excludes": ["diy-box-fan-filter"]
}
```

Predicates use a tiny evaluator (`all`/`any` of `{f, op, v}`), not `eval`. Content covers:

| Domain | Examples (non-exhaustive) |
|---|---|
| Indoor | Ventilate only in the best window; seal door/window gaps; purifier placement and sizing (rule of thumb: CADR ≈ ⅔ of room floor area in ft², 8 ft ceilings); box-fan filter DIY (free/low); wet-mop instead of dry sweeping; no incense, mosquito coils, candles; chimney on while cooking; AC on recirculate; myth-busting: houseplants do not meaningfully clean room air |
| Commute | Metro/bus over two-wheeler; shift to off-peak; windows-up recirculate in cars; carpool; fitted N95 with fit-check steps; walk the cleaner street, not the main road |
| Cooking and heating | Induction or LPG over biomass; avoid burning wood/coal/waste for warmth (use layering, electric heating); cook during best window with chimney |
| Habits | Move outdoor exercise indoors or to the best window; hydrate; kids' play-time schedule; school-run timing |
| Community | No open burning (report to authorities); dust-suppression (water sprinkling, covering construction); generator discipline; planting and carpool boards; fireworks-free celebrations |

### 7.8 Scoring and selection

```
for a in catalog where matches(ctx, a.when) and feasible(a, household):
    gain  = marginalDelta(a, target = vulnerable) * 0.6 + marginalDelta(a, target = primary) * 0.4
    sev   = a.protective ? tier(worst member) : 0
    score = (gain + sev) * fit(a, household) / a.effort
select: sort desc → per block max 2 per domain → drop `excludes` conflicts → keep top 6 overall
        always include protective actions when worst tier ≥ 'very-poor'
        free-budget households only see cost 'free'
```
`fit` ∈ [0,1] combines budget, home (e.g. a high-floor flat vs ground floor), mobility and what is already owned (e.g. skip "buy purifier" when `purifier = 'both'`).

### 7.9 Community math
`collective = households × adoptionRate × perHousehold.co2eKgDay × days`. Equivalences (e.g. "≈ N 10-km petrol-car trips") are computed in code from the factors file, never by the LLM. PM impact for open burning, dust and generators is a **qualitative tier** (high/medium/low local source), because per-household PM numbers would be fabricated precision.

## 8. External services and fallbacks

| Service | Use | Timeout / retry | Fallback |
|---|---|---|---|
| Open-Meteo Geocoding | city → lat/lon | 4 s, retry once | Manual lat/lon entry or default city |
| Open-Meteo Air Quality | hourly PM2.5, PM10, current values | 4 s, retry once | Last cached snapshot (labelled with age) → manual AQI form |
| Open-Meteo Forecast | wind, temperature, humidity, visibility | 4 s, retry once | Omit weather; stagnation flag = unknown |
| Gemini | narration, chat | 12 s plan, stream chat | Rules-only template narration; chat shows deterministic answers and a retry |

All outbound hosts are fixed constants (SSRF-safe). User text is only ever a URL-encoded query value.

## 9. LLM integration

### 9.1 Provider interface
```ts
interface LLMProvider {
  json<T>(req: { system: string; user: string; schema: ZodType<T> }): Promise<T>
  stream(req: { system: string; messages: Msg[]; tools: Tool[] }): AsyncIterable<ChatEvent>
}
```
`gemini.ts` and `mock.ts` implement it. `LLM_PROVIDER` defaults to `mock` when no key is set. The mock returns deterministic, template-based narration so tests and judges run offline.

### 9.2 Narration call (one per plan)
- Input: compact FACTS JSON (air summary, tiers, blocks with action IDs and engine-computed impact numbers, window times, language). No raw health flags, only `sensitiveMember: boolean`.
- Output (structured JSON): `{ headline, summary, blocks: [{ id, intro }], actions: [{ id, tip, whyPlain }], watchouts: string[] }`.
- Settings: low temperature (≈0.3), small max output tokens, thinking/budget minimal.
- Cache key: `sha1(lat2, lon2, hourBucket, canonicalHousehold, lang)`, TTL 10 min.

### 9.3 Guard (`guard.ts`, runs on every LLM output)
1. Schema valid; no unknown keys.
2. Every `id` exists in the plan; none added or removed.
3. **Number check:** all numbers in text ⊆ allowed set from FACTS (rounded variants permitted).
4. Banned patterns: diagnoses, medication names or doses, "cure"/"prevent disease" claims, URLs, HTML.
5. Length caps per field.
6. Red-flag symptoms in the user message → short-circuit to the emergency message (no LLM).

On failure: retry once with the violation appended; then fall back to template narration (`mode: 'rules'`).

### 9.4 Chat tool loop
Tools (read-only, no side effects): `get_air_now`, `get_best_window(activity)`, `get_plan_actions(domain?)`, `simulate(changes)`, `lookup_playbook(topic)`. Max 3 tool rounds, history capped at 10 turns, streamed over SSE. The assistant must cite the tool values it used ("PM2.5 is 148 µg/m³ right now"). Tool results are wrapped as data; user text sits inside `<user_data>` delimiters.

## 10. API

| Endpoint | Request | Response |
|---|---|---|
| `GET /api/geocode?q=` | query ≤80 chars | `[{ name, admin, lat, lon }]` |
| `GET /api/air?lat&lon` | numbers in India-plus bounds or global valid range | `Air` |
| `POST /api/plan` | `{ household, location: {lat, lon}, lang }` | `{ plan: DayPlan, narration, meta: { mode, airSource } }` |
| `POST /api/chat` | `{ household, location, messages[≤10] }` | SSE: `token`, `tool`, `done`, `error` |
| `GET /api/health` | none | `{ ok, llm: 'gemini' \| 'mock', time }` |

The server **re-fetches** air data itself; it never trusts a client-supplied snapshot. All bodies ≤16 KB. Errors are `{ error: { code, message } }` with no stack traces.

## 11. Frontend architecture

- Server components for static shell; client components only where state is needed (form, what-if, chat).
- State: `useReducer` for household, `sessionStorage` persistence (cleared when the tab closes).
- `usePlan(household, location)`: fetches `/api/plan`, holds `{ plan, narration }`.
- `useWhatIf(plan, household)`: imports `domain/plan` and recomputes locally.
- Chat is dynamically imported (code-split). Charts are hand-written SVG components. No chart or UI libraries.
- i18n: `strings.{en,hi}.json` plus `t(key)`; generated narration arrives already in the chosen language.

## 12. Security

| Threat | Control |
|---|---|
| Key leakage | `GEMINI_API_KEY` only in server env; `.env.example` committed, `.env*` ignored; no `NEXT_PUBLIC_` secrets |
| Injection (prompt) | Structured FACTS, `<user_data>` delimiters, no tool with side effects, guard on outputs, system prompt forbids following user-data instructions |
| Injection (XSS) | Render LLM text as plain text or `react-markdown` with HTML disabled; strict CSP with nonces; no `dangerouslySetInnerHTML` |
| Abuse and cost | In-memory token-bucket rate limit per IP (plan 20/min, chat 10/min), body size limits, max tokens, history cap |
| Input | Zod on every route; lat/lon bounds; string length caps; enum-only profile fields |
| SSRF | Fixed upstream hosts; only encoded query params from user input |
| Privacy | No DB; coordinates rounded to 2 dp; logs exclude bodies; raw health flags not sent to the LLM |
| Headers | CSP, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(self)`, `X-Frame-Options: DENY` |
| Supply chain | Few deps, lockfile committed, `npm audit` in the checklist |

## 13. Efficiency

- Air data cache: LRU in memory, key `lat2,lon2`, TTL 15 min, in-flight request coalescing.
- One LLM call per plan; plan cache by context hash; chat streams, history trimmed.
- What-if is client-side: zero network, <100 ms.
- No images or chart libs; inline SVG; system font fallback with `next/font` subsets (Latin + Devanagari).
- Budgets: first-load JS ≤150 KB gzip, repo <2 MB, `npm run build` clean.

## 14. Accessibility architecture
Semantic landmarks, one `h1`, labelled form controls, `aria-live="polite"` for plan updates, focus management on step changes and chat, keyboard-complete toggles, contrast-checked tokens (test in `tests/a11y`), reduced-motion and dark mode via CSS variables. Details in `design-system.md §10`.

## 15. Testing strategy (focused, low weight but cheap)

| Layer | Tests |
|---|---|
| `aqi.ts` | breakpoints, boundaries (30/31, 250/251), dominant pollutant |
| `risk.ts` | infant/senior/sensitive bump, cap at severe |
| `exposure.ts` | baseline sanity, purifier lowers night exposure, exercise factor |
| `rules.ts` | predicate evaluator, budget filter, exclusion conflicts, protective inclusion |
| `impact.ts` | marginal Δ ordering, community math linearity |
| `guard.ts` | rejects unknown IDs, invented numbers, medication terms, HTML |
| `llm/mock` + `plan` | end-to-end plan for 4 persona presets (golden snapshots) |
| `a11y/contrast` | every token pair in `design-system.md` ≥ 4.5:1 (3:1 for large text and UI) |

Commands: `npm test`, `npm run check` (lint + typecheck + test + build).

## 16. Observability
`console.info` JSON lines with `{ route, ms, mode, airSource }` only. No bodies or coordinates.

## 17. Deployment
Vercel (zero config) or Cloud Run. Env: `GEMINI_API_KEY`, `GEMINI_MODEL`, `LLM_PROVIDER` (`gemini` | `mock`). No other infra. Note for serverless: in-memory cache and rate limit are best-effort per instance; documented in README.

## 18. Decisions (ADR summary)

| # | Decision | Reason | Trade-off |
|---|---|---|---|
| 1 | Rules engine chooses; LLM narrates | Reliability, testability, safety | Less "free-form" creativity |
| 2 | No database | Privacy, simplicity, size | No history or community totals across users |
| 3 | Open-Meteo | Keyless, hourly, global | Modelled data, not station readings; labelled as such |
| 4 | Heuristic exposure factors in JSON | Transparent, tunable | Estimates only; labelled |
| 5 | Client-side simulator | Instant, zero cost | Domain code must stay isomorphic |
| 6 | Qualitative PM tier for community items | Avoid false precision | Less "wow" numbers; more honest |
| 7 | Mock provider default without key | Judges can run it | Narration is plainer in mock mode |
