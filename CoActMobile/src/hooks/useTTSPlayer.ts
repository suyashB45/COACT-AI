/**
 * useTTSPlayer — Custom hook for playing AI text-to-speech audio in bare React Native.
 * Fetches WAV from /api/speak, saves locally via react-native-fs, plays via react-native-sound.
 */
import { useState, useRef, useCallback } from 'react';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { getApiUrl } from '../lib/api';
import { useSessionStore } from '../stores/useSessionStore';

interface UseTTSPlayerReturn {
  isPlaying: boolean;
  playAISpeech: (text: string, voice?: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
}

// Enable playback in silence mode
Sound.setCategory('Playback');

export function useTTSPlayer(): UseTTSPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Sound | null>(null);
  const { authSession } = useSessionStore();

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAISpeech = useCallback(async (text: string, voice: string = 'fable') => {
    try {
      await stopPlayback();
      setIsPlaying(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authSession?.access_token) {
        headers['Authorization'] = `Bearer ${authSession.access_token}`;
      }

      const cachePath = `${RNFS.DocumentDirectoryPath}/tts_${Date.now()}.wav`;

      // Fetch the audio
      const response = await fetch(getApiUrl('/api/speak'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error(`TTS download failed: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Convert blob to base64 and write using RNFS
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            await RNFS.writeFile(cachePath, base64data, 'base64');
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
      });

      // Play the downloaded sound
      const sound = new Sound(cachePath, '', (error) => {
        if (error) {
          console.error('[TTS] Failed to load the sound', error);
          setIsPlaying(false);
          return;
        }

        soundRef.current = sound;
        
        sound.play((success) => {
          setIsPlaying(false);
          sound.release();
          soundRef.current = null;
          
          RNFS.unlink(cachePath).catch(() => {});
        });
      });

    } catch (error) {
      console.error('[TTS] Playback failed:', error);
      setIsPlaying(false);
      soundRef.current = null;
    }
  }, [authSession, stopPlayback]);

  return {
    isPlaying,
    playAISpeech,
    stopPlayback,
  };
}
