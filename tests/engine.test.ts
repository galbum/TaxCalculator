import { describe, expect, it } from "vitest";
import {
  addMonths,
  evaluateLot,
  incomeTaxOn,
  isQualified,
} from "../src/tax/engine";
import { CAPITAL_GAINS_RATE } from "../src/tax/constants";
import type { EquityLot, UserProfile } from "../src/tax/types";

const profile: UserProfile = {
  annualSalary: 600_000, // already in top bracket
  expectedBonus: 0,
  otherIncome: 0,
  aboveBituachLeumiCeiling: true,
  expectedAnnualIncome: null,
};

function rsu(overrides: Partial<EquityLot> = {}): EquityLot {
  return {
    id: "t",
    type: "RSU",
    shares: 1000,
    acquisitionDate: "2020-01-01",
    vestDate: "2021-01-01",
    preGrantAverage: 100,
    currentPrice: 200,
    plannedSalePrice: 200,
    ...overrides,
  };
}

describe("date math", () => {
  it("adds 24 months", () => {
    expect(addMonths("2024-01-15", 24)).toBe("2026-01-15");
  });
  it("detects qualification", () => {
    const lot = rsu({ acquisitionDate: "2024-01-01" });
    expect(isQualified(lot, "2025-12-31")).toBe(false);
    expect(isQualified(lot, "2026-01-01")).toBe(true);
  });
});

describe("progressive income tax", () => {
  it("is monotonic and positive", () => {
    expect(incomeTaxOn(0)).toBe(0);
    expect(incomeTaxOn(100000)).toBeGreaterThan(0);
    expect(incomeTaxOn(200000)).toBeGreaterThan(incomeTaxOn(100000));
  });
});

describe("RSU qualified split", () => {
  const lot = rsu();
  const r = evaluateLot(lot, profile, "2023-01-01"); // 3y later → qualified
  it("splits income vs capital gains at the pre-grant average", () => {
    expect(r.current.qualified).toBe(true);
    expect(r.current.incomeComponent).toBe(1000 * 100);
    expect(r.current.capitalGainComponent).toBe(1000 * (200 - 100));
  });
  it("taxes the capital-gains slice at 25%", () => {
    expect(r.current.capitalGainsTax).toBeCloseTo(1000 * 100 * CAPITAL_GAINS_RATE, 2);
  });
});

describe("RSU breach of trust", () => {
  const lot = rsu({ acquisitionDate: "2024-01-01" });
  const r = evaluateLot(lot, profile, "2025-01-01"); // before 24 months
  it("treats the entire sale as employment income", () => {
    expect(r.current.breachOfTrust).toBe(true);
    expect(r.current.capitalGainComponent).toBe(0);
    expect(r.current.incomeComponent).toBe(1000 * 200);
  });
  it("is more expensive than the qualified case", () => {
    const q = evaluateLot(lot, profile, "2026-02-01");
    expect(r.current.totalTax).toBeGreaterThan(q.current.totalTax);
  });
});

describe("RSU stock drop", () => {
  const lot = rsu({ preGrantAverage: 250, plannedSalePrice: 200, currentPrice: 200 });
  const r = evaluateLot(lot, profile, "2023-01-01");
  it("treats all proceeds as income when price is below pre-grant avg", () => {
    expect(r.current.stockDrop).toBe(true);
    expect(r.current.capitalGainComponent).toBe(0);
    expect(r.current.incomeComponent).toBe(1000 * 200);
  });
});

describe("ESPP", () => {
  const base: Partial<EquityLot> = {
    type: "ESPP",
    shares: 500,
    purchasePrice: 80,
    marketValueOnPurchase: 100,
    currentPrice: 160,
    plannedSalePrice: 160,
  };
  it("qualified: benefit is income, appreciation is capital gains", () => {
    const lot = rsu({ ...base, acquisitionDate: "2020-01-01" } as Partial<EquityLot>);
    const r = evaluateLot(lot, profile, "2023-01-01");
    expect(r.current.incomeComponent).toBe(500 * (100 - 80));
    expect(r.current.capitalGainComponent).toBe(500 * (160 - 100));
  });
  it("breach: entire spread is employment income", () => {
    const lot = rsu({ ...base, acquisitionDate: "2024-01-01" } as Partial<EquityLot>);
    const r = evaluateLot(lot, profile, "2025-01-01");
    expect(r.current.breachOfTrust).toBe(true);
    expect(r.current.incomeComponent).toBe(500 * (160 - 80));
    expect(r.current.capitalGainComponent).toBe(0);
  });
});

describe("efficiency score", () => {
  it("is 100 when already qualified and 0-ish at breach", () => {
    const lot = rsu({ acquisitionDate: "2024-01-01" });
    const qualified = evaluateLot(lot, profile, "2026-06-01");
    const breach = evaluateLot(lot, profile, "2025-01-01");
    expect(qualified.efficiencyScore).toBe(100);
    expect(breach.efficiencyScore).toBeLessThan(50);
  });
});
