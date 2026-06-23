# CoAct.AI — Running Guide & Architecture

<p align="center">
  <img src="logos/coactai.png" alt="CoAct.AI Logo" width="600"/>
</p>

Welcome to the **CoAct.AI** codebase. CoAct.AI is an AI-powered interactive roleplay simulation platform consisting of a React-based web app, a React Native mobile app, and a FastAPI backend.

---

## 1. System Architecture

CoAct.AI is built as a split-architecture application with a centralized Python FastAPI backend serving two client applications: a React-based web app and a React Native-based mobile app. 

### High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Clients
        Web[React Web App - Vite]
        Mobile[React Native Mobile App]
    end

    subgraph Backend Services [FastAPI Backend]
        API[FastAPI Server]
        Cache[(Unified Session Cache - Redis/TTLCache)]
        DB[(MongoDB Container - Authenticated)]
    end

    subgraph Local AI Engine [GPU Accelerated via Docker]
        LocalSTT[Faster Whisper Large-v3]
        UnifiedLLM[vLLM Unified Serving: Qwen2.5-7B]
        TTS[Piper Local TTS / Edge TTS]
    end

    Web <-->|HTTP / WebSockets / Proxy| API
    Mobile <-->|HTTP / JSON / Multi-part| API
    
    API <--> Cache
    API <--> DB
    
    API <-->|Audio Transcription| LocalSTT
    API <-->|Reasoning & Live Chat| UnifiedLLM
    API -->|Voice Synthesis| TTS
```

### Component Details
1. **Frontend Web App (`inter-ai-frontend`)**:
   - Built with **React**, **Vite**, **TypeScript**, and **TailwindCSS**.
   - Handles client-side audio recording using the browser's MediaRecorder API.
   - Communicates with the backend using relative URLs proxied through Vite's dev server locally, or Nginx in production.
2. **Mobile App (`CoActMobile`)**:
   - Built with **React Native (CLI)**.
   - Leverages native device APIs for audio recording (`react-native-audio-recorder-player`) and PDF rendering (`react-native-pdf`).
   - Connects directly to the backend IP/Port.
3. **Backend API Server (`inter-ai-backend`)**:
   - Built with **Python (FastAPI)**.
   - **Authentication**: JWT-based session security via custom tokens.
   - **Rate Limiting**: Custom Token Bucket Rate Limiter to prevent API abuse.
   - **Caching**: Unified Cache supporting local in-memory TTLCache and Redis for session state management.
   - **Database**: SQLite (SQLAlchemy) for rapid local development; MongoDB Atlas for production data persistence.
4. **AI Processing Layer (Fully Local & GPU Accelerated)**:
   - **Speech-to-Text (STT)**: Hosted locally using `faster-whisper-large-v3` for zero-latency, private transcription.
   - **Reasoning & Live Chat**: Unified `vLLM` server running `Qwen2.5-7B-Instruct`. Employs chunked-prefill to generate massive PDF reports in the background without causing any latency in live roleplay chats.
   - **Text-to-Speech (TTS)**: Local `Piper` models or `edge-tts` for high-speed streaming voice audio.
   - **Report Generation**: Employs parallel threaded processing to evaluate transcripts across multiple criteria (EQ, STAR, GROW) simultaneously, generating a secure PDF report.

---

## 2. Environment Configuration

The application is configured to run **fully locally** without relying on external APIs for its core AI functionality.

### Core Architecture Components (Local)
- **Unified LLM**: Powered by `vLLM` running `Qwen2.5-7B-Instruct`.
- **Speech-to-Text**: Powered by `faster-whisper-large-v3`.
- **Database**: Local `MongoDB` container (authenticated).

### Environment Files Setup
From the project root, duplicate the `.env.example` file to create your `.env` file:
```bash
copy .env.example .env
```

Ensure the following critical variables are set in your `.env` for the local GPU architecture:
```env
USE_LOCAL_AI=true
GROQ_OPENAI_BASE_URL=http://vllm:8000/v1
CHAT_OPENAI_BASE_URL=http://vllm:8000/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
CHAT_MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
MONGODB_URI=mongodb://admin:coact_secure_db_pass_2026@mongodb:27017/coact?authSource=admin
JWT_SECRET=your_secure_64_character_hex_string
```

---

## 3. How to Run Locally & In Production

The entire stack is containerized using Docker, allowing you to easily spin up the frontend, backend, database, and all AI models simultaneously.

### Prerequisites
- **Docker & Docker Compose** installed.
- **NVIDIA GPU** with at least 48GB VRAM (e.g., RTX 6000 Ada / A6000) for local AI models.
- **NVIDIA Container Toolkit** installed to allow Docker to access the GPU.

### Starting the Full Stack
To spin up the entire application (including the heavily optimized vLLM server, Whisper STT, secured MongoDB, FastAPI backend, and React frontend), simply run:

```bash
docker compose up -d --build
```

*This will boot up the services. The React Web App will be available at `http://localhost` (or your domain), and the backend API will be running on port `8000`.*

### Shutting Down
To gracefully stop the application:
```bash
docker compose down
```

*(Note: To completely wipe the database volume and start fresh, use `docker compose down -v`)*

#### 3. Start the Mobile Client
1. Navigate to the mobile folder:
   ```bash
   cd CoActMobile
   ```
2. Install JS dependencies:
   ```bash
   npm install
   ```
3. For iOS (macOS only), install CocoaPods:
   ```bash
   cd ios && pod install && cd ..
   ```
4. Run on Emulator/Device:
   - **Android Emulator**:
     ```bash
     npm run android
     ```
   - **iOS Simulator**:
     ```bash
     npm run ios
     ```

> [!NOTE]
> **Mobile Emulator/Device Network Bridge**:
> The mobile client in `CoActMobile/src/lib/api.ts` is configured to target port `8000`.
> - **iOS Simulator** communicates via `http://localhost:8000`.
> - **Android Emulator** automatically maps to the host machine via `http://10.0.2.2:8000`.
> - **Physical Devices** must use your laptop's LAN IP (e.g., `http://192.168.1.50:8000`). Make sure your device is on the same Wi-Fi network as the backend host.

---

## 4. Product Interface Preview

Here is a preview of the CoAct.AI dashboard interface and brand theme mockup:

<p align="center">
  <img src="inter-ai-frontend/src/assets/dashboard_mockup.png" alt="CoAct.AI Dashboard Interface" width="800"/>
</p>

<p align="center">
  <img src="logos/concept_3_brand_theme_mockups.png" alt="CoAct.AI Brand Theme Mockup" width="800"/>
</p>

---

## 5. Documentation Index

Additional detailed guides are located in the **[Docs](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs)** folder:

- **[Detailed Environment Setup Guide](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/ENV_SETUP.md)** — In-depth guide to obtaining Groq, Sarvam, OpenAI, and MongoDB keys and configuring `.env` files.
- **[Production Server Deployment Guide](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/DEPLOYMENT.md)** — Step-by-step production deployment using Docker & Nginx.
- **[Mobile Integration Blueprint](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/MOBILE_REACT_NATIVE_BLUEPRINT.md)** — Detailed specification for the React Native implementation.
- **[SSL Certificate Configuration](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/SSL_SETUP.md)** — How to set up HTTPS and Let's Encrypt certificates.
- **[Security Policy](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/SECURITY.md)** — Security disclosures and compliance guidelines.
- **Component Specific READMEs**:
  - **[Root README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/root_README.md)**
  - **[Backend README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/backend_README.md)**
  - **[Frontend README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/frontend_README.md)**
  - **[Mobile README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/mobile_README.md)**
