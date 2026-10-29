export interface Config {
  target_start: string;
  target_end: string;
  default_horizon_hours: number;
  max_horizon_hours: number;
}

export interface SeriesPoint {
  time: string;
  actual: number;
  forecast: number | null;
}

/** Error statistics in MW, where error = forecast - actual. */
export interface Metrics {
  count: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  p10: number | null;
  p50: number | null;
  p90: number | null;
}

export interface HorizonMetrics extends Metrics {
  horizon_hours: number;
}

export interface Filters {
  start: string;
  end: string;
  horizon: number;
}

const query = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();

export const urls = {
  config: "/api/config",
  series: (filters: Filters) => `/api/series?${query({ ...filters })}`,
  metrics: (filters: Filters) => `/api/metrics?${query({ ...filters })}`,
  metricsByHorizon: ({ start, end }: Filters) => `/api/metrics/by-horizon?${query({ start, end })}`,
};
