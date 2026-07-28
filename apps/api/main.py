import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import PORT, SENTRY_DSN
from interview.answer_upload import upload_answer_chunk
from interview.question_audio import render_questions_for_job
from interview.structured_relay import StructuredInterviewRelay
from interview.supabase_store import get_store
from interview.webhooks import WebhookEventType, build_webhook_payload, sign_payload
from interview.calendar import CalendarSyncService
from routes.v1 import router as v1_router
from utils.http_pool import close_http_client, init_http_client
from utils.logger import setup_logger

# Optional observability
try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter
    METRICS_ENABLED = True
    WS_ERROR_COUNTER = Counter('hireloop_ws_errors_total', 'WebSocket errors')
except Exception:
    METRICS_ENABLED = False

# Optional Sentry
if SENTRY_DSN:
    try:
        import sentry_sdk

        sentry_sdk.init(dsn=SENTRY_DSN)
    except Exception:
        pass

setup_logger()
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# CORS origins - set via environment variable (trim whitespace from CSV entries)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"
    ).split(",")
    if origin.strip()
]

# WebSocket connection tracking (simple in-memory per-process guard)
_CONNECTIONS_BY_IP: dict[str, int] = {}
_CONNECTIONS_LOCK = asyncio.Lock()
MAX_WS_PER_IP = int(os.getenv("MAX_WS_PER_IP", "3"))
MAX_WS_MESSAGE_BYTES = int(os.getenv("MAX_WS_MESSAGE_BYTES", str(10 * 1024 * 1024)))  # 10MB

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting HireLoop Interview API")
    await init_http_client()
    yield
    # Shutdown
    logger.info("Shutting down HireLoop Interview API")
    await close_http_client()

app = FastAPI(title="HireLoop Interview API", version="0.3.0", lifespan=lifespan)

# Include v1 API routes
app.include_router(v1_router)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def root() -> FileResponse:
    return FileResponse("frontend/index.html")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "hireloop-interview-api", "mode": "structured"}


# Prometheus metrics endpoint
if METRICS_ENABLED:
    @app.get('/metrics')
    async def metrics():
        data = generate_latest()
        return PlainTextResponse(content=data, media_type=CONTENT_TYPE_LATEST)


class RenderAudioRequest(BaseModel):
    question_ids: list[str]
    langs: list[str] | None = None


