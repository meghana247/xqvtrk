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

**Scope:** delivery from 2 Jan to 1 Feb 2026, the days covered by day-ahead decisions made in January. Times are UTC, which equals UK time in winter. Forecasts are hourly, so the half-hourly actuals at :30 are charted but not scored.

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

## AI tools

This project was built with the help of [Claude Code](https://claude.com/claude-code), which was used for scaffolding, implementation and documentation. The design decisions, data checks and results were reviewed by the author.
