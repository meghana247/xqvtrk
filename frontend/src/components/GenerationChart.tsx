import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SeriesPoint } from "../api/client";
import { formatDateTime, formatDay, formatMW } from "../format";

interface Props {
  series: SeriesPoint[];
  horizon: number;
}

export function GenerationChart({ series, horizon }: Props) {
  return (
    <section className="card">
      <h2>Actual vs forecast wind generation</h2>
      <p className="subtitle">Forecast shown is the latest one published at least {horizon}h before each hour.</p>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatDay} minTickGap={40} stroke="var(--muted)" />
          <YAxis tickFormatter={(value) => `${value / 1000}k`} stroke="var(--muted)" width={40} />
          <Tooltip
            labelFormatter={formatDateTime}
            formatter={(value: number) => formatMW(value)}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          />
          <Legend />
          <Line name="Actual" dataKey="actual" stroke="var(--actual)" dot={false} strokeWidth={1.5} />
          <Line name="Forecast" dataKey="forecast" stroke="var(--forecast)" dot={false} strokeWidth={1.5} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
