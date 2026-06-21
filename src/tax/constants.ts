/**
 * Israeli tax parameters. These change annually — verify against the Tax
 * Authority (רשות המסים) and Bituach Leumi before relying on them. Values below
 * reflect 2025 figures and are clearly isolated here so they are easy to update.
 *
 * NOTE: This tool produces *estimates* for planning only, not tax advice.
 */

export interface Bracket {
  upTo: number; // annual taxable income ceiling for this bracket (ILS)
  rate: number; // marginal rate
}

/** 2025 personal income-tax brackets (annual, ILS). */
export const INCOME_TAX_BRACKETS: Bracket[] = [
  { upTo: 84_120, rate: 0.1 },
  { upTo: 120_720, rate: 0.14 },
  { upTo: 193_800, rate: 0.2 },
  { upTo: 269_280, rate: 0.31 },
  { upTo: 560_280, rate: 0.35 },
  { upTo: Infinity, rate: 0.47 },
];

/** Section 102 capital-gains track holding period: 24 months from grant. */
export const QUALIFICATION_MONTHS = 24;

/** Capital gains tax rate for non-substantial shareholders. */
export const CAPITAL_GAINS_RATE = 0.25;

/** Surtax (מס יסף) on taxable income above the annual threshold (2025). */
export const SURTAX_THRESHOLD = 721_560;
export const SURTAX_RATE = 0.03;
/**
 * Additional surtax on *capital / passive* income above the threshold,
 * introduced for 2025. Applied on top of SURTAX_RATE for the capital-gains
 * portion only.
 */
export const SURTAX_CAPITAL_EXTRA_RATE = 0.02;

/**
 * Bituach Leumi + health insurance (employee) — simplified.
 * Annual income ceiling above which no contributions are due (2025 ≈ ₪608,340),
 * and the combined high-bracket employee rate (NI 7% + health 5%).
 */
export const BITUACH_LEUMI_CEILING = 608_340;
export const BITUACH_LEUMI_RATE = 0.12;
