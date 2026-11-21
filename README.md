# Saans (सांस) — Clean-Air Copilot

A GenAI-powered clean-air assistant helping families and communities navigate severe winter smog and urban air pollution in Delhi-NCR and northern India.

## Chosen Vertical
**Public Health & Climate Resilience: Urban Air Quality & Winter Smog Response.**

## Problem
Every winter, northern Indian cities (notably Delhi-NCR) experience severe hazardous air pollution episodes driven by agricultural stubble burning, low surface temperatures, temperature inversions, calm winds (stagnation), and local vehicular/industrial emissions. Air Quality Index (AQI) frequently exceeds 400+ ("Severe"), posing acute health hazards to children, seniors, pregnant women, and individuals with respiratory conditions like asthma or COPD. Citizens lack personalized, actionable, low-cost guidance that accounts for their specific daily routines, microenvironments, housing ventilation, and budget constraints.

## Approach and Logic
Saans operates on a fundamental architectural principle:
> **The deterministic engine decides; the LLM only explains.**

The decision-making pipeline is pure, isomorphic, and 100% deterministic:
```text
Live Air Quality (Open-Meteo)
         ↓
Vulnerability Risk Assessment (Per-member age/health tiers 0-5)
         ↓
Schedule & Microenvironments (Day blocks: commute, home, school/work)
         ↓
Baseline Exposure Calculation (Concentration × hours × ventilation)
         ↓
Candidate Action Selection & Scoring (JSON rules catalog, budget/feasibility filtered)
         ↓
Marginal Impact Calculation (Exposure delta %, CO2e saved, community multiplier)
         ↓
Grounded Narration (LLM translates decisions into empathetic text; FACTS-only prompt)
         ↓
Safety Guard (AST & regex verification: bans invented numbers, medical claims, HTML)
         ↓
DayPlan Assembly & Client Simulation (< 100ms What-If toggles)
```

## How It Works
Saans directly addresses the four core requirements of the problem statement:
1. **Low-Emission Daily Routines**: Generates optimized day blocks aligning outdoor activities with the best ventilation windows and lowest diurnal PM2.5 concentrations.
2. **Indoor Air Quality Hacks**: Actionable low-cost interventions (wet mopping, DIY exhaust air-filters, cross-ventilation timing during mid-afternoon windows, door-draft sealing).
3. **Sustainable Alternatives**: Context-aware commuting and heating alternatives (electric bus/metro routes, avoiding open biomass/chulha burning, carpooling).
4. **Direct Impact Explanation**: Quantified marginal exposure reduction (e.g., "-38% daily PM2.5 intake"), estimated CO2e avoided, and linear community impact scaling (e.g., "If 100 households in your society adopt this...").

## Architecture Overview
The repository follows a clean, modular, decoupled layout:
- `src/domain/`: Pure, isomorphic, zero-dependency decision engine (no I/O, no React, no environment variables).
- `src/data/`: Domain data catalogs (`actions.json`, `impact-factors.json`, `aqi-breakpoints.json`, `playbook.json`, `presets.json`, `strings.en.json`, `strings.hi.json`).
- `src/services/`: Resilient external services with in-memory LRU/TTL caching, rate limiting, and Open-Meteo adapters.
- `src/services/llm/`: Unified `LLMProvider` interface supporting Gemini (`@google/genai`) and deterministic offline `MockProvider`, equipped with strict safety guards (`guard.ts`).
- `src/app/api/`: Typed Next.js API route handlers (`/api/geocode`, `/api/air`, `/api/plan`, `/api/chat`, `/api/health`).
- `src/components/`: Accessible, responsive UI components built using design system tokens (`HazeHero`, `StatusStrip`, `HourlyStrip`, `HouseholdStepper`, `WhatIfPanel`, `ChatSheet`).

## Impact Model and Its Honesty
- **Exposure Deltas**: Modeled as marginal percentage reductions based on peer-reviewed microenvironment transfer coefficients and ventilation ratios.
- **CO2e Estimates**: Calculated using conservative emission factors for transport and fuel displacement.
- **Honesty in Communication**: All outputs are clearly labeled as "heuristic estimates" with associated confidence levels (`high`, `medium`, `low`). Saans never presents simulations as guaranteed clinical measurements.

## Security and Privacy
- **Strict CSP with Dynamic Nonces**: Enforced on every page request via `src/middleware.ts` with `'strict-dynamic'` in production.
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(self)`.
- **Zero Secret Leakage**: `GEMINI_API_KEY` is strictly confined to server-side execution. No client-exposed keys (`NEXT_PUBLIC_`).
- **No Database & No PII Logging**: No coordinates, personal health histories, or raw IP addresses are permanently persisted or logged.

## Accessibility
- **WCAG 2.2 AA Compliance**: Verified contrast ratios on all color token pairs.
- **Inclusive Design**: Skip links, semantic landmark structure (`<main>`, `<nav>`, `<header>`), focus visible rings, and full keyboard navigability.
- **Screen Reader Support**: Live regions (`aria-live="polite"`) for simulation results, plan generation, and conversational chat.
- **Localization**: Full dual-language support for English and Hindi (हिंदी).

## Testing
Comprehensive testing strategy via Vitest:
- Unit tests for NAQI boundary calculations, vulnerability risk bumps, and exposure deltas.
- Deterministic golden plan snapshot testing across standard personas.
- Safety guard red-teaming (rejection of ungrounded numbers, medical diagnosis queries, and medication recommendations).
- Automated color contrast token matrix verification.

## Run Locally

### Prerequisites
- Node.js >= 20.0.0 (tested on Node.js v24)
- npm >= 10.0.0

### Quick Start (Offline / Mock Mode - No API Key Required)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application. Saans works completely offline with realistic air data and deterministic mock narration.

### Running with Gemini Live LLM
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   LLM_PROVIDER=gemini
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Verification Commands
```bash
npm run lint         # Runs ESLint with jsx-a11y rules
npm run typecheck    # Runs TypeScript compiler verification (tsc --noEmit)
npm test             # Runs Vitest unit & integration test suite
npm run build        # Builds optimized Next.js App Router production bundle
npm run check        # Chains lint + typecheck + test + build (mandatory pre-push gate)
bash scripts/check-size.sh  # Verifies repository size <= 5 MB
```

## Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (optional; defaults to offline mock provider if omitted).
- `GEMINI_MODEL`: Gemini Flash model ID (default: `gemini-2.5-flash`).
- `LLM_PROVIDER`: `'mock'` or `'gemini'` (default: `'mock'`).

## Assumptions and Limitations
- **Default Location**: When geolocation permission is denied or coordinates omitted, Saans defaults to Central Delhi (Connaught Place: 28.6315° N, 77.2167° E).
- **Air Data Fallback**: When Open-Meteo air API is unreachable, cached historical seasonal averages for Delhi winter are served gracefully.
- **Non-Clinical Disclaimer**: Saans provides exposure mitigation guidance and environmental advice. It is explicitly not a medical diagnostic tool or healthcare provider.

## Demo Script
Follow the walkthrough in `docs/prd.md §12`:
1. View Delhi-NCR live PM2.5 / AQI status and Haze skyline.
2. Select persona "Priya" (pregnant mother, toddlers, East Delhi apartment).
3. Review personalized vulnerability rating and timeline interventions.
4. Toggle What-If simulator ("Add DIY air purifier", "Shift cooking window") to see instant client-side exposure re-computation.
5. Open Community Pack to view collective society-level emission and exposure reductions.
