import {
  BITUACH_LEUMI_CEILING,
  BITUACH_LEUMI_RATE,
  CAPITAL_GAINS_RATE,
  INCOME_TAX_BRACKETS,
  QUALIFICATION_MONTHS,
  SURTAX_CAPITAL_EXTRA_RATE,
  SURTAX_RATE,
  SURTAX_THRESHOLD,
} from "./constants";
import type { EquityLot, LotResult, TaxBreakdown, UserProfile } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

/** UTC-midnight epoch for an ISO date (timezone-safe). */
export function utcMs(iso: string): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

/** Format a UTC-midnight epoch back to yyyy-mm-dd. */
export function isoFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  // Clamp day to the target month's length (e.g. Jan 31 + 1mo → Feb 28/29).
  const lastDay = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, lastDay));
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcMs(toIso) - utcMs(fromIso)) / MS_PER_DAY);
}

export function todayIso(): string {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Progressive income tax on a given annual taxable income. */
export function incomeTaxOn(income: number): number {
  if (income <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of INCOME_TAX_BRACKETS) {
    if (income <= lower) break;
    const slice = Math.min(income, b.upTo) - lower;
    if (slice > 0) tax += slice * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** Marginal (incremental) income tax on `amount` stacked on top of `base`. */
export function marginalIncomeTax(base: number, amount: number): number {
  if (amount <= 0) return 0;
  return incomeTaxOn(base + amount) - incomeTaxOn(base);
}

/** Bituach Leumi + health on equity income stacked on top of base income. */
export function bituachLeumiOn(
  base: number,
  amount: number,
  aboveCeiling: boolean,
): number {
  if (amount <= 0 || aboveCeiling) return 0;
  const room = Math.max(0, BITUACH_LEUMI_CEILING - base);
  const taxable = Math.min(amount, room);
  return taxable * BITUACH_LEUMI_RATE;
}

/** Incremental surtax across a base→base+delta income span (above threshold). */
function surtaxIncrement(base: number, delta: number, rate: number): number {
  if (delta <= 0) return 0;
  const over = (x: number) => Math.max(0, x - SURTAX_THRESHOLD);
  return (over(base + delta) - over(base)) * rate;
}

function baseIncome(profile: UserProfile): number {
  if (
    profile.expectedAnnualIncome !== undefined &&
    profile.expectedAnnualIncome !== null &&
    profile.expectedAnnualIncome > 0
  ) {
    return profile.expectedAnnualIncome;
  }
  return (
    (profile.annualSalary || 0) +
    (profile.expectedBonus || 0) +
    (profile.otherIncome || 0)
  );
}

interface Components {
  incomeComponent: number;
  capitalGainComponent: number;
  breachOfTrust: boolean;
  stockDrop: boolean;
}

/** Split gross proceeds into ordinary-income and capital-gains components. */
function splitComponents(
  lot: EquityLot,
  salePrice: number,
  qualified: boolean,
): Components {
  const shares = lot.shares || 0;
  const gross = shares * salePrice;

  if (lot.type === "RSU") {
    const preGrant = lot.preGrantAverage ?? 0;
    if (!qualified) {
      // Breach of trust: entire sale taxed as employment income.
      return { incomeComponent: gross, capitalGainComponent: 0, breachOfTrust: true, stockDrop: false };
    }
    // Stock-drop: sale price below the pre-grant average → all income, no CG.
    if (salePrice <= preGrant) {
      return { incomeComponent: gross, capitalGainComponent: 0, breachOfTrust: false, stockDrop: true };
    }
    const incomeComponent = shares * preGrant;
    const capitalGainComponent = shares * (salePrice - preGrant);
    return { incomeComponent, capitalGainComponent, breachOfTrust: false, stockDrop: false };
  }

  // ESPP
  const purchase = lot.purchasePrice ?? 0;
  const mvPurchase = lot.marketValueOnPurchase ?? 0;
  if (!qualified) {
    // Entire spread (sale − discounted purchase price) is employment income.
    const spread = Math.max(0, salePrice - purchase) * shares;
    return { incomeComponent: spread, capitalGainComponent: 0, breachOfTrust: true, stockDrop: false };
  }
  // Benefit (discount) is ordinary income; appreciation above MV-on-purchase is CG.
  const benefit = Math.max(0, mvPurchase - purchase) * shares;
  const capitalGainComponent = (salePrice - mvPurchase) * shares;
  const stockDrop = salePrice <= mvPurchase;
  return {
    incomeComponent: benefit,
    capitalGainComponent: Math.max(0, capitalGainComponent),
    breachOfTrust: false,
    stockDrop,
  };
}

function computeBreakdown(
  lot: EquityLot,
  profile: UserProfile,
  salePrice: number,
  qualified: boolean,
): TaxBreakdown {
  const shares = lot.shares || 0;
  const grossProceeds = shares * salePrice;
  const base = baseIncome(profile);
  const { incomeComponent, capitalGainComponent, breachOfTrust, stockDrop } =
    splitComponents(lot, salePrice, qualified);

  const incomeTax = marginalIncomeTax(base, incomeComponent);
  const bituachLeumi = bituachLeumiOn(base, incomeComponent, profile.aboveBituachLeumiCeiling);
  const capitalGainsTax = Math.max(0, capitalGainComponent) * CAPITAL_GAINS_RATE;

  // Surtax: ordinary income stacks first, then capital gains on top, with the
  // extra capital surtax applied to the CG slice above the threshold.
  const ordinarySurtax = surtaxIncrement(base, incomeComponent, SURTAX_RATE);
  const cgSurtaxBase = base + incomeComponent;
  const cgSurtax = surtaxIncrement(
    cgSurtaxBase,
    Math.max(0, capitalGainComponent),
    SURTAX_RATE + SURTAX_CAPITAL_EXTRA_RATE,
  );
  const surtax = ordinarySurtax + cgSurtax;

  const totalTax = incomeTax + bituachLeumi + capitalGainsTax + surtax;
  const netProceeds = grossProceeds - totalTax;

  return {
    grossProceeds,
    incomeComponent,
    capitalGainComponent: Math.max(0, capitalGainComponent),
    incomeTax,
    bituachLeumi,
    surtax,
    capitalGainsTax,
    totalTax,
    netProceeds,
    effectiveRate: grossProceeds > 0 ? totalTax / grossProceeds : 0,
    qualified,
    breachOfTrust,
    stockDrop,
  };
}

export function isQualified(lot: EquityLot, saleDateIso: string): boolean {
  const qualDate = addMonths(lot.acquisitionDate, QUALIFICATION_MONTHS);
  return daysBetween(qualDate, saleDateIso) >= 0;
}

/** Full result for a lot evaluated at `saleDate` (defaults to today). */
export function evaluateLot(
  lot: EquityLot,
  profile: UserProfile,
  saleDate: string = todayIso(),
): LotResult {
  const qualificationDate = addMonths(lot.acquisitionDate, QUALIFICATION_MONTHS);
  const qualified = isQualified(lot, saleDate);
  const daysUntilQualified = Math.max(0, daysBetween(saleDate, qualificationDate));

  const price = lot.plannedSalePrice || lot.currentPrice || 0;
  const current = computeBreakdown(lot, profile, price, qualified);
  const best = computeBreakdown(lot, profile, price, true);
  const worst = computeBreakdown(lot, profile, price, false);

  let efficiencyScore: number;
  if (worst.totalTax <= best.totalTax) {
    efficiencyScore = 100;
  } else {
    const raw = (worst.totalTax - current.totalTax) / (worst.totalTax - best.totalTax);
    efficiencyScore = Math.round(Math.max(0, Math.min(1, raw)) * 100);
  }

  return {
    lot,
    current,
    best,
    worst,
    qualificationDate,
    daysUntilQualified,
    efficiencyScore,
  };
}

export interface PortfolioSummary {
  totalPortfolioValue: number;
  totalTax: number;
  totalNet: number;
  efficiencyScore: number;
  results: LotResult[];
}

export function evaluatePortfolio(
  lots: EquityLot[],
  profile: UserProfile,
  saleDate: string = todayIso(),
): PortfolioSummary {
  const results = lots.map((l) => evaluateLot(l, profile, saleDate));
  const totalPortfolioValue = lots.reduce(
    (s, l) => s + (l.shares || 0) * (l.currentPrice || 0),
    0,
  );
  const totalTax = results.reduce((s, r) => s + r.current.totalTax, 0);
  const totalNet = results.reduce((s, r) => s + r.current.netProceeds, 0);
  const sumWorst = results.reduce((s, r) => s + r.worst.totalTax, 0);
  const sumBest = results.reduce((s, r) => s + r.best.totalTax, 0);
  let efficiencyScore = 100;
  if (sumWorst > sumBest) {
    const raw = (sumWorst - totalTax) / (sumWorst - sumBest);
    efficiencyScore = Math.round(Math.max(0, Math.min(1, raw)) * 100);
  }
  return { totalPortfolioValue, totalTax, totalNet, efficiencyScore, results };
}
