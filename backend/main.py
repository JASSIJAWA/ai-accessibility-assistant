"""
AI Accessibility Assistant — Backend Server
FastAPI + WebSocket server for real-time vision & audio processing.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import asyncio
from vision import process_frame

app = FastAPI(title="AI Assistive Backend")

# Allow React frontend to communicate with Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "Backend AI is running!", "modules": ["vision"]}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/vision")
async def vision_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time vision processing.
    Receives base64-encoded video frames from the frontend,
    runs object detection + emotion recognition,
    and sends back JSON results.
    """
    await websocket.accept()
    print("✅ Vision WebSocket connected")

    # Throttle: skip frames if processing is slower than capture
    processing = False

    try:
        while True:
            data = await websocket.receive_text()

            # Skip if we're still processing the previous frame
            if processing:
                continue

            processing = True
            try:
                # Run AI processing in a thread to not block the event loop
                result = await asyncio.to_thread(process_frame, data)
                await websocket.send_text(json.dumps(result))
            except Exception as e:
                error_msg = json.dumps({"error": str(e)})
                await websocket.send_text(error_msg)
            finally:
                processing = False

    except WebSocketDisconnect:
        print("❌ Vision WebSocket disconnected")
    except Exception as e:
        print(f"❌ Vision WebSocket error: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
