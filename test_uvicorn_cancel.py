import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

async def background_work():
    try:
        logging.info("Background work started")
        await asyncio.sleep(5)
        logging.info("Background work finished")
    except asyncio.CancelledError:
        logging.warning("Background work CANCELLED")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    asyncio.create_task(background_work())
    try:
        await websocket.receive_text()
    except WebSocketDisconnect:
        logging.info("Client disconnected")
    return

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
