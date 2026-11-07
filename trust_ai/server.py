"""
Trust AI local inference server.

  source venv/bin/activate
  python -m trust_ai.server

Listens on 127.0.0.1:8742 (uncommon port).
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from trust_ai.generate import generate_turn, get_runtime_info, load_model, stream_turn

HOST = "127.0.0.1"
PORT = 8742


@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_model()
    yield


app = FastAPI(title="Trust AI Local Inference", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:43141",
        "http://localhost:43141",
        "http://127.0.0.1:8741",
        "http://localhost:8741",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    mode: Literal["general", "student"] | None = None
    timezone: str = "America/Los_Angeles"
    prior: dict[str, Any] | None = None
    stream: bool = True
    messages: list[ChatMessage] | None = None


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, **get_runtime_info()}


@app.post("/v1/chat")
def chat(body: ChatRequest):
    try:
        if body.stream:
            def gen():
                yield from stream_turn(
                    body.message,
                    mode=body.mode,
                    timezone=body.timezone,
                    prior=body.prior,
                )

            return StreamingResponse(gen(), media_type="application/x-ndjson")
        result = generate_turn(
            body.message,
            mode=body.mode,
            timezone=body.timezone,
            prior=body.prior,
        )
        return result
    except Exception as exc:  # noqa: BLE001 — surface as 500 for UI retry
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def main() -> None:
    import uvicorn

    print(json.dumps({"starting": True, "host": HOST, "port": PORT, **get_runtime_info()}))
    uvicorn.run(
        "trust_ai.server:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
