/**
 * CoAct.AI Mobile — API Client
 * Talks to the FastAPI backend (CoAct backend). Auth is provided per-call
 * as a Bearer token (from useSessionStore's authSession.access_token).
 */
import { Platform } from 'react-native';

// Override at build/runtime by editing this constant or via a config file.
// Android emulator reaches the host machine via 10.0.2.2; iOS simulator via localhost.
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_PORT = 8000;

const formatBaseUrl = (value?: string): string => {
  if (!value) return '';
  let trimmed = value.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
};

export const API_BASE_URL = formatBaseUrl(
  `${DEFAULT_HOST}:${DEFAULT_PORT}`
);

export const getApiUrl = (endpoint: string): string => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

const JSON_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

const authHeaders = (token?: string | null): Record<string, string> => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const readError = async (response: Response): Promise<string> => {
  const data = await response.json().catch(() => null);
  return data?.detail || data?.error || `Request failed (${response.status})`;
};

// ─── Auth ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface Credentials {
  email: string;
  password: string;
}

// ─── Generic list item used by history / recent sessions ─
// Fields intentionally optional so both History and Dashboard consumers can use it.
// HistoryScreen expects `scenario`, `role`, `ai_role` to be present at runtime.

export interface SessionItem {
  session_id: string;
  date?: string;
  role: string;
  ai_role: string;
  title?: string;
  scenario: string;
  scenario_type?: string;
  session_mode?: string;
  completed?: boolean;
  score?: number;
  created_at?: string;
}

// ─── Session start / chat ────────────────────────────────

export interface StartSessionConfig {
  role: string;
  ai_role: string;
  scenario: string;
  scenario_type?: string;
  session_mode?: string;
  mode?: string;
  title?: string;
  ai_character?: string;
  simulation_id?: string;
  framework?: string;
}

interface StartSessionResponse {
  session_id: string;
  summary: string;
  ai_intro?: string;
  framework?: unknown;
  scenario_type?: string;
  session_mode?: string;
  ai_character?: string;
}

interface ChatResponse {
  follow_up: string;
  framework_detected?: unknown;
}

// ─── API surface used by screens/hooks ───────────────────

export const api = {
  async login(credentials: Credentials): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async register(credentials: Credentials): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async getHistory(token?: string | null): Promise<SessionItem[]> {
    const response = await fetch(getApiUrl('/api/history'), {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async getUserSessions(token?: string | null): Promise<{ sessions: SessionItem[] }> {
    const response = await fetch(getApiUrl('/api/user/sessions'), {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async startSession(config: StartSessionConfig, token?: string | null): Promise<StartSessionResponse> {
    const response = await fetch(getApiUrl('/api/session/start'), {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...authHeaders(token) },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = await response.json();
    return { ...data, ai_intro: data.ai_intro ?? data.summary };
  },

  async chatSession(
    sessionId: string,
    message: string,
    audioUrl: string | null,
    token?: string | null
  ): Promise<ChatResponse> {
    const response = await fetch(getApiUrl(`/api/session/${sessionId}/chat`), {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...authHeaders(token) },
      body: JSON.stringify({ message, audio_url: audioUrl }),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async transcribeAudio(uri: string, sessionId?: string, token?: string | null): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);

    const response = await fetch(getApiUrl('/api/transcribe'), {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async completeSession(sessionId: string, token?: string | null): Promise<Record<string, unknown>> {
    const response = await fetch(getApiUrl(`/api/session/${sessionId}/complete`), {
      method: 'POST',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async getAnalytics(token?: string | null): Promise<Record<string, unknown>> {
    const response = await fetch(getApiUrl('/api/analytics'), {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  async getReportData(sessionId: string, token?: string | null): Promise<Record<string, unknown>> {
    const response = await fetch(getApiUrl(`/api/session/${sessionId}/report_data`), {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  },

  getReportUrl(sessionId: string): string {
    return getApiUrl(`/api/report/${sessionId}`);
  },
};

export default api;
