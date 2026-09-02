# CoAct.AI - Implementation Guide

**Version:** 1.0

This document outlines the technical implementation, architecture, and setup instructions for the CoAct.AI interactive roleplay simulator.

---

## 1. Implementation & Architecture

The platform is built on a modern, high-performance stack prioritizing speed and cloud-based AI processing.

### Technology Stack
| **Category**        | **Tools**                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| **Frontend**        | React (Vite), TypeScript, TailwindCSS                                  |
| **Backend**         | Python (FastAPI)                                                       |
| **Database**        | MongoDB                                                              |
| **LLM (Reasoning)** | Groq API (`llama-3.3-70b-versatile`)                                   |
| **STT (Speech-to-Text)**| Groq API (`whisper-large-v3-turbo`)                                |
| **TTS (Text-to-Speech)**| Sarvam AI (`bulbul:v3` for Indian accents) or OpenAI (`tts-1`)     |

### Data Flow Logic
1. **Input:** Human user selects a scenario and speaks their response via the browser microphone (MediaRecorder API).
2. **STT:** Audio is sentx to the FastAPI backend and forwarded to Groq's Whisper API for near-instant transcription.
3. **Reasoning:** The transcription is added to the conversation history. The backend constructs a highly optimized prompt (using truncated history) and calls Groq's Llama 3.3.
4. **TTS:** The AI's text response is sent to Sarvam AI (or OpenAI) to generate a realistic voice payload, which is streamed back to the frontend.
5. **Report Generation:** Upon completion (up to 12 turns), a consolidated LLM call analyzes the full transcript and generates a detailed performance PDF report.

---

## 2. Getting Started

### Prerequisites
-   **Node.js 18+**
-   **Python 3.10+**

### Configuration
Create a `.env` file in the `inter-ai-backend` directory with the following minimum API keys to run the backend:
```env
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
SARVAM_API_KEY=your_sarvam_key
```

### Running Locally (Dev Mode)

**Backend (Python FastAPI):**
```bash
cd inter-ai-backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

**Frontend (React/Vite):**
```bash
cd inter-ai-frontend
npm install
npm run dev
```

**Mobile App (React Native):**
```bash
cd CoActMobile
npm install
npm run android # or npm run ios
```

For more detailed information, please refer to the `README.md` files located in each respective directory, as well as the `MOBILE_REACT_NATIVE_BLUEPRINT.md` for the mobile architecture.
