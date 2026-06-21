# Israel Equity Tax Calculator

A modern, premium web dashboard that helps Israeli tech employees answer one
question about their RSUs and ESPP shares:

> **"Should I sell now or wait — and how much tax will I save by waiting?"**

It models **Section 102, Capital Gains Track with Trustee (מסלול רווח הון עם נאמן)**:
the 24-month qualification, Breach of Trust, the income vs. capital-gains split,
Bituach Leumi, and the surtax (מס יסף) — turning complex rules into clear,
actionable decisions.

> ⚠️ **Estimates for planning only — not tax advice.** Tax parameters reflect
> 2025 figures and must be verified against the Israel Tax Authority (רשות המסים)
> and Bituach Leumi. All amounts are treated as ILS.

## Features

- **Header KPIs** — total portfolio value, estimated tax liability, net proceeds, and a 0–100 Tax Efficiency Score.
- **Equity input** — add multiple RSU and ESPP lots, each with the inputs its tax rule needs, plus your income/profile.
- **Tax engine** — automatic Breach-of-Trust detection, income/capital-gains split, stock-drop handling, marginal income tax, Bituach Leumi, surtax, and 25% CGT.
- **Tax composition chart** — stacked breakdown of income tax / Bituach Leumi / surtax / CGT / net, with values and percentages.
- **Smart Sell Timing Advisor** — "Best Time To Sell" card: wait N days, already qualified, or stock-below-pre-grant guidance with estimated savings.
- **Optimization insights** — Bituach Leumi ceiling, surtax threshold crossings, and per-lot delay savings.
- **Portfolio table** — color-coded by status: green (qualified), yellow (approaching ≤90d), red (Breach of Trust risk).
- **Scenario simulator** — drag a sell-date slider and watch net-after-tax proceeds recalculate, with the 24-month qualification and optimal sale date marked.
- **Light/dark mode**, responsive desktop-first layout, and local persistence.

## Tech stack

Vite + React + TypeScript. Charts are hand-rolled CSS/SVG (no chart dependency).
The tax engine in `src/tax/` is pure, framework-free, and unit-tested with Vitest.

## Getting started

```bash
cd TaxCalculator
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm run test     # run the tax-engine unit tests
```

## Project layout

```
TaxCalculator/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    App.tsx              # state, layout, persistence
    main.tsx
    styles.css           # design system (light/dark)
    sampleData.ts        # seed data
    tax/                 # pure tax engine
      constants.ts       # yearly rates/thresholds (edit here to update a tax year)
      engine.ts          # qualification, component split, tax math, scoring
      advisor.ts         # sell-timing recommendation, insights, scenario series
      format.ts          # ILS / percent / date formatting
      types.ts
    components/          # Header, EquityForm, PortfolioTable, TaxBreakdownChart,
                         # SellTimingAdvisor, InsightsPanel, ScenarioSimulator
  tests/
    engine.test.ts       # Vitest unit tests for the tax rules
  .cursor/skills/        # israel-equity-tax (rules) + tax-dashboard (app)
  TODO.md                # planned future work
```

## How the tax rules work

See `.cursor/skills/israel-equity-tax/SKILL.md` for the full rule set and the
formulas the engine implements (RSU/ESPP, 24-month qualification, breach of trust,
stock-drop, Bituach Leumi, surtax, and the efficiency score).

To update for a new tax year, edit **only** `src/tax/constants.ts`.

## Roadmap

See [TODO.md](./TODO.md).
