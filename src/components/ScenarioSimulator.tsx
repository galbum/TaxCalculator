import { useMemo, useState } from "react";
import { addMonths, evaluateLot } from "../tax/engine";
import { scenarioSeries } from "../tax/advisor";
import { formatCurrency, formatDate, formatPercent } from "../tax/format";
import { SIMULATOR_HORIZON_MONTHS, SIMULATOR_STEPS as STEPS } from "../config";
import type { EquityLot, UserProfile } from "../tax/types";

const W = 720;
const H = 260;
const PAD = { l: 64, r: 20, t: 20, b: 36 };

export function ScenarioSimulator({
  lot,
  profile,
}: {
  lot: EquityLot;
  profile: UserProfile;
}) {
  const from = lot.acquisitionDate;
  const to = useMemo(
    () => addMonths(lot.acquisitionDate, SIMULATOR_HORIZON_MONTHS),
    [lot.acquisitionDate],
  );
  const qualDate = useMemo(() => addMonths(lot.acquisitionDate, 24), [lot.acquisitionDate]);

  const series = useMemo(
    () => scenarioSeries(lot, profile, from, to, STEPS),
    [lot, profile, from, to],
  );
  const [idx, setIdx] = useState(() => {
    // Start the slider near the qualification point.
    const qi = series.findIndex((p) => p.qualified);
    return qi >= 0 ? qi : Math.floor(STEPS / 2);
  });

  const point = series[Math.min(idx, series.length - 1)];
  const selEval = useMemo(
    () => evaluateLot(lot, profile, point.date),
    [lot, profile, point.date],
  );

  const nets = series.map((p) => p.net);
  const minNet = Math.min(...nets);
  const maxNet = Math.max(...nets);
  const optimalIdx = nets.indexOf(maxNet);
  const range = maxNet - minNet || 1;

  const x = (i: number) => PAD.l + (i / STEPS) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - ((v - minNet) / range) * (H - PAD.t - PAD.b);

  const path = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.net)}`).join(" ");
  const area =
    `M ${x(0)} ${H - PAD.b} ` +
    series.map((p, i) => `L ${x(i)} ${y(p.net)}`).join(" ") +
    ` L ${x(STEPS)} ${H - PAD.b} Z`;

  const qualIdx = series.findIndex((p) => p.qualified);
  const savings = selEval.current.totalTax - (series[optimalIdx]?.totalTax ?? selEval.current.totalTax);

  return (
    <div className="card">
      <div className="card-head">
        <h2>Scenario Simulator</h2>
        <span className="tag">Sell date: {formatDate(point.date)}</span>
      </div>

      <div className="sim-metrics">
        <div>
          <span className="muted">Tax liability</span>
          <strong>{formatCurrency(selEval.current.totalTax)}</strong>
        </div>
        <div>
          <span className="muted">Effective rate</span>
          <strong>{formatPercent(selEval.current.effectiveRate)}</strong>
        </div>
        <div>
          <span className="muted">Net proceeds</span>
          <strong className="accent-green">{formatCurrency(selEval.current.netProceeds)}</strong>
        </div>
        <div>
          <span className="muted">Tax saved vs optimal</span>
          <strong>{formatCurrency(Math.max(0, savings))}</strong>
        </div>
      </div>

      <input
        className="slider"
        type="range"
        min={0}
        max={STEPS}
        value={idx}
        onChange={(e) => setIdx(parseInt(e.target.value, 10))}
        aria-label="Sell date"
      />

      <svg className="sim-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net after-tax proceeds over time">
        {/* y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const val = minNet + f * range;
          const yy = y(val);
          return (
            <g key={f}>
              <line x1={PAD.l} y1={yy} x2={W - PAD.r} y2={yy} className="grid" />
              <text x={PAD.l - 8} y={yy + 4} className="axis-label" textAnchor="end">
                {formatCurrency(val)}
              </text>
            </g>
          );
        })}

        {/* qualification marker */}
        {qualIdx >= 0 && (
          <g>
            <line x1={x(qualIdx)} y1={PAD.t} x2={x(qualIdx)} y2={H - PAD.b} className="mark-qual" />
            <text x={x(qualIdx)} y={PAD.t - 6} className="mark-label" textAnchor="middle">
              24-mo qualifies
            </text>
          </g>
        )}

        {/* optimal marker */}
        <g>
          <line x1={x(optimalIdx)} y1={PAD.t} x2={x(optimalIdx)} y2={H - PAD.b} className="mark-opt" />
          <circle cx={x(optimalIdx)} cy={y(maxNet)} r={4} className="dot-opt" />
        </g>

        <path d={area} className="area" />
        <path d={path} className="line" />

        {/* selected position */}
        <circle cx={x(idx)} cy={y(point.net)} r={5} className="dot-sel" />

        {/* x labels */}
        <text x={PAD.l} y={H - 10} className="axis-label" textAnchor="start">
          {formatDate(from)}
        </text>
        <text x={x(qualIdx >= 0 ? qualIdx : STEPS / 2)} y={H - 10} className="axis-label" textAnchor="middle">
          {formatDate(qualDate)}
        </text>
        <text x={W - PAD.r} y={H - 10} className="axis-label" textAnchor="end">
          {formatDate(to)}
        </text>
      </svg>

      <p className="sim-note muted">
        Net after-tax proceeds across possible sell dates (planned price held
        constant). The step up marks the 24-month Section 102 qualification.
      </p>
    </div>
  );
}
