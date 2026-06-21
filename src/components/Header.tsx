import type { PortfolioSummary } from "../tax/engine";
import { formatCurrency } from "../tax/format";

function scoreColor(score: number): string {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

export function Header({ summary }: { summary: PortfolioSummary }) {
  const { totalPortfolioValue, totalTax, totalNet, efficiencyScore } = summary;
  return (
    <header className="kpis">
      <div className="kpi">
        <div className="kpi-label">Total Portfolio Value</div>
        <div className="kpi-value">{formatCurrency(totalPortfolioValue)}</div>
        <div className="kpi-foot">at current market price</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Estimated Tax Liability</div>
        <div className="kpi-value">{formatCurrency(totalTax)}</div>
        <div className="kpi-foot">if sold today at planned price</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Estimated Net Proceeds</div>
        <div className="kpi-value accent-green">{formatCurrency(totalNet)}</div>
        <div className="kpi-foot">after estimated taxes</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Tax Efficiency Score</div>
        <div className="kpi-score">
          <div className="kpi-value" style={{ color: scoreColor(efficiencyScore) }}>
            {efficiencyScore}
            <span className="kpi-score-max">/100</span>
          </div>
          <div className="score-track" aria-hidden>
            <div
              className="score-fill"
              style={{ width: `${efficiencyScore}%`, background: scoreColor(efficiencyScore) }}
            />
          </div>
        </div>
        <div className="kpi-foot">higher = closer to capital-gains treatment</div>
      </div>
    </header>
  );
}
