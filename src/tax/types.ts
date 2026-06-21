export type EquityType = "RSU" | "ESPP";

export interface UserProfile {
  /** Base annual salary (ILS). */
  annualSalary: number;
  /** Expected annual bonus (ILS). */
  expectedBonus: number;
  /** Other taxable income (ILS). */
  otherIncome: number;
  /** If true, the user has already passed the Bituach Leumi income ceiling. */
  aboveBituachLeumiCeiling: boolean;
  /**
   * Optional explicit expected annual income for this year (ILS). When set it
   * overrides salary + bonus + other as the base income the equity stacks on.
   */
  expectedAnnualIncome?: number | null;
}

export interface EquityLot {
  id: string;
  type: EquityType;
  shares: number;
  /** ISO date string (yyyy-mm-dd). Grant date for RSU, purchase date for ESPP. */
  acquisitionDate: string;
  /** RSU only: vest date (ISO). */
  vestDate?: string;
  /** RSU: average closing price over the 30 trading days before grant (ILS). */
  preGrantAverage?: number;
  /** ESPP: discounted price actually paid per share (ILS). */
  purchasePrice?: number;
  /** ESPP: fair market value per share on the purchase date (ILS). */
  marketValueOnPurchase?: number;
  /** Current market price per share (ILS). */
  currentPrice: number;
  /** Planned sale price per share (ILS). */
  plannedSalePrice: number;
}

export interface TaxBreakdown {
  /** Per-share gross sale proceeds × shares. */
  grossProceeds: number;
  /** Ordinary-income portion (employment income) subject to marginal tax. */
  incomeComponent: number;
  /** Capital-gains portion (appreciation) subject to 25% CGT. */
  capitalGainComponent: number;
  incomeTax: number;
  bituachLeumi: number;
  surtax: number;
  capitalGainsTax: number;
  totalTax: number;
  netProceeds: number;
  /** totalTax / grossProceeds. */
  effectiveRate: number;
  qualified: boolean;
  breachOfTrust: boolean;
  stockDrop: boolean;
}

export interface LotResult {
  lot: EquityLot;
  /** Tax if sold at the evaluation date (defaults to today) and planned price. */
  current: TaxBreakdown;
  /** Tax if fully qualified (capital gains treatment). */
  best: TaxBreakdown;
  /** Tax if treated as breach of trust (all ordinary income). */
  worst: TaxBreakdown;
  qualificationDate: string; // ISO
  daysUntilQualified: number; // 0 if already qualified
  /** 0-100 efficiency of the current plan vs the best/worst range. */
  efficiencyScore: number;
}
