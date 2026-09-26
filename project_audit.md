# AI Accessibility Assistant - Complete Technical Audit

## 1. CURRENT ARCHITECTURE

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Major Dependencies**: `lucide-react` (icons), Tailwind CSS (styling)
- **Major Components**: `App.jsx` (layout & routing), `CameraFeed.jsx` (vision module)
- **Routing**: Minimal/None (Single page dashboard)
- **State Management**: React `useState`, `useRef`, and `useEffect` hooks.
- **Browser APIs**: `navigator.mediaDevices.getUserMedia` (Camera), `SpeechSynthesis` (Text-to-Speech), `WebSocket` API, `Canvas` API (frame capture).

### Backend
- **Framework**: FastAPI (Python)
- **Python Version**: Python 3.x (runs in virtual environment)
- **API Structure**: Monolithic FastAPI app (`main.py`) delegating to `vision.py`.
- **WebSocket Structure**: Endpoint at `/ws/vision`. Accepts base64 encoded images, passes to AI processing in a separate thread (`asyncio.to_thread`), and returns JSON detection results.
- **Major Dependencies**: `ultralytics` (YOLOv8), `deepface`, `opencv-contrib-python`, `tf-keras`, `websockets`.
- **AI/Model Integrations**: YOLOv8s (object detection), DeepFace (emotion/face detection).

### Communication
- **REST Endpoints**: None currently implemented.
- **WebSockets**: 1 active WebSocket (`ws://localhost:8000/ws/vision`).
- **Data Flow**: 
  1. Browser camera captures frame onto hidden Canvas.
  2. Canvas converts frame to base64 JPEG (0.5 quality).
  3. Frontend sends frame via WebSocket to backend.
  4. Backend decodes base64, runs YOLO and DeepFace.
  5. Backend sends JSON results back via WebSocket.
  6. Frontend updates React state to draw bounding boxes and trigger TTS.
  7. Frontend instantly captures the *next* frame (sequential fast-loop).

---

## 2. WHAT CURRENTLY WORKS

| Feature | Status | Evidence | Notes |
| :--- | :--- | :--- | :--- |
| Frontend starts | IMPLEMENTED | Vite dev server runs. | Connects to `localhost:5173`. |
| Backend starts | IMPLEMENTED | Uvicorn server runs. | Connects to `localhost:8000`. |
| Camera permission | IMPLEMENTED | `getUserMedia` in `CameraFeed.jsx`. | Works on local network/localhost. |
| Camera stream | IMPLEMENTED | `<video>` tag correctly renders stream. | |
| Microphone permission | NOT IMPLEMENTED | No `audio: true` in `getUserMedia`. | |
| Microphone stream | NOT IMPLEMENTED | No frontend audio capture logic. | |
| Audio playback (TTS) | IMPLEMENTED | `SpeechSynthesisUtterance` used. | Speaks emotions (e.g. "Person detected. They appear happy"). |
| Object detection | IMPLEMENTED | `ultralytics` YOLOv8s loaded. | Returns bounding boxes and labels. |
| OCR | NOT IMPLEMENTED | No Tesseract or EasyOCR code exists. | |
| Speech-to-text | NOT IMPLEMENTED | No Whisper code exists. | |
| Image understanding | NOT IMPLEMENTED | No VLM/LLM code exists. | |
| LLM assistant | NOT IMPLEMENTED | No OpenAI/local LLM code exists. | |
| WebSocket | IMPLEMENTED | `/ws/vision` fully functional. | Stable sequential request/response loop. |
| REST API | NOT IMPLEMENTED | No endpoints defined. | |
| Mobile responsiveness | PARTIALLY IMPLEMENTED | Tailwind grid layout scales. | UI scales, but requires HTTPS for mobile camera access. |

---

## 3. CURRENT FRONTEND

- **Main Entry Point**: `main.jsx`
- **Main App Component**: `App.jsx` (Renders dashboard grid layout with placeholders for future modules).
- **Camera Component**: `CameraFeed.jsx` (Handles webcam, WebSocket lifecycle, Canvas base64 encoding, CSS smooth transition bounding boxes, and TTS triggering).
- **Microphone/Audio**: NOT IMPLEMENTED (Only basic TTS exists).
- **Accessibility UI**: High contrast Tailwind colors (dark theme), large bold text placeholders.
- **Unfinished UI**: The dashboard contains mock sections for "Audio Assistant" and "Environment Alerts" that currently do nothing.

