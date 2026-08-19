from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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
    return {"status": "Backend AI is running!"}

@app.websocket("/ws/vision")
async def vision_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # We will receive base64 video frames from React here later
            data = await websocket.receive_text()
            await websocket.send_text("Frame received by AI")
    except Exception as e:
        print(f"WebSocket closed: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
