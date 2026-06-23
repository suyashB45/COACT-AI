# CoAct AI - Recent System Optimizations & Fixes

This document summarizes the recent architectural optimizations, bug fixes, and feature additions made to the platform to improve stability, lower latency, and enhance the AI's intelligence.

## 🚀 Performance & Architecture Optimizations

### 1. Unified vLLM Serving Architecture
- **Issue:** Running two separate vLLM containers (`vllm` and `vllm-chat`) split the GPU VRAM in half, starving the KV cache and causing higher latency.
- **Fix:** Deleted the redundant `vllm-chat` container in `docker-compose.yml` and routed all backend LLM requests to a single, unified `vllm` container. 
- **Impact:** The single vLLM instance now utilizes 85% of the VRAM, allowing for a massive KV cache that increases continuous batching throughput and significantly lowers latency.

### 2. Chunked Prefill Enabled
- **Issue:** Generating large reports blocked the GPU, causing the live chat to freeze or lag during processing.
- **Fix:** Added the `--enable-chunked-prefill` flag to the unified vLLM service.
- **Impact:** Massive report prompts are now processed in smaller chunks, allowing live chat messages to "skip the line." Chat latency remains near-zero even while heavy background tasks run.

### 3. Parallelized Report Generation
- **Issue:** Report generation took too long because the LLM was asked to generate the entire massive JSON report sequentially.
- **Fix:** Refactored `cli_report.py` to use `concurrent.futures.ThreadPoolExecutor`. The three heavy analysis tasks (`generate_report_scores`, `analyze_questions`, and `assess_character`) are now executed simultaneously in parallel.
- **Impact:** Report generation speed increased dramatically (up to 3x faster).

### 4. AI Intelligence Upgrade
- **Issue:** The live chat character was previously running on a tiny 1.5B model, which struggled with complex scenarios.
- **Fix:** Upgraded the chat environment to use the full `Qwen2.5-7B-Instruct` model, which fits perfectly within the newly unified VRAM pool.

## 🐛 Bug Fixes

### 1. Fixed "Out of Track" AI (Temperature Fix)
- **Issue:** The chat AI was hallucinating, repeating itself, or sounding completely robotic.
- **Fix:** Discovered that the LLM temperature was hardcoded to `0.1` for *both* strict reports and creative chats. Updated `setup_langchain_model` in `cli_report.py` to use a creative temperature of `0.7` for live chat and `0.1` for objective reporting.

### 2. Fixed PDF Report Save Crash
- **Issue:** The backend crashed right at the end of a session with a `PermissionError: [Errno 13] Permission denied: '/app/../reports'`.
- **Fix:** Fixed the directory path logic in `app.py`'s `ensure_reports_dir()` function to correctly target the mounted `/app/reports` volume instead of the root directory.

### 3. Fixed Backend HTTP/2 Startup Crash
- **Issue:** The backend container failed to boot with an `ImportError` regarding the `h2` package.
- **Fix:** Added `httpx[http2]>=0.27.0` to `requirements.txt` to satisfy the `http2=True` requirement in the backend API client.

## ✨ UI Improvements

### 1. Scenario Descriptions on Practice Cards
- **Issue:** Users had to click and expand "Scenario Details" to know what a practice scenario was about.
- **Fix:** Updated `Practice.tsx` to dynamically render the short scenario description directly beneath the title on every practice card for better user experience.
