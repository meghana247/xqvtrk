"""Elexon BMRS client. Both datasets are fetched once per process and cached in memory."""

from collections import defaultdict
from datetime import datetime
from functools import lru_cache

import httpx

from app.config import ELEXON_BASE_URL, FORECAST_PUBLISH_START, TARGET_END, TARGET_START

Actuals = dict[datetime, int]
# Target time -> [(publish time, generation)], sorted by publish time.
Forecasts = dict[datetime, list[tuple[datetime, int]]]


def _fetch(dataset: str, start: datetime, end: datetime, **params) -> list[dict]:
    response = httpx.get(
        f"{ELEXON_BASE_URL}/{dataset}/stream",
        params={"publishDateTimeFrom": start.isoformat(), "publishDateTimeTo": end.isoformat(), **params},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def _in_window(time: datetime) -> bool:
    return TARGET_START <= time < TARGET_END


@lru_cache
def get_actuals() -> Actuals:
    """Half-hourly national wind generation (MW), keyed by start time."""
    rows = _fetch("FUELHH", TARGET_START, TARGET_END, fuelType="WIND")
    actuals = {datetime.fromisoformat(row["startTime"]): row["generation"] for row in rows}
    return {time: generation for time, generation in actuals.items() if _in_window(time)}


@lru_cache
def get_forecasts() -> Forecasts:
    """Hourly wind forecasts (MW), grouped by target time."""
    forecasts: Forecasts = defaultdict(list)
    for row in _fetch("WINDFOR", FORECAST_PUBLISH_START, TARGET_END):
        target = datetime.fromisoformat(row["startTime"])
        published = datetime.fromisoformat(row["publishTime"])
        # Forecasts published after their target time are not forecasts.
        if _in_window(target) and published <= target:
            forecasts[target].append((published, row["generation"]))
    for history in forecasts.values():
        history.sort()
    return dict(forecasts)
