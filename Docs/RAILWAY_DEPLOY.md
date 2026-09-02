# Railway Deployment Guide

Deploy the CoAct.AI platform to **Railway** as a monorepo project with two web services (frontend + backend) and a Redis database.

## Architecture on Railway

| Piece | Type | Source | Port | Notes |
| --- | --- | --- | --- | --- |
| Backend | Web Service | `inter-ai-backend/` (`Dockerfile`) | `$PORT` (injected) | FastAPI + Gunicorn (2 workers), binds `0.0.0.0:$PORT` |
| Frontend | Web Service | `inter-ai-frontend/` (`Dockerfile.railway` via `railway.json`) | `$PORT` (default 3000) | Serves the built SPA with Node/Express (`server.js`) |
| Redis | Connection | Railway **Redis** plugin | internal | Session cache + AI usage counters (recommended) |
| MongoDB | Database | Railway **MongoDB** plugin | internal | Primary data store, reached over Railway's private network |

> Railway terminates TLS at its edge and forwards to `PORT`. No nginx/Certbot are used here —
> those are only for the docker-compose deployment.

## 1. Create the project and services

1. Create a Railway project and link the GitHub repo containing this code.
2. Add **Backend** — a Web Service with:
   - **Root Directory**: `inter-ai-backend`
   - Dockerfile auto-detected at that root.
3. Add **Frontend** — a Web Service with:
   - **Root Directory**: `inter-ai-frontend`
   - The `railway.json` in that folder selects `Dockerfile.railway`.
   - If Railway does not pick it up, set the service variable `RAILWAY_DOCKERFILE_PATH=Dockerfile.railway`.
4. Add the **Redis** plugin (project → New → Database → Redis). On the backend service's Variables
   tab, add:

   ```
   REDIS_URL=${{Redis.REDIS_URL}}
   ```

   Railway resolves `${{Redis.REDIS_URL}}` to the internal connection string (e.g.
   `redis://default:****@stunnel.railway.internal:6379`). This is **strongly recommended** — without
   it the backend falls back to per-worker in-memory cache (sessions can drop across restarts) and
   Mongo-only AI counters (slower). With Redis, AI usage counters and session cache are shared
   atomically across all workers.
5. Add the **MongoDB** plugin (project → New → Database → MongoDB). On the backend service, set
   `MONGODB_URI` to the plugin's connection string (available in the plugin's Variables tab) — it
   resolves to a `<name>.railway.internal` host reachable only inside your Railway project.

### Optional: pure CLI equivalent

```bash
railway login
railway init
# Backend
railway service add-webservice --name backend
# Frontend
railway service add-webservice --name frontend
```
`rootDirectory` and the config path are only settable from the Dashboard (or GraphQL), so the
steps above still require a few clicks in the UI.

## 2. Environment variables — Backend service

Set these on the **backend** service:

| Variable | Value / example | Required |
| --- | --- | --- |
| `PORT` | auto-set by Railway | auto |
| `MONGODB_URI` | Railway **MongoDB** plugin connection string, e.g. `mongodb://<user>:<pw>@<..>.mongo.railway.internal:27017/coact?authSource=admin`. Keep the database path `/coact` (the app default; existing data lives there). TLS is optional — Railway template URIs are usually plaintext over the private network; if the string contains `ssl=true`/`tls=true`, TLS is applied automatically. | ✅ critical |
| `GROQ_API_KEY` | your Groq key | ✅ |
| `SARVAM_API_KEY` | your Sarvam key | ✅ |
| `JWT_SECRET` | a long random string (stable across deploys) | ✅ |
| `CORS_ORIGINS` | include the **frontend** URL, e.g. `https://<frontend>.up.railway.app` | ✅ |
| `REDIS_URL` | Redis plugin internal URL, e.g. `redis://default:****@...stunnel.railway.internal:6379` | recommended |
| `REPORT_MODEL` | `llama-3.3-70b-versatile` (default) | optional |
| `CHAT_MODEL` | `llama-3.1-8b-instant` (default) | optional |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3-turbo` (default) | optional |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | e-mail auth/verification | optional |
| `LANGSMITH_TRACING` / `LANGSMITH_ENDPOINT` / `LANGSMITH_API_KEY` / `LANGSMITH_PROJECT` | monitoring | optional |
| `RATE_LIMIT_REQUESTSPER_MINUTE` | `30` | optional (default) |
| `RATE_LIMIT_INPUT_TOKENS_PER_HOUR` | `50000` | optional (default) |
| `RATE_LIMIT_OUTPUT_TOKENS_PER_HOUR` | `20000` | optional (default) |
| `RATE_LIMIT_DAILY_TOKENS` | `200000` | optional (default) |

## 3. Environment variables — Frontend service

| Variable | Value / example | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `https://<backend>.up.railway.app` | **Build-time**. Matches the `ARG VITE_API_URL` in `Dockerfile.railway`. Set it as a service variable; the build fails if it is missing. |