@app.post("/interview/session/state")
@limiter.limit("30/minute")
async def interview_session_state(request: Request, token: str = Query(...)) -> JSONResponse:
    """Reconnect endpoint — returns persisted session state without reinitializing."""
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        state = await store.get_session_state(token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not state:
        raise HTTPException(status_code=404, detail="No resumable session")
    return JSONResponse(state)


@app.post("/interview/answers/chunk")
@limiter.limit("100/minute")
async def upload_answer_chunk_route(
    request: Request,
    x_interview_token: str = Header(..., alias="X-Interview-Token"),
    x_session_id: str = Header(..., alias="X-Session-Id"),
    x_question_index: int = Header(..., alias="X-Question-Index"),
    x_chunk_index: int = Header(..., alias="X-Chunk-Index"),
) -> JSONResponse:
    """Upload a single answer audio chunk over HTTP (durable, retryable)."""
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        await store.validate_interview_upload(x_interview_token, x_session_id, x_question_index)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty chunk")

    try:
        path = await upload_answer_chunk(
            x_session_id, x_question_index, x_chunk_index, body
        )
    except Exception as exc:
        logger.error("Chunk upload failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Chunk upload failed") from exc

    return JSONResponse({"ok": True, "path": path, "chunk_index": x_chunk_index})


@app.post("/admin/questions/render-audio")
@limiter.limit("10/minute")
async def render_question_audio_route(
    request: Request,
    body: RenderAudioRequest,
    x_internal_secret: str = Header(default="", alias="X-Internal-Secret"),
) -> JSONResponse:
    """Pre-render TTS for questions (called from admin after saving questions)."""
    expected = os.getenv("INTERVIEW_INTERNAL_SECRET", "")
    if not expected or x_internal_secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    langs = tuple(body.langs or ["en", "hi"])
    results = await render_questions_for_job(store, body.question_ids, langs=langs)
    return JSONResponse({"rendered": results})


@app.websocket("/ws/interview")
async def interview_websocket(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    lang: str = Query(default="en"),
) -> None:
    # Validate token BEFORE accepting connection to prevent resource exhaustion
    store = get_store()
    if not store:
        await websocket.close(code=1011, reason="Service unavailable")
        return
    
    if not token:
        await websocket.close(code=4001, reason="Interview token required")
        return

    # Per-IP connection limit
    client_ip = "unknown"
    try:
        client_ip = websocket.client[0]
    except Exception:
        pass
    async with _CONNECTIONS_LOCK:
        count = _CONNECTIONS_BY_IP.get(client_ip, 0)
        if count >= MAX_WS_PER_IP:
            await websocket.close(code=4009, reason="Too many connections from this IP")
            return
        _CONNECTIONS_BY_IP[client_ip] = count + 1

    try:
        # Validate token exists and interview is accessible
        try:
            ctx = await store.load_application_for_interview(token)
            if not ctx:
                await websocket.close(code=4002, reason="Invalid or expired interview link")
                return
        except ValueError as exc:
            await websocket.close(code=4002, reason=str(exc))
            return
        except Exception as exc:
            logger.error("Token validation failed: %s", exc)
            await websocket.close(code=1011, reason="Validation error")
            return

        await websocket.accept()
        logger.info("Interview WebSocket connected token=yes lang=%s", lang)

        try:
            await websocket.send_json({"type": "bootstrap"})
        except WebSocketDisconnect:
            logger.info("Client disconnected before session bootstrap")
            return

        relay = StructuredInterviewRelay(websocket, token=token, language=lang)

        async def receive_from_client() -> None:
            try:
                while True:
                    message = await websocket.receive()
                    if message.get("type") == "websocket.disconnect":
                        break
                    # Size checks
                    if message.get("bytes") is not None:
                        if len(message["bytes"]) > MAX_WS_MESSAGE_BYTES:
                            logger.warning("Dropping oversized binary message from %s", client_ip)
                            await websocket.close(code=4003, reason="Message too large")
                            break
                        await relay.handle_client_message(message["bytes"])
                    elif message.get("text") is not None:
                        if len(message["text"]) > 20000:
                            logger.warning("Dropping oversized text message from %s", client_ip)
                            await websocket.close(code=4003, reason="Message too large")
                            break
                        try:
                            payload = json.loads(message["text"])
                        except json.JSONDecodeError:
                            payload = {"type": "text", "text": message["text"]}
                        await relay.handle_client_message(payload)
            except WebSocketDisconnect:
                logger.info("Interview WebSocket disconnected")
            except RuntimeError as exc:
                if "disconnect" in str(exc).lower() or "close" in str(exc).lower():
                    logger.info("Interview WebSocket receive ended after disconnect")
                else:
                    logger.error("Client receive error: %s", exc, exc_info=True)
                    if METRICS_ENABLED:
                        WS_ERROR_COUNTER.inc()
            except Exception as exc:
                logger.error("Client receive error: %s", exc, exc_info=True)
                if METRICS_ENABLED:
                    WS_ERROR_COUNTER.inc()
            finally:
                # Client is gone — stop the relay loops so they don't spin forever.
                relay.client_disconnected()

        receive_task = asyncio.create_task(receive_from_client())

        try:
            await relay.run()
        except WebSocketDisconnect:
            logger.info("Client disconnected during interview relay")
        except Exception as exc:
            if exc.__class__.__name__ == "ClientDisconnected":
                logger.info("Client disconnected during interview relay")
            else:
                logger.error("Interview relay error: %s", exc, exc_info=True)
                if METRICS_ENABLED:
                    WS_ERROR_COUNTER.inc()
                try:
                    await websocket.send_json(
                        {"type": "error", "message": f"{type(exc).__name__}: {exc}"}
                    )
                except Exception:
                    pass
        finally:
            receive_task.cancel()
            try:
                await websocket.close()
            except Exception:
                pass
            logger.info("Interview WebSocket closed")
    finally:
        async with _CONNECTIONS_LOCK:
            _CONNECTIONS_BY_IP[client_ip] = max(0, _CONNECTIONS_BY_IP.get(client_ip, 1) - 1)


if __name__ == "__main__":
    import uvicorn

    # ws_max_size: recorded answers arrive as base64 audio over the WebSocket;
    # the 1MB default silently kills the connection on longer answers.
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, ws_max_size=32 * 1024 * 1024)
