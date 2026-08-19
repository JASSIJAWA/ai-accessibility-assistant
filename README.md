# AI-Powered Assistive System
**7th Semester Major Project**

## 🎯 Project Overview
An AI-powered assistive application designed to enhance accessibility and independence for individuals with visual and hearing impairments. 

## 🧠 Brainstorming & Feature Ideas

### 👁️ For Visually Impaired Individuals
*   **Real-time Scene & Object Description:** Uses a camera to identify objects (e.g., "chair ahead," "person approaching") and reads them out using Text-to-Speech (TTS).
*   **OCR (Optical Character Recognition):** Reads text from the physical world, like menus, signboards, or documents.
*   **Obstacle Detection & Navigation:** Uses depth estimation or object detection to provide audio or haptic (vibration) feedback when obstacles are near.
*   **Facial Recognition:** Identifies friends and family members and announces their presence.

### 🦻 For Hearing Impaired Individuals
*   **Live Transcriptions (Speech-to-Text):** Listens to conversations and displays real-time subtitles on the screen.
*   **Sign Language Translation:** Uses computer vision (like MediaPipe) to track hand gestures and translates sign language into text or spoken words.
*   **Environmental Audio Alerts:** Detects critical sounds (sirens, doorbells, fire alarms, babies crying) and converts them into visual notifications or vibrations.

## 🛠️ Tech Stack & Architecture
We are focusing on a **Web App Dashboard** that utilizes built-in laptop and mobile hardware (webcams and microphones), eliminating the need for external hardware.

*   **Frontend (Dashboard):** React.js or Next.js (for a responsive UI that can access webcam/mic via standard Web APIs).
*   **Backend (AI Processing):** Python (FastAPI or Flask) to handle heavy ML computations and communicate with the frontend via WebSockets or REST APIs.
*   **AI/ML Models (Proposed):**
    *   *Vision:* YOLO (Object Detection), MediaPipe (Pose/Hand tracking).
    *   *Audio:* OpenAI Whisper or SpeechRecognition (Live captions).

## 🚀 Next Steps
1.  **Project Scaffold:** Initialize the `frontend` (React) and `backend` (Python) directories.
2.  **Feature Selection:** Pick the first AI feature to integrate into the dashboard (e.g., Object Detection via webcam or Live Speech-to-Text).
3.  **UI Design:** Design the dashboard layout to display camera feeds, live text, and alerts.
