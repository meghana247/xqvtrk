from bisect import bisect_right
from datetime import datetime, timedelta
from math import sqrt
from statistics import mean, median, quantiles

from app.elexon import Actuals, Forecasts
from app.schemas import Metrics, SeriesPoint


def forecast_at_horizon(history: list[tuple[datetime, int]], target: datetime, horizon_hours: int) -> int | None:
    """Latest forecast for `target` published at least `horizon_hours` before it."""
    cutoff = target - timedelta(hours=horizon_hours)
    index = bisect_right(history, cutoff, key=lambda forecast: forecast[0])
    return history[index - 1][1] if index else None


def build_series(
    actuals: Actuals, forecasts: Forecasts, horizon_hours: int, start: datetime, end: datetime
) -> list[SeriesPoint]:
    """Actuals in [start, end) paired with the forecast available at the given horizon.

    Forecasts are hourly, so half-hourly actuals at :30 have no forecast.
    """
    return [
        SeriesPoint(
            time=time,
            actual=actuals[time],
            forecast=forecast_at_horizon(forecasts.get(time, []), time, horizon_hours),
        )
        for time in sorted(actuals)
        if start <= time < end
    ]


def compute_metrics(series: list[SeriesPoint]) -> Metrics:
    errors = [point.forecast - point.actual for point in series if point.forecast is not None]
    if len(errors) < 2:
        return Metrics(count=len(errors))

    deciles = quantiles(errors, n=10)
    return Metrics(
        count=len(errors),
        mae=mean(abs(error) for error in errors),
        rmse=sqrt(mean(error**2 for error in errors)),
        bias=mean(errors),
        p10=deciles[0],
        p50=median(errors),
        p90=deciles[-1],
    )
