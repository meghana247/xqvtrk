# UK Wind Forecast Monitor

A web app for a UK utility's day-ahead trading team. It shows how accurate national wind generation forecasts were for purchases decided in January 2026, so traders can size their thermal procurement with the forecast error in mind.

- **Actuals:** [Elexon FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) (`fuelType = WIND`, half-hourly)
- **Forecasts:** [Elexon WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) (hourly, republished several times a day)

**Live app:** _to be added after deployment_

## How it works

Every target hour has many forecasts, published at different times before it. The **forecast horizon** `H` decides which one is used: the latest forecast published at least `H` hours before the target time. With `H = 24` the app shows what a trader actually had in hand when buying a day ahead.

For the chosen horizon and date range, the app reports the error (`forecast − actual`) as:

| Metric | Meaning |
|---|---|
| MAE | Typical size of a miss |
| RMSE | Like MAE, but penalises large misses |
| Bias | Systematic over (+) or under (−) forecasting |
| P10 – P90 | Range that covers 80% of errors, usable as a procurement buffer |

## Findings

Based on delivery from 2 Jan to 1 Feb 2026. One winter month is a small sample, so treat these as pilot results. The full analysis, with charts, is in the [analysis notebook](analysis/wind_forecast_analysis.ipynb).

**1. The forecast consistently over-predicts wind.**
At 24h ahead, the forecast is above the actual in 87% of hours, by 1,736 MW on average (about 15% of mean wind output).

**2. The over-prediction is largest when wind is high and at night.**

| 24h-ahead forecast | Hours | Average over-prediction |
|---|---|---|
| Below 10 GW | 243 | ~950 MW |
| 10–15 GW | 205 | 1,212 MW |
| 15–20 GW | 252 | 2,426 MW |
| Above 20 GW | 44 | 4,591 MW |

The bias is also about 2.2 GW between midnight and 06:00, against about 1.3 GW in the afternoon. Actual output never went above 17.8 GW, while forecasts reached 21 GW. The worst misses (night of 11–12 Jan, about 6.7 GW) show actual output flat at about 14 GW while the forecast was about 20.8 GW.

This pattern is **consistent with curtailment**: wind farms being paid to reduce output when the grid can't take the power, which happens most on windy, low-demand nights. If WINDFOR forecasts what the turbines could produce and FUELHH measures what they were allowed to produce, the gap would look exactly like this. **This is not yet confirmed.** Checking it would need Elexon's curtailment instructions to wind units (the BOALF dataset), which are outside this pilot's scope. Differences in which wind farms each dataset covers could also contribute.

**3. Error grows steadily with lead time.**

| Horizon | MAE | Bias | P90 of error |
|---|---|---|---|
| 0h | 1,680 MW | 1,471 MW | 3,431 MW |
| 12h | 1,791 MW | 1,595 MW | 3,609 MW |
| 24h | 1,932 MW | 1,736 MW | 3,858 MW |
| 48h | 2,301 MW | 1,801 MW | 4,611 MW |

Most of the error at every horizon is bias rather than random noise. With the bias removed, the 24h error is roughly ±2.1 GW (P10 to P90).

**4. What this means for the trading team.**
Buying thermal power against the raw wind forecast leaves the team **short** in most hours, because less wind arrives than forecast. For day-ahead purchases (24h horizon):

- **Correct for bias:** plan on about 1.7 GW less wind than forecast.
- **Add a buffer for the remaining uncertainty:** to cover 9 in 10 hours, plan on about **3.9 GW less wind than the forecast** (the P90 error).
- **Increase the buffer on windy nights**, where the gap is largest.

Before relying on these figures, recompute them over a longer period (at least a full year) to capture seasonal effects.

## Decisions & trade-offs

- **No database.** One month of data is about 1,500 actuals and 20,000 forecasts, fetched in two API calls in a few seconds. The historical data doesn't change, so it's fetched once per process and cached in memory. A database would add setup and moving parts with no benefit at this size.
- **Analysis window: 2 Jan to 1 Feb 2026.** The brief covers purchase decisions *made* in January. A day-ahead decision on day D is for delivery on D+1, so decisions from 1 to 31 Jan cover delivery from 2 Jan to 1 Feb. Forecasts are fetched from three days earlier so that even the 48h horizon has data for 2 Jan.
- **UTC throughout.** UK local time equals UTC in winter, so January has no daylight-saving offset to handle.
- **Matching hourly forecasts to half-hourly actuals.** WINDFOR is hourly and FUELHH is half-hourly. Forecasts are compared only with the actual for the half-hour starting on the hour (for example, 14:00 with 14:00–14:30). No forecast values are invented by interpolation. The chart plots the same hourly points, so a break in the forecast line always means no forecast was available at that horizon.
- **Forecasts after the target time are dropped.** WINDFOR sometimes includes values published after their target time. These are effectively observations, not forecasts, so they're excluded.
- **Missing forecasts aren't filled.** At long horizons, some hours have no forecast published that far ahead (at 48h, only 589 of 744 hours have one). Those hours are left out of the metrics rather than estimated.

**For production, I would:**

- fetch new data on a schedule (every 30 minutes, matching how often FUELHH publishes) instead of once at startup;
- store data in a time-series database (PostgreSQL with TimescaleDB) so history builds up and the app doesn't depend on Elexon being available;
- add a live view of the latest forecast for tomorrow, with the error buffer applied, so the app supports the next decision rather than only reviewing past ones;
- handle Elexon outages with retries and serve the last good data;
- compute metrics over rolling windows (last 30 days, same month last year) to track seasonal changes.

## Project structure

```
backend/                 Python · FastAPI
  app/
    config.py            Analysis window and horizon limits
    elexon.py            Fetches and caches FUELHH and WINDFOR data
    analysis.py          Forecast selection by horizon and error metrics
    routes.py            REST endpoints
    schemas.py           Response models
    main.py              App entry point
  tests/                 Unit tests for the analysis logic
frontend/                React · TypeScript · Vite · Recharts
  src/
    api/client.ts        API types and URL builders
    hooks/useFetch.ts    Data-fetching hook
    components/          Controls, metrics panel and charts
    App.tsx              Page layout and state
  nginx.conf             Serves the build and proxies /api to the backend
analysis/
  wind_forecast_analysis.ipynb   Error distribution, time of day, wind level, horizon, worst misses
docker-compose.yml
```

## API

| Endpoint | Returns |
|---|---|
| `GET /api/config` | Analysis window and horizon limits |
| `GET /api/series?horizon=24&start=2026-01-02&end=2026-02-01` | Actual and horizon-selected forecast per half-hour |
| `GET /api/metrics?horizon=24&start=…&end=…` | Error metrics for one horizon |
| `GET /api/metrics/by-horizon?start=…&end=…` | Error metrics for every horizon from 0 to 48h |

`start` and `end` are optional, inclusive dates. Interactive docs are at `/docs` on the backend.

## Running the app

**Docker** (recommended):

```bash
docker compose up --build
```

Open http://localhost:3000.

**Locally:**

```bash
# Backend (http://localhost:8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

**Tests:**

```bash
cd backend && pytest
```

**Analysis notebook:**

The notebook reuses the backend's data loading, so it runs from the `analysis/` folder.

```bash
cd analysis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook wind_forecast_analysis.ipynb
```

## AI tools

This project was built with the help of [Claude Code](https://claude.com/claude-code), which was used for scaffolding, implementation and documentation. The design decisions, data checks and results were reviewed by the author.
