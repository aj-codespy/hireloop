import asyncio
import json
import logging
import os

from fastapi import FastAPI, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import PORT
from interview.answer_upload import upload_answer_chunk
from interview.question_audio import render_questions_for_job
from interview.structured_relay import StructuredInterviewRelay
from interview.supabase_store import get_store

logging.basicConfig(level=logging.INFO)
logging.getLogger("interview.structured_relay").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="HireLoop Interview API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def root() -> FileResponse:
    return FileResponse("frontend/index.html")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "hireloop-interview-api", "mode": "structured"}


class RenderAudioRequest(BaseModel):
    question_ids: list[str]
    langs: list[str] | None = None


@app.get("/interview/session/state")
async def interview_session_state(token: str = Query(...)) -> JSONResponse:
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
async def render_question_audio_route(
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
    await websocket.accept()
    logger.info("Interview WebSocket connected token=%s lang=%s", "yes" if token else "no", lang)

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
                if message.get("bytes") is not None:
                    await relay.handle_client_message(message["bytes"])
                elif message.get("text") is not None:
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
        except Exception as exc:
            logger.error("Client receive error: %s", exc, exc_info=True)
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


if __name__ == "__main__":
    import uvicorn

    # ws_max_size: recorded answers arrive as base64 audio over the WebSocket;
    # the 1MB default silently kills the connection on longer answers.
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, ws_max_size=32 * 1024 * 1024)
