import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HorizonMetrics } from "../api/client";
import { formatMW } from "../format";

interface Props {
  data: HorizonMetrics[];
  horizon: number;
}

export function HorizonErrorChart({ data, horizon }: Props) {
  return (
    <section className="card">
      <h2>How accuracy changes with lead time</h2>
      <p className="subtitle">Error statistics for every horizon from 0 to 48 hours ahead.</p>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 16, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="horizon_hours"
            stroke="var(--muted)"
            label={{ value: "Hours ahead", position: "insideBottom", offset: -8, fill: "var(--muted)" }}
          />
          <YAxis tickFormatter={(value) => `${value / 1000}k`} stroke="var(--muted)" width={40} />
          <Tooltip
            labelFormatter={(value) => `${value}h ahead`}
            formatter={(value: number) => formatMW(value)}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          />
          <Legend verticalAlign="top" />
          <ReferenceLine x={horizon} stroke="var(--muted)" strokeDasharray="4 4" />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Line name="MAE" dataKey="mae" stroke="var(--forecast)" dot={false} strokeWidth={2} />
          <Line name="Bias" dataKey="bias" stroke="var(--actual)" dot={false} strokeWidth={2} />
          <Line name="P10" dataKey="p10" stroke="var(--muted)" dot={false} strokeDasharray="4 4" />
          <Line name="P90" dataKey="p90" stroke="var(--muted)" dot={false} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
