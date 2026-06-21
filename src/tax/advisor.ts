import { evaluateLot, addMonths, baseIncome, daysBetween, todayIso, utcMs, isoFromMs } from "./engine";
import { BITUACH_LEUMI_CEILING, SURTAX_THRESHOLD } from "./constants";
import { APPROACHING_DAYS } from "../config";
import { formatCurrency, formatDate, formatPercent } from "./format";
import type { EquityLot, LotResult, UserProfile } from "./types";

export type RecommendationTone = "wait" | "qualified" | "neutral";

export interface Recommendation {
  tone: RecommendationTone;
  title: string;
  body: string;
}

/** The "Best Time To Sell" advisor card for a single lot. */
export function sellRecommendation(
  lot: EquityLot,
  profile: UserProfile,
): Recommendation {
  const today = todayIso();
  const evalToday = evaluateLot(lot, profile, today);
  const price = lot.plannedSalePrice || lot.currentPrice || 0;

  // Stock-drop (RSU): no extra CG benefit from waiting.
  const preGrant = lot.preGrantAverage ?? 0;
  if (lot.type === "RSU" && evalToday.daysUntilQualified > 0 && price <= preGrant) {
    return {
      tone: "neutral",
      title: "Waiting won't reduce your tax",
      body:
        `Because the current share price (${formatCurrency(price)}) is below the 30-day ` +
        `pre-grant average (${formatCurrency(preGrant)}), the entire sale is taxed as ` +
        `employment income whether you wait or not. Waiting unlocks no capital-gains benefit — ` +
        `decide based on other investment factors.`,
    };
  }

  if (evalToday.daysUntilQualified <= 0) {
    return {
      tone: "qualified",
      title: "Your shares already qualify",
      body:
        `These shares have passed the 24-month Section 102 holding period ` +
        `(qualified on ${formatDate(evalToday.qualificationDate)}). Selling now retains the ` +
        `favorable capital-gains treatment at an estimated effective rate of ` +
        `${formatPercent(evalToday.current.effectiveRate)} — tax-efficient.`,
    };
  }

  // Not yet qualified: compare selling today (breach) vs at qualification.
  const evalAtQual = evaluateLot(lot, profile, evalToday.qualificationDate);
  const savings = evalToday.current.totalTax - evalAtQual.current.totalTax;
  return {
    tone: "wait",
    title: `Wait ${evalToday.daysUntilQualified} more day${evalToday.daysUntilQualified === 1 ? "" : "s"}`,
    body:
      `Selling today would trigger Breach of Trust taxation at an estimated effective rate of ` +
      `${formatPercent(evalToday.current.effectiveRate)}. Waiting until ` +
      `${formatDate(evalToday.qualificationDate)} unlocks capital-gains treatment and reduces ` +
      `estimated taxes by ${formatCurrency(Math.max(0, savings))} ` +
      `(effective rate drops to ${formatPercent(evalAtQual.current.effectiveRate)}).`,
  };
}

/** Portfolio-level optimization insights. */
export function optimizationInsights(
  results: LotResult[],
  profile: UserProfile,
): string[] {
  const insights: string[] = [];
  const base = baseIncome(profile);

  const totalIncomeComponent = results.reduce((s, r) => s + r.current.incomeComponent, 0);
  const totalCapitalGain = results.reduce((s, r) => s + r.current.capitalGainComponent, 0);

  if (profile.aboveBituachLeumiCeiling) {
    insights.push(
      "You are already above the Bituach Leumi ceiling, so equity income components " +
        "owe no further national insurance. Any over-withholding may be refundable through annual filing.",
    );
  } else if (base + totalIncomeComponent > BITUACH_LEUMI_CEILING) {
    insights.push(
      `This sale pushes you past the Bituach Leumi ceiling (${formatCurrency(BITUACH_LEUMI_CEILING)}); ` +
        "income above it owes no further national insurance.",
    );
  }

  if (base + totalIncomeComponent + totalCapitalGain > SURTAX_THRESHOLD) {
    insights.push(
      `This sale may trigger the surtax (מס יסף) by crossing the annual income threshold of ` +
        `${formatCurrency(SURTAX_THRESHOLD)}.`,
    );
  }

  // Per-lot waiting opportunities.
  for (const r of results) {
    if (r.daysUntilQualified > 0) {
      const evalAtQual = evaluateLot(r.lot, profile, r.qualificationDate);
      const savings = r.current.totalTax - evalAtQual.current.totalTax;
      if (savings > 0) {
        insights.push(
          `Delaying the ${r.lot.type} lot from ${formatDate(r.lot.acquisitionDate)} by ` +
            `${r.daysUntilQualified} days could reduce taxes by approximately ` +
            `${formatCurrency(savings)} (effective rate ` +
            `${formatPercent(r.current.effectiveRate)} → ${formatPercent(evalAtQual.current.effectiveRate)}).`,
        );
      }
    }
  }

  if (insights.length === 0) {
    insights.push(
      "All lots already qualify for Section 102 capital-gains treatment — your plan is tax-efficient.",
    );
  }
  return insights;
}

/** Status used for portfolio-table color coding. */
export type LotStatus = "qualified" | "approaching" | "breach";

export function lotStatus(result: LotResult): LotStatus {
  if (result.daysUntilQualified <= 0) return "qualified";
  if (result.daysUntilQualified <= APPROACHING_DAYS) return "approaching";
  return "breach";
}

export function recommendedAction(result: LotResult): string {
  const status = lotStatus(result);
  if (status === "qualified") return "Sell — qualified";
  if (status === "approaching") return `Wait ${result.daysUntilQualified}d`;
  return `Hold — ${result.daysUntilQualified}d to qualify`;
}

/** Build a net-after-tax-over-time series for the scenario simulator. */
export interface ScenarioPoint {
  date: string;
  net: number;
  totalTax: number;
  effectiveRate: number;
  qualified: boolean;
}

export function scenarioSeries(
  lot: EquityLot,
  profile: UserProfile,
  fromIso: string,
  toIso: string,
  steps = 60,
): ScenarioPoint[] {
  const start = utcMs(fromIso);
  const end = utcMs(toIso);
  const span = Math.max(1, end - start);
  const pts: ScenarioPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const iso = isoFromMs(start + Math.round((span * i) / steps));
    const r = evaluateLot(lot, profile, iso);
    pts.push({
      date: iso,
      net: r.current.netProceeds,
      totalTax: r.current.totalTax,
      effectiveRate: r.current.effectiveRate,
      qualified: r.current.qualified,
    });
  }
  return pts;
}

export { addMonths, daysBetween };
