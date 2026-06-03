/**
 * CoAct.AI Mobile — Global Session Store (Zustand)
 * Manages session flow, transcript, and UI states.
 */
import { create } from 'zustand';
export interface User {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}
export interface Session {
  access_token: string;
  user: User;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CharacterConfig {
  name: string;
  label: string;
  voice: string;
  color: string;
}

export interface SessionConfig {
  role: string;
  ai_role: string;
  scenario: string;
  difficulty?: string;
  framework?: string;
  ai_character?: string;
  multi_characters?: boolean;
  characters?: CharacterConfig[];
}

interface SessionState {
  // Auth
  user: User | null;
  authSession: Session | null;
  setAuth: (user: User | null, session: Session | null) => void;
  clearAuth: () => void;

  // Session
  sessionId: string | null;
  sessionConfig: SessionConfig | null;
  transcript: TranscriptMessage[];
  isRecording: boolean;
  isProcessing: boolean;
  isPlayingTTS: boolean;
  turnCount: number;
  elapsedSeconds: number;

  // Actions
  setSession: (id: string, config: SessionConfig) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setRecording: (isRecording: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setPlayingTTS: (isPlaying: boolean) => void;
  incrementTurn: () => void;
  setElapsed: (seconds: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  // Auth defaults
  user: null,
  authSession: null,
  setAuth: (user, authSession) => set({ user, authSession }),
  clearAuth: () => set({ user: null, authSession: null }),

  // Session defaults
  sessionId: null,
  sessionConfig: null,
  transcript: [],
  isRecording: false,
  isProcessing: false,
  isPlayingTTS: false,
  turnCount: 0,
  elapsedSeconds: 0,

  // Session actions
  setSession: (id, config) =>
    set({ sessionId: id, sessionConfig: config, transcript: [], turnCount: 0, elapsedSeconds: 0 }),

  addMessage: (role, content) =>
    set((state) => ({
      transcript: [...state.transcript, { role, content }],
    })),

  setRecording: (isRecording) => set({ isRecording }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setPlayingTTS: (isPlaying) => set({ isPlayingTTS: isPlaying }),
  incrementTurn: () => set((state) => ({ turnCount: state.turnCount + 1 })),
  setElapsed: (seconds) => set({ elapsedSeconds: seconds }),

  clearSession: () =>
    set({
      sessionId: null,
      sessionConfig: null,
      transcript: [],
      isRecording: false,
      isProcessing: false,
      isPlayingTTS: false,
      turnCount: 0,
      elapsedSeconds: 0,
    }),
}));
