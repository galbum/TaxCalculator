import { sellRecommendation } from "../tax/advisor";
import type { EquityLot, UserProfile } from "../tax/types";

const ICON: Record<string, string> = { wait: "⏳", qualified: "✓", neutral: "ℹ" };

export function SellTimingAdvisor({
  lot,
  profile,
}: {
  lot: EquityLot;
  profile: UserProfile;
}) {
  const rec = sellRecommendation(lot, profile);
  return (
    <div className={`card advisor advisor-${rec.tone}`}>
      <div className="advisor-badge">Best Time To Sell</div>
      <div className="advisor-title">
        <span className="advisor-icon">{ICON[rec.tone]}</span>
        {rec.title}
      </div>
      <p className="advisor-body">{rec.body}</p>
    </div>
  );
}
