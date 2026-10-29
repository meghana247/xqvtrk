from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Query

from app.analysis import build_series, compute_metrics
from app.config import DEFAULT_HORIZON_HOURS, MAX_HORIZON_HOURS, TARGET_END, TARGET_START
from app.elexon import get_actuals, get_forecasts
from app.schemas import Config, HorizonMetrics, Metrics, SeriesPoint

router = APIRouter(prefix="/api")

Horizon = Annotated[int, Query(ge=0, le=MAX_HORIZON_HOURS)]
# Inclusive dates; omitted means the full target window.
StartDate = Annotated[date | None, Query()]
EndDate = Annotated[date | None, Query()]


def _midnight_utc(day: date) -> datetime:
    return datetime.combine(day, time(), timezone.utc)


def _window(start: date | None, end: date | None) -> tuple[datetime, datetime]:
    return (
        _midnight_utc(start) if start else TARGET_START,
        _midnight_utc(end + timedelta(days=1)) if end else TARGET_END,
    )


def _series(horizon: int, start: date | None, end: date | None) -> list[SeriesPoint]:
    return build_series(get_actuals(), get_forecasts(), horizon, *_window(start, end))


@router.get("/config")
def config() -> Config:
    return Config(
        target_start=TARGET_START,
        target_end=TARGET_END,
        default_horizon_hours=DEFAULT_HORIZON_HOURS,
        max_horizon_hours=MAX_HORIZON_HOURS,
    )


@router.get("/series")
def series(horizon: Horizon = DEFAULT_HORIZON_HOURS, start: StartDate = None, end: EndDate = None) -> list[SeriesPoint]:
    return _series(horizon, start, end)


@router.get("/metrics")
def metrics(horizon: Horizon = DEFAULT_HORIZON_HOURS, start: StartDate = None, end: EndDate = None) -> Metrics:
    return compute_metrics(_series(horizon, start, end))


@router.get("/metrics/by-horizon")
def metrics_by_horizon(start: StartDate = None, end: EndDate = None) -> list[HorizonMetrics]:
    return [
        HorizonMetrics(horizon_hours=horizon, **compute_metrics(_series(horizon, start, end)).model_dump())
        for horizon in range(MAX_HORIZON_HOURS + 1)
    ]
