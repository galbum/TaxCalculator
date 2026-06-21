---
name: tax-dashboard
description: The Israel Equity Tax Calculator web dashboard - a Vite + React + TypeScript single-page app for planning RSU/ESPP sales under Section 102. Use when adding UI components, wiring new tax outputs into the view, changing styling/theming, or running/building the app.
---

# Tax Dashboard (Vite + React + TS)

Premium fintech dashboard that turns Section 102 RSU/ESPP rules into a
"sell now or wait?" decision. The tax math is in `src/tax/` (see the
`israel-equity-tax` skill); this skill covers the app shell and UI.

## Commands

```bash
npm install      # once
npm run dev      # local dev server (http://localhost:5173)
npm run build    # type-check (tsc --noEmit) + production build to dist/
npm run test     # vitest engine tests
```

## Structure

```
src/
  App.tsx               # state (lots, profile, theme), layout, localStorage persistence
  main.tsx              # React entry
  styles.css            # design system: CSS vars, light/dark via :root[data-theme]
  sampleData.ts         # seed lots + profile shown on first load
  tax/                  # pure tax engine (no React) - see israel-equity-tax skill
  components/
    Header.tsx          # 4 KPI cards (value, tax, net, efficiency score)
    EquityForm.tsx      # add/edit RSU & ESPP lots + user tax profile
    PortfolioTable.tsx  # per-lot table, color-coded by qualification status
    TaxBreakdownChart.tsx  # CSS stacked bar: income/BL/surtax/CGT/net
    SellTimingAdvisor.tsx  # "Best Time To Sell" recommendation card
    InsightsPanel.tsx   # optimization insights list
    ScenarioSimulator.tsx  # date slider + SVG net-after-tax-over-time chart
```

## Conventions

- **No chart library** - charts are hand-rolled CSS/SVG for full control + tiny bundle.
- All money formatting goes through `src/tax/format.ts` (`formatCurrency`, `formatPercent`, `formatDate`).
- Theme is a `data-theme` attribute on `<html>`; colors are CSS variables only.
- State persists to `localStorage` (`ietc.state.v1`); theme in `ietc.theme`.
- The selected lot drives the advisor, breakdown chart, and simulator.
- Keep components presentational; compute everything in `evaluatePortfolio` / advisor helpers.

## Adding a new tax output to the UI

1. Add the field to the engine result (`src/tax/engine.ts` / `types.ts`) + a test.
2. Surface it via `evaluatePortfolio` if portfolio-level.
3. Read it in the relevant component and format with `format.ts`.
