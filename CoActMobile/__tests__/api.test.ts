/**
 * API client tests.
 * Mocks global fetch to verify the api client hits the correct backend endpoints,
 * sends the right payloads / Bearer headers, maps responses, and surfaces errors.
 */
import { api, getApiUrl, API_BASE_URL } from '../src/lib/api';

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (globalThis as { fetch: unknown }).fetch = mockFetch;
});

const okResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body } as unknown as Response);

const errResponse = (status: number, body: unknown) =>
  ({
    ok: false,
    status,
    json: async () => body,
  } as unknown as Response);

describe('getApiUrl', () => {
  it('normalises the base URL and appends the endpoint', () => {
    expect(getApiUrl('/api/health')).toBe(`${API_BASE_URL}/api/health`);
    expect(getApiUrl('api/health')).toBe(`${API_BASE_URL}/api/health`);
  });
});

describe('auth endpoints', () => {
  it('login posts credentials and returns auth response', async () => {
    const auth = { access_token: 'tok', token_type: 'bearer', user: { id: '1', email: 'a@b.c' } };
    mockFetch.mockResolvedValue(okResponse(auth));

    const res = await api.login({ email: 'a@b.c', password: 'secret' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.c', password: 'secret' }),
      })
    );
    expect(res).toEqual(auth);
  });

  it('register posts credentials and returns auth response', async () => {
    const auth = { access_token: 'tok', token_type: 'bearer', user: { id: '2', email: 'c@d.e' } };
    mockFetch.mockResolvedValue(okResponse(auth));

    const res = await api.register({ email: 'c@d.e', password: 'pw' });

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/register`,
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.access_token).toBe('tok');
  });
});

describe('session endpoints', () => {
  it('startSession posts config including simulation_id and maps ai_intro from summary', async () => {
    mockFetch.mockResolvedValue(
      okResponse({ session_id: 's-1', summary: 'Welcome', session_mode: 'skill_assessment' })
    );

    const res = await api.startSession(
      { role: 'Store Manager', ai_role: 'Sales Associate', scenario: 'ctx', simulation_id: 'SIM-01-PERF-001', mode: 'evaluation', title: 'T' },
      'tok1'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/session/start`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer tok1' }),
      })
    );
    expect(res.session_id).toBe('s-1');
    expect(res.ai_intro).toBe('Welcome');
  });

  it('chatSession posts message and audio_url', async () => {
    mockFetch.mockResolvedValue(okResponse({ follow_up: 'Tell me more' }));

    const res = await api.chatSession('s-1', 'hello', null, 'tok2');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/session/s-1/chat`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'hello', audio_url: null }),
        headers: expect.objectContaining({ Authorization: 'Bearer tok2' }),
      })
    );
    expect(res.follow_up).toBe('Tell me more');
  });

  it('completeSession posts to the complete endpoint', async () => {
    mockFetch.mockResolvedValue(okResponse({ message: 'started', status: 'generating' }));

    await api.completeSession('s-1');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/session/s-1/complete`,
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('data endpoints', () => {
  it('getHistory returns a session list', async () => {
    const items = [{ session_id: 's-1', scenario: 'x', role: 'r', ai_role: 'a' }];
    mockFetch.mockResolvedValue(okResponse(items));

    const res = await api.getHistory('tok');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/history`,
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    );
    expect(res).toEqual(items);
  });

  it('getUserSessions returns the sessions wrapper', async () => {
    mockFetch.mockResolvedValue(okResponse({ sessions: [{ session_id: 's-1' }] }));

    const res = await api.getUserSessions('tok');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/user/sessions`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(res.sessions).toHaveLength(1);
  });

  it('getReportData hits the report_data endpoint', async () => {
    mockFetch.mockResolvedValue(okResponse({ meta: { overall_grade: '7/10' } }));

    const res = await api.getReportData('s-1', 'tok');

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/session/s-1/report_data`,
      expect.objectContaining({ method: 'GET' })
    );
    expect((res as any).meta.overall_grade).toBe('7/10');
  });

  it('getReportUrl returns the report PDF url', () => {
    expect(api.getReportUrl('s-1')).toBe(`${API_BASE_URL}/api/report/s-1`);
  });
});

describe('transcribeAudio', () => {
  it('uploads the audio file and returns transcribed text', async () => {
    mockFetch.mockResolvedValue(okResponse({ text: '  heard you  ' }));

    const res = await api.transcribeAudio('file:///tmp/a.m4a', 's-1', 'tok');

    const [url, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/api/transcribe`);
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(res.text).toBe('  heard you  ');
  });
});

describe('error handling', () => {
  it('throws a readable error with the backend detail', async () => {
    mockFetch.mockResolvedValue(errResponse(401, { detail: 'Incorrect email or password' }));

    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow(
      'Incorrect email or password'
    );
  });

  it('throws a readable error with the backend error field', async () => {
    mockFetch.mockResolvedValue(errResponse(429, { error: 'Monthly limit reached' }));

    await expect(api.completeSession('s-1')).rejects.toThrow('Monthly limit reached');
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(api.getHistory('tok')).rejects.toThrow('Request failed (500)');
  });
});
