from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import contracts
from app.api.routes import analyses
from app.api.routes import stripe_routes

app = FastAPI(title="DORA Checker API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts.router,     prefix="/api", tags=["contracts"])
app.include_router(analyses.router,      prefix="/api", tags=["analyses"])
app.include_router(stripe_routes.router, prefix="/api", tags=["billing"])


@app.get("/health")
async def health():
    return {"status": "ok"}
