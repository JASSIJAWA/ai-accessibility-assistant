# Multimodal AI Assistive Dashboard
**7th Semester Major Project & Research Implementation**

## 🎯 Project Overview
A real-time Web Dashboard designed to assist individuals with sensory impairments (Visual and Hearing). This project focuses on moving beyond basic detection algorithms to provide **Cognitive and Social Assistance** utilizing Edge AI and Large Language Models (LLMs).

## 🔬 Novel Research Contributions (USP)
1. **For Visually Impaired - Facial Sentiment & Context Analysis:**
   Instead of merely detecting people, the system uses facial landmarking and CNNs to detect the *emotion* of the person interacting with the user, helping them "read the room" (e.g., "The person is smiling").
2. **For Hearing Impaired - LLM Contextual Summarization & Sentiment:**
   Instead of causing cognitive overload with continuous subtitles, the system utilizes LLMs to summarize conversations and analyzes acoustic tone (e.g., urgency, anger) to provide emotional context visually.

## 🛠️ Architecture
*   **Frontend (Dashboard):** React.js (Vite) - Captures webcam and microphone streams via MediaDevices API.
*   **Backend (AI Processing):** Python (FastAPI) - Processes streams asynchronously using OpenCV, MediaPipe, and AI/LLM models via WebSockets.

## 🚀 Setup Instructions

1. **Start the AI Backend:**
   ```bash
   cd backend
   .\venv\Scripts\Activate.ps1
   python main.py
   ```

2. **Start the Frontend Dashboard:**
   ```bash
   cd frontend
   npm run dev
   ```

## 📱 Mobile Testing (Local Network)

To test the application on your mobile phone's browser, you must connect via HTTPS so the browser allows camera access. The development environment is automatically configured for this.

1. Find the **Network URL** in the output of `npm run dev` (e.g., `https://192.168.x.x:5173/`).
2. Type that EXACT URL into your iPhone Safari or Android Chrome browser (ensure your phone is on the same Wi-Fi).
3. **Security Warning:** Your phone will warn you that the connection is "Not Private" because it uses a local development certificate. Click **Advanced** and then **Proceed / Continue** to access the dashboard.
4. Grant camera permissions. You can use the "Switch Camera" button to toggle between the front and rear cameras.
