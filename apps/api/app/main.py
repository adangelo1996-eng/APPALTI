from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    routes_auth,
    routes_organizations,
    routes_documents,
    routes_tenders,
    routes_generation,
    routes_analyzer,
)
from app.core.config import get_settings
from app.core.middleware import logging_middleware


settings = get_settings()

app = FastAPI(title="RFP AI Co-Pilot API")

if settings.backend_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.backend_cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.middleware("http")(logging_middleware)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(routes_auth.router, prefix="/api/v1")
app.include_router(routes_organizations.router, prefix="/api/v1")
app.include_router(routes_documents.router, prefix="/api/v1")
app.include_router(routes_tenders.router, prefix="/api/v1")
app.include_router(routes_generation.router, prefix="/api/v1")
app.include_router(routes_analyzer.router, prefix="/api/v1")

