# TODO — Israel Equity Tax Calculator

Future improvements, roughly in priority order. The tax engine lives in
`src/tax/` and is the place to extend rules; the UI is in `src/components/`.

## Tax accuracy

- [ ] **Two-tier Bituach Leumi**: model the reduced rate up to ~60% of the average
      wage and the full rate up to the ceiling, instead of a single combined rate.
- [ ] **USD → ILS FX**: most Israeli tech RSUs are US-listed. Add a currency per
      lot and an exchange-rate input/feed; tax is computed in ILS.
- [ ] **ESPP cost basis in net proceeds**: optionally net out the purchase price
      the employee already paid (economic net vs. gross-based chart).
- [ ] **Surtax precision**: confirm the 2025 capital-income surtax handling and
      keep `SURTAX_*` constants in sync each year.
- [ ] **Credit points / זיכויים** and pension/study-fund effects on marginal rate.
- [ ] **Real / inflation-adjusted capital gains** for shares held a long time.
- [ ] Yearly constants file per tax year (2024/2025/2026…) with a selector.

## Features

- [ ] **Per-tranche vesting**: enter a grant + vesting schedule and auto-expand to
      lots, each with its own 24-month clock.
- [ ] **Optimal multi-lot sell plan**: given a cash target, pick which lots to sell
      to minimize total tax.
- [ ] **Live prices**: pull current price by ticker (with manual override).
- [ ] **Sensitivity to price**: simulator axis for price as well as date.
- [ ] **Export**: PDF/CSV summary and a shareable scenario link.
- [ ] **What-if income**: model bonus timing / income spreading across tax years.
- [ ] **Withholding vs. final tax**: show expected paycheck withholding and the
      annual-filing refund/top-up.

## UX / polish

- [ ] Inline validation + helpful errors on the equity form.
- [ ] Empty-state onboarding and a guided "add your first grant" flow.
- [ ] Tooltips explaining each tax term inline (income component, breach, surtax).
- [ ] Hebrew (RTL) localization toggle.
- [ ] Save/load named scenarios (beyond the single localStorage state).

## Engineering

- [ ] More engine tests: surtax edges, BL ceiling crossings, ESPP stock-drop.
- [ ] CI (GitHub Actions): typecheck + test + build on PRs.
- [ ] Deploy to GitHub Pages (build already uses a relative base).
- [ ] Component tests for the simulator/advisor rendering.
