import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bot.api.routes import bots, trading
from bot.bot.runner import BotRunner
from bot.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)

runner = BotRunner()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await runner.start()
    yield
    await runner.stop()


app = FastAPI(
    title="VTX Macro Bot API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router, prefix="/api/bots", tags=["bots"])
app.include_router(trading.router, prefix="/api", tags=["trading"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "bots_running": len(runner._bots)}


if __name__ == "__main__":
    uvicorn.run(
        "bot.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
    )
