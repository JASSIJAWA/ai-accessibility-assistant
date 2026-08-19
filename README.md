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

## 🛠️ Potential Tech Stack
*   **Frontend / Platform:** 
    *   *Mobile App* (Flutter / React Native) - Highly recommended as smartphones have cameras, mics, and haptics built-in.
    *   *Hardware Prototype* (Raspberry Pi + Camera) - Great if you want a physical wearable device (like smart glasses).
*   **AI/ML Models:**
    *   *Vision:* YOLO (Object Detection), EasyOCR/Tesseract (Text reading), MediaPipe (Hand tracking).
    *   *Audio:* OpenAI Whisper (Speech-to-Text), PyTorch/TensorFlow (Audio classification for alarms).
*   **Backend (if needed):** Python (FastAPI or Flask) to process heavy ML tasks off-device.

## 🚀 Next Steps
1.  **Select the Scope:** Choose 2-3 core features to focus on first (building all of them might be too large for one semester).
2.  **Choose the Platform:** Decide if this will be a Mobile App, Web App, or a Hardware Prototype.
3.  **Setup Repository:** Commit the initial plan to Git.
