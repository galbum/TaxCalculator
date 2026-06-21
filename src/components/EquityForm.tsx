import type { EquityLot, EquityType, UserProfile } from "../tax/types";
import { todayIso } from "../tax/engine";

interface Props {
  lots: EquityLot[];
  profile: UserProfile;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChangeLots: (lots: EquityLot[]) => void;
  onChangeProfile: (p: UserProfile) => void;
}

let idCounter = Date.now();
function newId() {
  return `lot-${idCounter++}`;
}

function blankLot(type: EquityType): EquityLot {
  return {
    id: newId(),
    type,
    shares: 100,
    acquisitionDate: todayIso(),
    vestDate: type === "RSU" ? todayIso() : undefined,
    preGrantAverage: type === "RSU" ? 0 : undefined,
    purchasePrice: type === "ESPP" ? 0 : undefined,
    marketValueOnPurchase: type === "ESPP" ? 0 : undefined,
    currentPrice: 0,
    plannedSalePrice: 0,
  };
}

function NumberField({
  label,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value as number) ? (value as number) : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function EquityForm({
  lots,
  profile,
  selectedId,
  onSelect,
  onChangeLots,
  onChangeProfile,
}: Props) {
  function updateLot(id: string, patch: Partial<EquityLot>) {
    onChangeLots(lots.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLot(type: EquityType) {
    const lot = blankLot(type);
    onChangeLots([...lots, lot]);
    onSelect(lot.id);
  }
  function removeLot(id: string) {
    onChangeLots(lots.filter((l) => l.id !== id));
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Equity Lots</h2>
        <div className="btn-row">
          <button className="btn" onClick={() => addLot("RSU")}>
            + RSU
          </button>
          <button className="btn" onClick={() => addLot("ESPP")}>
            + ESPP
          </button>
        </div>
      </div>

      <div className="lots">
        {lots.length === 0 && (
          <p className="muted">No equity lots yet. Add an RSU or ESPP grant to begin.</p>
        )}
        {lots.map((lot) => {
          const isSel = lot.id === selectedId;
          return (
            <div
              key={lot.id}
              className={`lot ${isSel ? "lot-selected" : ""}`}
              onClick={() => onSelect(lot.id)}
            >
              <div className="lot-head">
                <select
                  value={lot.type}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const next = blankLot(e.target.value as EquityType);
                    updateLot(lot.id, { ...next, id: lot.id, shares: lot.shares });
                  }}
                >
                  <option value="RSU">RSU</option>
                  <option value="ESPP">ESPP</option>
                </select>
                <button
                  className="btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLot(lot.id);
                  }}
                  aria-label="Remove lot"
                >
                  ✕
                </button>
              </div>

              <div className="field-grid" onClick={(e) => e.stopPropagation()}>
                <NumberField
                  label="Number of Shares"
                  value={lot.shares}
                  onChange={(v) => updateLot(lot.id, { shares: v })}
                  step="1"
                />
                {lot.type === "RSU" ? (
                  <>
                    <DateField
                      label="Grant Date"
                      value={lot.acquisitionDate}
                      onChange={(v) => updateLot(lot.id, { acquisitionDate: v })}
                    />
                    <DateField
                      label="Vest Date"
                      value={lot.vestDate}
                      onChange={(v) => updateLot(lot.id, { vestDate: v })}
                    />
                    <NumberField
                      label="30-Day Pre-Grant Avg Price"
                      value={lot.preGrantAverage}
                      onChange={(v) => updateLot(lot.id, { preGrantAverage: v })}
                    />
                  </>
                ) : (
                  <>
                    <DateField
                      label="Purchase Date"
                      value={lot.acquisitionDate}
                      onChange={(v) => updateLot(lot.id, { acquisitionDate: v })}
                    />
                    <NumberField
                      label="Purchase Price (discounted)"
                      value={lot.purchasePrice}
                      onChange={(v) => updateLot(lot.id, { purchasePrice: v })}
                    />
                    <NumberField
                      label="Market Value on Purchase"
                      value={lot.marketValueOnPurchase}
                      onChange={(v) => updateLot(lot.id, { marketValueOnPurchase: v })}
                    />
                  </>
                )}
                <NumberField
                  label="Current Market Price"
                  value={lot.currentPrice}
                  onChange={(v) => updateLot(lot.id, { currentPrice: v })}
                />
                <NumberField
                  label="Planned Sale Price"
                  value={lot.plannedSalePrice}
                  onChange={(v) => updateLot(lot.id, { plannedSalePrice: v })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-head profile-head">
        <h2>Your Tax Profile</h2>
      </div>
      <div className="field-grid">
        <NumberField
          label="Annual Salary"
          value={profile.annualSalary}
          onChange={(v) => onChangeProfile({ ...profile, annualSalary: v })}
        />
        <NumberField
          label="Expected Bonus"
          value={profile.expectedBonus}
          onChange={(v) => onChangeProfile({ ...profile, expectedBonus: v })}
        />
        <NumberField
          label="Other Taxable Income"
          value={profile.otherIncome}
          onChange={(v) => onChangeProfile({ ...profile, otherIncome: v })}
        />
        <NumberField
          label="Expected Annual Income (override)"
          value={profile.expectedAnnualIncome ?? 0}
          onChange={(v) =>
            onChangeProfile({ ...profile, expectedAnnualIncome: v > 0 ? v : null })
          }
        />
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={profile.aboveBituachLeumiCeiling}
            onChange={(e) =>
              onChangeProfile({ ...profile, aboveBituachLeumiCeiling: e.target.checked })
            }
          />
          <span>Already above Bituach Leumi ceiling</span>
        </label>
      </div>
    </div>
  );
}
