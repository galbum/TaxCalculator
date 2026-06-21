---
name: israel-equity-tax
description: Israeli Section 102 equity taxation rules for RSUs and ESPP under the Capital Gains Track with Trustee (מסלול רווח הון עם נאמן) - the 24-month qualification, breach-of-trust, income vs capital-gains split, Bituach Leumi, surtax (מס יסף), and the exact formulas the calculator implements. Use when changing the tax engine, adding a tax rule, updating yearly rates, or explaining how a number is computed.
---

# Israel Equity Tax (Section 102)

The tax engine lives in `src/tax/`. This skill documents the rules it encodes so
changes stay correct and auditable. **Estimates only - not tax advice.** Every
rate is a yearly figure that must be verified against רשות המסים and ביטוח לאומי.

## Files

| File | Role |
|------|------|
| `src/tax/constants.ts` | All yearly rates/thresholds (single source of truth) |
| `src/tax/engine.ts` | Qualification, component split, tax math, scoring |
| `src/tax/advisor.ts` | Sell-timing recommendation, insights, scenario series |
| `src/tax/types.ts` | Shared types |
| `tests/engine.test.ts` | Unit tests pinning the rules below |

## Section 102 capital-gains track (with trustee)

- **Qualification period: 24 months** from the grant/deposit date (`QUALIFICATION_MONTHS`).
- Shares must be held by a trustee for the period to get the favorable treatment.

### RSU
- **Sold before 24 months -> Breach of Trust:** the *entire* sale value is
  employment income (marginal income tax + Bituach Leumi + surtax). No capital gains.
- **Sold after 24 months -> split:**
  - **Income component** = `shares x 30-day pre-grant average price` (ordinary income).
  - **Capital-gains component** = `shares x (sale price - pre-grant average)` taxed at 25%.
- **Stock-drop:** if sale price <= pre-grant average, the entire proceeds are the
  income component and the capital-gains component is 0 (waiting adds no CG benefit).

### ESPP
- **Sold before 24 months:** the entire spread (`sale - discounted purchase price`)
  is employment income.
- **Sold after 24 months -> split:**
  - **Benefit component** = `shares x (market value on purchase - discounted price)` (income).
  - **Capital-gains component** = `shares x (sale - market value on purchase)` at 25%.

## Tax math (engine.ts)

- **Income tax** is the *marginal* cost: `incomeTaxOn(base + component) - incomeTaxOn(base)`,
  where `base` is salary + bonus + other (or the explicit expected-income override).
- **Bituach Leumi + health**: combined employee rate up to the annual ceiling;
  0 if the user is already above the ceiling.
- **Surtax (מס יסף)**: applied to income above `SURTAX_THRESHOLD`; ordinary income
  stacks first, then capital gains, with an extra capital surtax on the CG slice.
- **Capital gains tax**: flat `CAPITAL_GAINS_RATE` (25%).
- **Net proceeds** = gross - total tax. **Effective rate** = total tax / gross.
- **Efficiency score (0-100)** = where the current plan sits between the breach
  (worst) and fully-qualified (best) tax outcomes.

## Updating for a new tax year

Edit only `src/tax/constants.ts` (brackets, ceiling, thresholds, rates) and add a
test in `tests/engine.test.ts` if a rule changes. Never hardcode rates elsewhere.

## Known simplifications (see TODO.md)

- All amounts treated as ILS (no USD->ILS FX yet).
- Bituach Leumi uses a single combined high-bracket rate, not the full two-tier schedule.
- ESPP purchase cost isn't netted out of "net proceeds" (chart sums to gross).
- Per-tranche vesting is modeled per lot, not auto-split.