The SPA calls the backend API cross-origin using this URL — hence the backend `CORS_ORIGINS`
must contain the frontend's public URL.

## 4. Public networking

- Enable **Public Networking** on the backend service (default port `$PORT`). Note the generated
  domain — that is what goes into `VITE_API_URL`.
- Enable **Public Networking** on the frontend service (default port 3000). Map it to a custom
  domain (e.g. `railway.coact-ai.com`) or keep the default `*.up.railway.app`.

## 5. Verify the deployment

| Check | How | Expected |
| --- | --- | --- |
| Backend health | `curl https://<backend>.up.railway.app/api/health` | `200` |
| Frontend health | `curl https://<frontend>.up.railway.app/health` | `{"status":"healthy"}` |
| SPA served | open the frontend URL | the CoAct.AI dashboard renders |
| API reachable | sign up / start a session from the frontend | no CORS errors in the browser console |
| Redis enabled | backend logs | `Connected to Redis for session cache: ...` |

## 6. Critical caveats

- **MongoDB is mandatory.** If `MONGODB_URI` is missing/unreachable the app silently falls back
  to a SQLite file on Railway's **ephemeral** disk — every restart/deploy erases all data. The
  Railway Mongo plugin string is only reachable from other Railway services (private network), and
  TLS is used only if the URI carries `ssl=true`/`tls=true` (plaintext is fine inside the private
  network; `database.py` auto-detects both). After deploy, confirm the backend log shows
  `Connected to MongoDB database: ...` and **no** `Operating with SQLite local database fallback`
  warning.
- **Migration from Atlas (optional)**: if you previously ran on MongoDB Atlas, point the Railway
  Mongo URI's database at the same database name and copy the collections over (e.g. with
  `mongodump`/`mongorestore` or `mongoexport`/`mongoimport`) before switching traffic.
- **Redis**: with 2 Gunicorn workers, session state and the AI-usage counters are shared only if
  `REDIS_URL` is set. Without Redis, set `--workers 1` in the backend start command to keep
  sessions/streams consistent inside one worker (counters still work via Mongo, atomically).
- **No volumes needed.** Report PDFs stream inline as downloads and audio is buffered → sent to
  Groq inline. No attachable volumes are required.
- **Rate limiting**: the token limits are enforced per authenticated user and are safe under
  2 workers because the counters are atomic in Redis (or Mongo fallback).

## Troubleshooting

- **CORS errors in the browser**: add the exact frontend origin (scheme + host) to the backend's
  `CORS_ORIGINS`, then redeploy the backend.
- **`401` on everything**: `JWT_SECRET` differs between deploys — set it as a fixed variable.
- **Frontend build fails**: `VITE_API_URL` build arg is missing — add it to the frontend service
  variables and redeploy.
- **Data missing after redeploy**: the backend is using SQLite fallback. Fix `MONGODB_URI` (Railway
  Mongo plugin string; remember it is private-network-only and the database path should be `/coact`).
- **Mongo connection refused → `ENOTFOUND ...railway.internal`**: Railway's private networking DNS
  occasionally fails for some projects. Workaround: reference the plugin's **TCP proxy** endpoint
  (`RAILWAY_TCP_PROXY_DOMAIN` + `RAILWAY_TCP_PROXY_PORT`, resolved from the plugin's Variables tab)
  in `MONGODB_URI` — it is a public endpoint, so expect egress charges. Keep the database path
  `/coact` and `?authSource=admin`.
- **Intermittent "session not found"**: no `REDIS_URL` and 2 workers → add Redis or use 1 worker.