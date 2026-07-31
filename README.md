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

    subgraph Cloud AI Engine [API Based Services]
        GroqSTT[Groq Whisper API STT]
        GroqLLM[Groq API LLM]
        TTS[Sarvam AI TTS]
    end

    Web <-->|HTTP / WebSockets / Proxy| API
    Mobile <-->|HTTP / JSON / Multi-part| API
    
    API <--> Cache
    API <--> DB
    
    API <-->|Audio Transcription| GroqSTT
    API <-->|Reasoning & Live Chat| GroqLLM
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
   - **Production Hardened**: Runs as a non-root user via Docker, configured with Gunicorn worker scaling, strict CORS, HSTS security headers, and global unhandled exception masking.
   - **Authentication**: JWT-based session security via custom tokens.
   - **Rate Limiting**: Custom Token Bucket Rate Limiter to prevent API abuse.
   - **Caching**: Unified Cache supporting local in-memory TTLCache and Redis for session state management.
   - **Database**: Local MongoDB container for dev, MongoDB Atlas for production data persistence.
4. **AI Processing Layer (API Based Architecture)**:
   - **Speech-to-Text (STT)**: Uses `Groq Whisper API` for fast streaming transcription.
   - **Reasoning & Live Chat**: Uses `Groq API` for blazing fast text generation.
   - **Text-to-Speech (TTS)**: Uses `Sarvam AI` API for high-speed streaming voice audio.
   - **Report Generation**: Employs parallel threaded processing to evaluate transcripts across multiple criteria (EQ, STAR, GROW) simultaneously, generating a secure PDF report via Groq.

---

## 2. Environment Configuration

The application is configured to use blazing fast Cloud API providers for its core AI functionality.

### Core Architecture Components
- **Unified LLM**: Powered by `Groq API` running `Llama-3.3-70b-versatile`.
- **Speech-to-Text**: Powered by `Groq Whisper API`.
- **Database**: Local `MongoDB` container (authenticated).

### Environment Files Setup
From the project root, duplicate the `.env.example` file to create your `.env` file:
```bash
copy .env.example .env
```

Ensure the following critical variables are set in your `.env` for the cloud API architecture:
```env
GROQ_API_KEY=gsk_your_groq_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
MONGODB_URI=mongodb://admin:coact_secure_db_pass_2026@mongodb:27017/coact?authSource=admin
JWT_SECRET=your_secure_64_character_hex_string
```

---

## 3. How to Run Locally & In Production

The entire stack is containerized using Docker, allowing you to easily spin up the frontend, backend, database, and all AI models simultaneously.

### Prerequisites
- **Docker & Docker Compose** installed.

### Starting the Full Stack
To spin up the entire application (including the secured MongoDB, FastAPI backend, and React frontend), simply run:

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

- **[Detailed Environment Setup Guide](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/ENV_SETUP.md)** — In-depth guide to obtaining Groq, OpenAI, and MongoDB keys and configuring `.env` files.
- **[Production Server Deployment Guide](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/DEPLOYMENT.md)** — Step-by-step production deployment using Docker & Nginx.
- **[Mobile Integration Blueprint](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/MOBILE_REACT_NATIVE_BLUEPRINT.md)** — Detailed specification for the React Native implementation.
- **[SSL Certificate Configuration](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/SSL_SETUP.md)** — How to set up HTTPS and Let's Encrypt certificates.
- **[Security Policy](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/SECURITY.md)** — Security disclosures and compliance guidelines.
- **Component Specific READMEs**:
  - **[Root README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/root_README.md)**
  - **[Backend README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/backend_README.md)**
  - **[Frontend README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/frontend_README.md)**
  - **[Mobile README](file:///d:/GH%20INDUCTION/COACT%20PROJECT/Docs/mobile_README.md)**
