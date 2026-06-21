import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { EquityForm } from "./components/EquityForm";
import { PortfolioTable } from "./components/PortfolioTable";
import { TaxBreakdownChart } from "./components/TaxBreakdownChart";
import { SellTimingAdvisor } from "./components/SellTimingAdvisor";
import { InsightsPanel } from "./components/InsightsPanel";
import { ScenarioSimulator } from "./components/ScenarioSimulator";
import { evaluatePortfolio } from "./tax/engine";
import { optimizationInsights } from "./tax/advisor";
import { defaultLots, defaultProfile } from "./sampleData";
import { STORAGE_KEY, THEME_KEY } from "./config";
import type { EquityLot, UserProfile } from "./tax/types";

interface PersistedState {
  lots: EquityLot[];
  profile: UserProfile;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* ignore */
  }
  return { lots: defaultLots, profile: defaultProfile };
}

export function App() {
  const initial = useMemo(loadState, []);
  const [lots, setLots] = useState<EquityLot[]>(initial.lots);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [selectedId, setSelectedId] = useState<string | null>(initial.lots[0]?.id ?? null);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lots, profile }));
  }, [lots, profile]);

  const summary = useMemo(() => evaluatePortfolio(lots, profile), [lots, profile]);
  const insights = useMemo(
    () => optimizationInsights(summary.results, profile),
    [summary.results, profile],
  );

  const selected = useMemo(
    () => summary.results.find((r) => r.lot.id === selectedId) ?? summary.results[0],
    [summary.results, selectedId],
  );

  return (
    <div className="app">
      <nav className="topbar">
        <div className="brand">
          <span className="brand-mark">₪</span>
          <div>
            <div className="brand-title">Israel Equity Tax Calculator</div>
            <div className="brand-sub">Section 102 · Capital Gains Track with Trustee</div>
          </div>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle dark mode"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </nav>

      <Header summary={summary} />

      <main className="grid">
        <section className="col-main">
          <EquityForm
            lots={lots}
            profile={profile}
            selectedId={selected?.lot.id ?? null}
            onSelect={setSelectedId}
            onChangeLots={setLots}
            onChangeProfile={setProfile}
          />
          <PortfolioTable
            results={summary.results}
            selectedId={selected?.lot.id ?? null}
            onSelect={setSelectedId}
          />
        </section>

        <aside className="col-side">
          {selected && <SellTimingAdvisor lot={selected.lot} profile={profile} />}
          {selected && <TaxBreakdownChart result={selected} />}
          <InsightsPanel insights={insights} />
        </aside>
      </main>

      {selected && (
        <section className="full">
          <ScenarioSimulator lot={selected.lot} profile={profile} />
        </section>
      )}

      <footer className="disclaimer">
        Estimates for planning only — not tax advice. Tax parameters reflect 2025
        figures and must be verified against the Israel Tax Authority (רשות המסים)
        and Bituach Leumi. All amounts are treated as ILS.
      </footer>
    </div>
  );
}
