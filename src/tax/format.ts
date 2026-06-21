const ILS = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const ILS2 = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 2,
});

export function formatCurrency(v: number, decimals = false): string {
  if (!isFinite(v)) return "—";
  return (decimals ? ILS2 : ILS).format(v);
}

export function formatPercent(v: number, digits = 1): string {
  if (!isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
