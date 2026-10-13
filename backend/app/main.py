from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.utils.middleware import IPWhitelistMiddleware
from app.utils.exceptions import LabError
from app.routers import (
    auth,
    files,
    customers,
    methods,
    equipment,
    orders,
    protocols,
    attachments,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import engine
    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.include_router(auth.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(methods.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(protocols.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(IPWhitelistMiddleware)


@app.exception_handler(LabError)
async def lab_error_handler(request, exc: LabError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