**What the user can do**: Open the browser, grant camera permission, point the camera at objects to see green bounding boxes, and point the camera at faces to see colored emotion boxes and hear a synthesized voice announce the emotion.

---

## 4. CURRENT BACKEND

- **`main.py`**:
  - `GET /` (Placeholder? Not heavily used)
  - `WS /ws/vision`: Main WebSocket endpoint. 
    - **Lifecycle**: Accepts connection, enters `while True` loop waiting for `receive_text()`.
    - **Messages from Frontend**: Raw base64 string (JPEG image).
    - **Messages from Backend**: JSON object `{"frame_size": {"width", "height"}, "objects": [...], "emotions": [...]}`.
    - **Error Handling**: Wraps the loop in a generic `try/except` but effectively disconnects on error.

- **`vision.py`**:
  - Contains `yolo_model = YOLO("yolov8s.pt")` and `DeepFace.analyze()`.

---

## 5. AI / ML COMPONENTS

1. **YOLOv8s (Ultralytics)**
   - **Purpose**: Real-time object detection (80 COCO classes).
   - **Initialization**: Module load in `vision.py`.
   - **Execution**: `yolo_model(frame, conf=0.45)`.
   - **Realistic for Browser**: Yes, via backend WebSocket. It processes in ~150ms on CPU.

2. **DeepFace**
   - **Purpose**: Emotion and face detection.
   - **Initialization**: Called dynamically per frame.
   - **Execution**: `DeepFace.analyze(detector_backend="ssd")`.
   - **Realistic for Browser**: Yes, SSD is lightweight enough for real-time CPU inference (~100ms).

*Note: No GPU required, no API keys required, completely offline.*

---

## 6. DEPENDENCY AUDIT

### Frontend
- **react, react-dom**: Necessary.
- **tailwindcss**: Necessary (UI styling).
- **lucide-react**: Necessary (Icons).
- **Risk**: Low. Standard Vite React stack.

### Backend
- **fastapi, uvicorn, websockets**: Necessary (Server & networking).
- **ultralytics**: Necessary (YOLO).
- **deepface**: Necessary (Emotions).
- **opencv-contrib-python==4.10.0.84**: Necessary (Downgraded specifically to fix missing Haar cascades/SSD components in v5).
- **tf-keras**: Necessary (Required by DeepFace).
- **Risk**: Medium. DeepFace and YOLO are heavy packages. They run fine on desktop CPUs but cannot be directly deployed to serverless environments (Vercel/Netlify). Must run locally or on a VPS/Docker.

---

## 7. ENVIRONMENT / API KEYS

- **Environment Variables**: None currently required or defined.
- **API Keys**: None. Everything runs 100% locally.
- **CORS**: Not explicitly configured in FastAPI, but WebSocket connections bypass standard CORS policies, so it currently works.
- **Secrets**: NO SECRETS FOUND.

---

## 8. MOBILE BROWSER COMPATIBILITY

- **Android Chrome / iPhone Safari**: Will **FAIL** to access the camera unless the site is served over **HTTPS** or accessed via `localhost`. Since this runs locally on a desktop, mobile devices on the same Wi-Fi won't be able to use the camera without a local HTTPS tunnel (e.g., `ngrok` or `mkcert`).
- **Autoplay Restrictions**: The TTS `SpeechSynthesis` will fail on mobile unless the user taps the screen first to interact with the DOM.
- **Camera Orientation**: Currently hardcoded to `facingMode: 'user'`. Needs a toggle for `facingMode: 'environment'` (rear camera) to be useful for the blind.
- **Performance**: The frontend sequential fast-loop is very mobile-friendly as it won't overwhelm the mobile network.

---

## 9. RELIABILITY PROBLEMS

1. **CRITICAL**: Mobile camera access requires HTTPS. Accessing `http://192.168.x.x:5173` from a phone will block `getUserMedia`.
2. **HIGH**: Backend error handling in `main.py` WebSocket loop is overly broad. If one frame causes a crash, the WebSocket dies and the frontend has to wait 3 seconds to reconnect.
3. **MEDIUM**: Camera `facingMode` is locked to selfie mode, which is useless for navigating environments.
4. **LOW**: Browser TTS is inconsistent across devices and cuts itself off.

