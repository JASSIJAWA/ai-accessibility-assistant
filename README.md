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
*(Instructions will be added as we build out the modules)*
