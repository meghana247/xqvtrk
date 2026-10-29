from datetime import datetime

from pydantic import BaseModel


class Config(BaseModel):
    target_start: datetime
    target_end: datetime
    default_horizon_hours: int
    max_horizon_hours: int


class SeriesPoint(BaseModel):
    time: datetime
    actual: int
    forecast: int | None


class Metrics(BaseModel):
    """Error statistics in MW, where error = forecast - actual."""

    count: int
    mae: float | None = None
    rmse: float | None = None
    bias: float | None = None
    p10: float | None = None
    p50: float | None = None
    p90: float | None = None


class HorizonMetrics(Metrics):
    horizon_hours: int
