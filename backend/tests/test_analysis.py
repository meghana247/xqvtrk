from datetime import datetime, timedelta, timezone

import pytest

from app.analysis import build_series, compute_metrics, forecast_at_horizon
from app.schemas import SeriesPoint

TARGET = datetime(2026, 1, 15, 12, tzinfo=timezone.utc)
HISTORY = [
    (TARGET - timedelta(hours=40), 8000),
    (TARGET - timedelta(hours=24), 9000),
    (TARGET - timedelta(hours=6), 9500),
]


@pytest.mark.parametrize(
    ("horizon", "expected"),
    [(0, 9500), (6, 9500), (7, 9000), (24, 9000), (30, 8000), (40, 8000), (41, None)],
)
def test_forecast_at_horizon_picks_latest_forecast_before_cutoff(horizon, expected):
    assert forecast_at_horizon(HISTORY, TARGET, horizon) == expected


def test_build_series_filters_window_and_leaves_unforecast_points_empty():
    half_hour = TARGET + timedelta(minutes=30)
    actuals = {TARGET - timedelta(hours=1): 1, TARGET: 9200, half_hour: 9300}

    series = build_series(actuals, {TARGET: HISTORY}, 24, TARGET, TARGET + timedelta(hours=1))

    assert series == [
        SeriesPoint(time=TARGET, actual=9200, forecast=9000),
        SeriesPoint(time=half_hour, actual=9300, forecast=None),
    ]


def test_compute_metrics():
    series = [
        SeriesPoint(time=TARGET, actual=100, forecast=110),
        SeriesPoint(time=TARGET, actual=100, forecast=70),
        SeriesPoint(time=TARGET, actual=100, forecast=None),
    ]

    metrics = compute_metrics(series)

    assert metrics.count == 2
    assert metrics.mae == 20
    assert metrics.bias == -10
    assert metrics.rmse == pytest.approx(500**0.5)


def test_compute_metrics_without_enough_data():
    assert compute_metrics([]).model_dump(exclude_none=True) == {"count": 0}
