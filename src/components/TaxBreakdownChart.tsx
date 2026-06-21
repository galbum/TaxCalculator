import type { LotResult } from "../tax/types";
import { formatCurrency, formatPercent } from "../tax/format";

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function TaxBreakdownChart({ result }: { result: LotResult }) {
  const b = result.current;
  const slices: Slice[] = [
    { key: "income", label: "Income Tax", value: b.incomeTax, color: "var(--c-income)" },
    { key: "bl", label: "Bituach Leumi", value: b.bituachLeumi, color: "var(--c-bl)" },
    { key: "surtax", label: "Surtax", value: b.surtax, color: "var(--c-surtax)" },
    { key: "cgt", label: "Capital Gains Tax", value: b.capitalGainsTax, color: "var(--c-cgt)" },
    { key: "net", label: "Net Received", value: Math.max(0, b.netProceeds), color: "var(--c-net)" },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Tax Composition</h2>
        <span className="tag">{formatCurrency(b.grossProceeds)} gross</span>
      </div>

      <div className="stacked-bar" role="img" aria-label="Tax composition breakdown">
        {slices.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.key}
                className="stacked-seg"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                title={`${s.label}: ${formatCurrency(s.value)}`}
              />
            ),
        )}
      </div>

      <ul className="breakdown-list">
        {slices.map((s) => (
          <li key={s.key}>
            <span className="dot" style={{ background: s.color }} />
            <span className="bl-label">{s.label}</span>
            <span className="bl-val">{formatCurrency(s.value)}</span>
            <span className="bl-pct">{formatPercent(s.value / total)}</span>
          </li>
        ))}
      </ul>

      <div className="breakdown-foot">
        <div>
          <span className="muted">Effective tax rate</span>
          <strong>{formatPercent(b.effectiveRate)}</strong>
        </div>
        {b.breachOfTrust && <span className="pill pill-breach">Breach of Trust</span>}
        {b.stockDrop && <span className="pill pill-approaching">Stock below pre-grant avg</span>}
        {b.qualified && !b.stockDrop && <span className="pill pill-qualified">Capital gains track</span>}
      </div>
    </div>
  );
}
