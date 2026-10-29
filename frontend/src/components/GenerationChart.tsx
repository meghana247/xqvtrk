import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SeriesPoint } from "../api/client";
import { formatDateTime, formatDay, formatMW } from "../format";

interface Props {
  series: SeriesPoint[];
  horizon: number;
}

// Ranges up to this long label ticks with the time as well as the day.
const SHORT_RANGE_MS = 3 * 86_400_000;

export function GenerationChart({ series, horizon }: Props) {
  // Forecasts are hourly, so plot hourly points; the forecast line then breaks only where no forecast exists.
  const points = series
    .map((point) => ({ ...point, time: Date.parse(point.time) }))
    .filter((point) => new Date(point.time).getUTCMinutes() === 0);
  const span = points.length ? points[points.length - 1].time - points[0].time : 0;
  const formatTick = span <= SHORT_RANGE_MS ? formatDateTime : formatDay;

  return (
    <section className="card">
      <h2>Actual vs forecast wind generation</h2>
      <p className="subtitle">Forecast shown is the latest one published at least {horizon}h before each hour.</p>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTick}
            minTickGap={40}
            stroke="var(--muted)"
          />
          <YAxis tickFormatter={(value) => `${value / 1000}k`} stroke="var(--muted)" width={40} />
          <Tooltip
            labelFormatter={formatDateTime}
            formatter={(value: number) => formatMW(value)}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          />
          <Legend />
          <Line name="Actual" dataKey="actual" stroke="var(--actual)" dot={false} strokeWidth={1.5} />
          <Line name="Forecast" dataKey="forecast" stroke="var(--forecast)" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