---

## 10. SIMPLIFICATION OPPORTUNITIES

- **Remove Emotion Detection?**: While unique for a research paper, DeepFace is heavy. If performance becomes an issue, DeepFace should be the first thing removed, relying entirely on YOLO for environmental awareness.
- **Avoid VLM (Visual Language Models)**: Do not attempt to run LLaVA or large vision models locally. They are too slow for real-time accessibility. Stick to YOLO + OCR.
- **Keep Audio Simple**: Do not build custom Wakeword engines. Use native browser `SpeechRecognition` API (Web Speech API) instead of a heavy Whisper backend if possible to save resources.

---

## 11. RECOMMENDED MVP

Based on the current code, the realistic MVP should be:
1. **Vision Assistance**: Keep YOLOv8s for real-time obstacle detection (currently implemented).
2. **Reading Assistance**: Add simple Tesseract.js (frontend) or EasyOCR (backend) to read text when requested.
3. **Voice Feedback**: Use browser-native `SpeechSynthesis` (currently implemented, needs polish).
4. **Hearing Assistance**: Use browser-native `webkitSpeechRecognition` for live captions, avoiding heavy backend audio processing entirely.

---

## 12. EXISTING CODE REUSE

| Existing file/component | Keep? | Reason |
| :--- | :--- | :--- |
| `CameraFeed.jsx` | YES | WebSocket polling loop is highly optimized and stable. |
| `vision.py` | YES | YOLO and DeepFace SSD are stable and fast. |
| `main.py` | YES | Clean FastAPI WebSocket structure. |
| `App.jsx` | MODIFY | Needs to hook up the blank UI panels to actual data. |

---

## 13. EXTERNAL OPEN-SOURCE INTEGRATION

Looking at repos like `AURA_AI` or `ContextVision`:
- **What to integrate**: We could look at how they handle *depth estimation* (e.g. MediaPipe or MiDaS) to tell the user "Chair is 2 meters ahead". Right now, YOLO only gives bounding boxes, not distance.
- **Risks**: Merging other repos directly will cause dependency hell. MiDaS requires PyTorch, which conflicts heavily with DeepFace's TensorFlow requirements on some machines.
- **Recommendation**: DO NOT merge external repos. Keep our YOLO + DeepFace stack and build custom logic to estimate distance based on bounding box size relative to the frame.

---

## 14. FINAL REPORT

### CURRENT PROJECT SCORECARD
- **Architecture**: Clean client-server split via WebSockets.
- **Frontend**: Responsive React UI, highly stable WebSocket loop.
- **Backend**: Fast Python CV pipeline, completely offline.
- **Camera**: Functional (Selfie mode only).
- **Microphone**: NOT IMPLEMENTED.
- **Object detection**: Functional (YOLOv8s).
- **OCR**: NOT IMPLEMENTED.
- **Speech recognition**: NOT IMPLEMENTED.
- **TTS**: Functional (Native browser API).
- **AI assistant**: NOT IMPLEMENTED.
- **Mobile readiness**: Poor (Requires HTTPS tunnel for camera access).
- **Reliability**: High (for desktop), but fragile if deployed to mobile without HTTPS.

### TOP 10 NEXT ACTIONS
1. Change camera `facingMode` to `environment` (rear camera) so it can actually see the room.
2. Setup an `ngrok` or `localtunnel` script so the user can test the app on their phone.
3. Implement `webkitSpeechRecognition` in the frontend for live captions (Hearing Assistance).
4. Implement a "Read Text" button that sends the current frame to an OCR engine.
5. Add distance estimation heuristic (bounding box height vs frame height) to YOLO outputs.
6. Connect the "Environment Alerts" UI panel to the YOLO output stream.
7. Refine TTS to only speak when a *new* object appears, rather than spamming the user.
8. Add a Wake Word or Tap-to-speak button for the AI Assistant.
9. Connect a lightweight LLM API (e.g. Groq or Gemini API) for answering questions.
10. Add a UI toggle to turn off DeepFace if the user wants maximum battery/performance.

---

### RECOMMENDED NEXT STEP
**Switch the camera from selfie mode to rear-facing mode, and set up a local HTTPS tunnel (e.g., using `ngrok` or Vite's basic SSL plugin) so the user can successfully open and test the app on their mobile phone.**
