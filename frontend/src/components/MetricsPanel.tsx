import type { Metrics } from "../api/client";
import { formatMW } from "../format";

interface Props {
  metrics?: Metrics;
  horizon: number;
}

export function MetricsPanel({ metrics, horizon }: Props) {
  const cards = [
    { label: "Mean absolute error", value: formatMW(metrics?.mae), hint: "Typical size of a miss" },
    { label: "RMSE", value: formatMW(metrics?.rmse), hint: "Weights large misses more" },
    {
      label: "Bias",
      value: formatMW(metrics?.bias),
      hint: (metrics?.bias ?? 0) >= 0 ? "Forecast tends to over-predict" : "Forecast tends to under-predict",
    },
    {
      label: "80% error range",
      value: `${formatMW(metrics?.p10)} to ${formatMW(metrics?.p90)}`,
      hint: "P10 to P90 of forecast − actual",
    },
  ];

  return (
    <section className="card">
      <h2>Forecast error at {horizon}h ahead</h2>
      <p className="subtitle">Based on {metrics?.count ?? 0} hourly forecasts. Error = forecast − actual.</p>
      <div className="metrics">
        {cards.map((card) => (
          <div key={card.label} className="metric">
            <span className="metric-label">{card.label}</span>
            <span className="metric-value">{card.value}</span>
            <span className="metric-hint">{card.hint}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
