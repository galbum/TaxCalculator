import { addMonths, todayIso } from "./tax/engine";
import type { EquityLot, UserProfile } from "./tax/types";

function isoMonthsAgo(months: number): string {
  return addMonths(todayIso(), -months);
}

export const defaultProfile: UserProfile = {
  annualSalary: 480_000,
  expectedBonus: 60_000,
  otherIncome: 0,
  aboveBituachLeumiCeiling: true,
  expectedAnnualIncome: null,
};

export const defaultLots: EquityLot[] = [
  {
    id: "lot-1",
    type: "RSU",
    shares: 1200,
    acquisitionDate: isoMonthsAgo(21), // ~3 months from qualifying
    vestDate: isoMonthsAgo(9),
    preGrantAverage: 90,
    currentPrice: 160,
    plannedSalePrice: 165,
  },
  {
    id: "lot-2",
    type: "RSU",
    shares: 800,
    acquisitionDate: isoMonthsAgo(30), // already qualified
    vestDate: isoMonthsAgo(18),
    preGrantAverage: 70,
    currentPrice: 160,
    plannedSalePrice: 165,
  },
  {
    id: "lot-3",
    type: "ESPP",
    shares: 400,
    acquisitionDate: isoMonthsAgo(14),
    purchasePrice: 102,
    marketValueOnPurchase: 120,
    currentPrice: 160,
    plannedSalePrice: 165,
  },
];
