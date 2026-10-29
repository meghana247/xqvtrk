import type { Filters } from "../api/client";

interface Props {
  filters: Filters;
  minDate: string;
  maxDate: string;
  maxHorizon: number;
  onChange: (filters: Filters) => void;
}

export function Controls({ filters, minDate, maxDate, maxHorizon, onChange }: Props) {
  return (
    <section className="controls">
      <label>
        From
        <input
          type="date"
          value={filters.start}
          min={minDate}
          max={filters.end}
          onChange={(event) => onChange({ ...filters, start: event.target.value })}
        />
      </label>
      <label>
        To
        <input
          type="date"
          value={filters.end}
          min={filters.start}
          max={maxDate}
          onChange={(event) => onChange({ ...filters, end: event.target.value })}
        />
      </label>
      <label className="horizon">
        Forecast horizon: <strong>{filters.horizon}h ahead</strong>
        <input
          type="range"
          min={0}
          max={maxHorizon}
          value={filters.horizon}
          onChange={(event) => onChange({ ...filters, horizon: Number(event.target.value) })}
        />
      </label>
    </section>
  );
}
