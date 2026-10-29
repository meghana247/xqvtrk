from fastapi import FastAPI

from app.routes import router

app = FastAPI(title="Wind Forecast Monitor")
app.include_router(router)
