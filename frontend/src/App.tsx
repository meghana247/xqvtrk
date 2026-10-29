import { useEffect, useState } from "react";

import { urls, type Config, type Filters, type HorizonMetrics, type Metrics, type SeriesPoint } from "./api/client";
import { Controls } from "./components/Controls";
import { GenerationChart } from "./components/GenerationChart";
import { HorizonErrorChart } from "./components/HorizonErrorChart";
import { MetricsPanel } from "./components/MetricsPanel";
import { useFetch } from "./hooks/useFetch";

const toDate = (iso: string) => iso.slice(0, 10);
const dayBefore = (iso: string) => toDate(new Date(Date.parse(iso) - 86_400_000).toISOString());

export default function App() {
  const config = useFetch<Config>(urls.config);
  const [filters, setFilters] = useState<Filters>();

  useEffect(() => {
    if (config.data) {
      setFilters({
        start: toDate(config.data.target_start),
        end: dayBefore(config.data.target_end),
        horizon: config.data.default_horizon_hours,
      });
    }
  }, [config.data]);

  const series = useFetch<SeriesPoint[]>(filters ? urls.series(filters) : null);
  const metrics = useFetch<Metrics>(filters ? urls.metrics(filters) : null);
  const byHorizon = useFetch<HorizonMetrics[]>(filters ? urls.metricsByHorizon(filters) : null);
  const error = config.error ?? series.error ?? metrics.error ?? byHorizon.error;

  return (
    <main>
      <header>
        <h1>UK Wind Forecast Monitor</h1>
        <p className="subtitle">
          National wind generation forecasts (Elexon WINDFOR) against actuals (Elexon FUELHH) for day-ahead
          purchases decided in January 2026.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      {config.data && filters ? (
        <>
          <Controls
            filters={filters}
            minDate={toDate(config.data.target_start)}
            maxDate={dayBefore(config.data.target_end)}
            maxHorizon={config.data.max_horizon_hours}
            onChange={setFilters}
          />
          <MetricsPanel metrics={metrics.data} horizon={filters.horizon} />
          <GenerationChart series={series.data ?? []} horizon={filters.horizon} />
          <HorizonErrorChart data={byHorizon.data ?? []} horizon={filters.horizon} />
        </>
      ) : (
        !error && <p className="subtitle">Loading data from Elexon…</p>
      )}
    </main>
  );
}
