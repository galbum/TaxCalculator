import type { LotResult } from "../tax/types";
import { lotStatus, recommendedAction } from "../tax/advisor";
import { formatCurrency, formatDate } from "../tax/format";

const STATUS_LABEL: Record<string, string> = {
  qualified: "Qualified",
  approaching: "Approaching",
  breach: "Breach risk",
};

export function PortfolioTable({
  results,
  selectedId,
  onSelect,
}: {
  results: LotResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (results.length === 0) return null;
  return (
    <div className="card">
      <div className="card-head">
        <h2>Portfolio</h2>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th className="num">Shares</th>
              <th className="num">Current Value</th>
              <th>24-Mo</th>
              <th className="num">Est. Tax</th>
              <th className="num">Net</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const status = lotStatus(r);
              const value = (r.lot.shares || 0) * (r.lot.currentPrice || 0);
              return (
                <tr
                  key={r.lot.id}
                  className={`row-${status} ${r.lot.id === selectedId ? "row-selected" : ""}`}
                  onClick={() => onSelect(r.lot.id)}
                >
                  <td>{r.lot.type}</td>
                  <td>{formatDate(r.lot.acquisitionDate)}</td>
                  <td className="num">{(r.lot.shares || 0).toLocaleString()}</td>
                  <td className="num">{formatCurrency(value)}</td>
                  <td>
                    <span className={`pill pill-${status}`}>{STATUS_LABEL[status]}</span>
                  </td>
                  <td className="num">{formatCurrency(r.current.totalTax)}</td>
                  <td className="num">{formatCurrency(r.current.netProceeds)}</td>
                  <td>{recommendedAction(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span className="pill pill-qualified">Qualified</span>
        <span className="pill pill-approaching">Approaching (≤90d)</span>
        <span className="pill pill-breach">Breach of Trust risk</span>
      </div>
    </div>
  );
}
