from datetime import datetime, timedelta, timezone

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

# Day-ahead purchases decided in January 2026 cover delivery from 2 Jan to 1 Feb.
# UK local time equals UTC in winter, so UTC is used throughout.
TARGET_START = datetime(2026, 1, 2, tzinfo=timezone.utc)
TARGET_END = datetime(2026, 2, 2, tzinfo=timezone.utc)

DEFAULT_HORIZON_HOURS = 24
MAX_HORIZON_HOURS = 48

# Fetch forecasts published early enough to serve the longest horizon, plus a day of margin.
FORECAST_PUBLISH_START = TARGET_START - timedelta(hours=MAX_HORIZON_HOURS + 24)
