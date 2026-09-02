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
        Cache[(Redis - Session Cache + AI Counters)]
        DB[(MongoDB - Auth + Usage Data)]
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
   - **AI Usage Dashboard**: Displays real-time token usage, request counts, and quota status per user.
2. **Mobile App (`CoActMobile`)**:
   - Built with **React Native (CLI)**.
   - Leverages native device APIs for audio recording (`react-native-audio-recorder-player`) and PDF rendering (`react-native-pdf`).
   - Connects directly to the backend IP/Port.
3. **Backend API Server (`inter-ai-backend`)**:
   - Built with **Python (FastAPI)**.
   - **Production Hardened**: Runs as a non-root user via Docker, configured with Gunicorn worker scaling, strict CORS, HSTS security headers, and global unhandled exception masking.
   - **Authentication**: JWT-based session security via custom tokens.
   - **Rate Limiting**: Token-based rate limiting with per-user quotas (requests/minute, hourly tokens, daily tokens).
   - **AI Usage Tracking**: Redis-backed counters with DB fallback, atomic operations across workers, automatic TTL expiry.
   - **Caching**: Unified Cache supporting Redis for session state management, with local TTLCache fallback.
   - **Database**: MongoDB for production data persistence, with SQLite fallback for local development.
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
- **Database**: MongoDB (local container for dev, Atlas/Railway for production).
- **Cache + AI Counters**: Redis (local container for dev, Railway plugin for production).

### Environment Files Setup
From the project root, duplicate the `.env.example` file to create your `.env` file:
```bash
copy .env.example .env
```

Ensure the following critical variables are set in your `.env` for the cloud API architecture:
```env
GROQ_API_KEY=gsk_your_groq_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
MONGODB_URI=mongodb://admin:your_secure_db_password@mongodb:27017/coact?authSource=admin
JWT_SECRET=your_secure_64_character_hex_string
REDIS_URL=redis://redis:6379/0
```

### AI Usage Rate Limits
Configure per-user quotas (defaults shown):
```env
RATE_LIMIT_REQUESTS_PER_MINUTE=30
RATE_LIMIT_INPUT_TOKENS_PER_HOUR=50000
RATE_LIMIT_OUTPUT_TOKENS_PER_HOUR=20000
RATE_LIMIT_DAILY_TOKENS=200000
```

---

## 3. How to Run Locally & In Production

The entire stack is containerized using Docker, allowing you to easily spin up the frontend, backend, database, and all AI models simultaneously.

### Prerequisites
- **Docker & Docker Compose** installed.

### Starting the Full Stack
To spin up the entire application (including the secured MongoDB, Redis, FastAPI backend, and React frontend), simply run:

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

### Deploying to Railway

Railway is the recommended production host. The repo includes Railway-specific configs:

| Service | Root Directory | Dockerfile |
|---|---|---|
| Backend | `inter-ai-backend` | `Dockerfile` (auto-detected) |
| Frontend | `inter-ai-frontend` | `Dockerfile.railway` |

**Quick setup:**
1. Create a Railway project from your GitHub repo.
2. Add Backend (Web Service, root `inter-ai-backend`).
3. Add Frontend (Web Service, root `inter-ai-frontend`).
4. Add **Redis** plugin → set `REDIS_URL=${{Redis.REDIS_URL}}` on backend.
5. Add **MongoDB** plugin → set `MONGODB_URI` on backend.
6. Set `VITE_API_URL` on frontend to the backend's public URL.
7. Set `CORS_ORIGINS` on backend to the frontend's public URL.

See **[Docs/RAILWAY_DEPLOY.md](Docs/RAILWAY_DEPLOY.md)** for the full step-by-step guide.

---

#### Start the Mobile Client
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

## 4. AI Usage & Rate Limiting

Every authenticated AI request (chat, transcription, session start, report generation) is metered per user with configurable quotas enforced server-side.

### Default Limits

| Scope | Limit | Window |
|---|---|---|
| Requests | 30 | per minute per user |
| Input tokens | 50,000 | per hour per user |
| Output tokens | 20,000 | per hour per user |
| Daily tokens | 200,000 | per day per user |

### How It Works

1. Authenticated request → identify user
2. Check request rate limit + token quota (Redis atomic counters, Mongo fallback)
3. If within quota → call AI/LLM
4. Receive actual token usage from provider
5. Record usage → update counters
6. Return response
7. Frontend refreshes usage display

### 429 Response

When a limit is exceeded, the API returns HTTP 429:

```json
{
  "error": "rate_limit_exceeded",
  "message": "AI usage limit exceeded.",
  "limit_type": "daily_tokens",
  "limit": 200000,
  "used": 200000,
  "remaining": 0,
  "retry_after": 3600
}
```

### Usage API

```
GET /api/usage
```

Returns the current user's usage snapshot with requests, hourly input/output tokens, and daily totals — each with limit, used, remaining, and reset_at.

### Frontend

- **AI Usage Card** on Dashboard and Practice pages shows real-time quota status.
- Warning levels: normal (0–69%), warning (70–84%), high (85–94%), critical (95–99%), blocked (100%).
- 429 errors are caught and displayed on a dedicated LimitReached page with quota details and retry timer.

---

## 5. Product Interface Preview

Here is a preview of the CoAct.AI dashboard interface and brand theme mockup:

<p align="center">
  <img src="images/first/image.png" alt="CoAct.AI Interface Preview" width="800"/>
</p>

<p align="center">
  <img src="images/second/image%20copy.png" alt="CoAct.AI Interface Preview" width="800"/>
</p>

---

## 6. Documentation Index

Additional detailed guides are located in the **[Docs](Docs)** folder:

- **[Environment Setup Guide](Docs/ENV_SETUP.md)** — In-depth guide to obtaining Groq, Sarvam, and MongoDB keys and configuring `.env` files.
- **[Railway Deployment Guide](Docs/RAILWAY_DEPLOY.md)** — Step-by-step production deployment on Railway with Redis + MongoDB plugins.
- **[Production Server Deployment Guide](Docs/DEPLOYMENT.md)** — Step-by-step production deployment using Docker & Nginx.
- **[Mobile Integration Blueprint](Docs/MOBILE_REACT_NATIVE_BLUEPRINT.md)** — Detailed specification for the React Native implementation.
- **[SSL Certificate Configuration](Docs/SSL_SETUP.md)** — How to set up HTTPS and Let's Encrypt certificates.
- **[Security Policy](Docs/SECURITY.md)** — Security disclosures and compliance guidelines.
- **Component Specific READMEs**:
  - **[Root README](Docs/root_README.md)**
  - **[Backend README](Docs/backend_README.md)**
  - **[Frontend README](Docs/frontend_README.md)**
  - **[Mobile README](Docs/mobile_README.md)**

---

## 7. Testing

### Backend
```bash
./.venv/bin/pytest -q          # Run all tests (currently 39)
./.venv/bin/ruff check inter-ai-backend   # Lint
```

### Frontend
```bash
cd inter-ai-frontend
npm run build                  # tsc + vite build
npx tsc --noEmit               # Type check only
```

### Full Verification
```bash
docker compose up -d --build   # Rebuild and deploy
docker compose exec -T backend sh -c 'curl -s http://localhost:8000/api/health'  # Health check
```