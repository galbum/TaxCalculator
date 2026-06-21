export function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Tax Optimization Insights</h2>
      </div>
      <ul className="insights">
        {insights.map((text, i) => (
          <li key={i}>
            <span className="insight-bullet">💡</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
