/**
 * useAudioRecorder — Custom hook for recording audio using react-native-audio-recorder-player.
 * Records audio, uploads to /api/transcribe, returns text.
 */
import { useState, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import { api } from '../lib/api';
import { useSessionStore } from '../stores/useSessionStore';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (onMeterChange?: (db: number) => void) => Promise<void>;
  stopRecording: () => Promise<void>;
  stopAndTranscribe: (sessionId?: string) => Promise<string>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const audioRecorderPlayer = useRef(new (AudioRecorderPlayer as any)()).current;
  const currentPath = useRef<string>('');
  const { authSession } = useSessionStore();

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        // On Android 13+, WRITE/READ_EXTERNAL_STORAGE return denied. 
        // We only strictly require RECORD_AUDIO.
        if (grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions handled by the system automatically based on Info.plist
  };

  const startRecording = useCallback(async (onMeterChange?: (db: number) => void) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Pass undefined to let the library use the app's cache directory
      // This avoids needing WRITE_EXTERNAL_STORAGE permission
      const path = undefined;

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'aac' as any,
      };

      audioRecorderPlayer.setSubscriptionDuration(0.1);

      // Third parameter 'true' enables metering
      const uri = await audioRecorderPlayer.startRecorder(path, audioSet, true);
      
      if (onMeterChange) {
        audioRecorderPlayer.addRecordBackListener((e: any) => {
          onMeterChange(e.currentMetering);
        });
      }

      currentPath.current = uri;
      setIsRecording(true);
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error);
      throw error;
    }
  }, [audioRecorderPlayer]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
    } catch (error) {
      console.error('[AudioRecorder] Failed to stop recording:', error);
      setIsRecording(false);
    }
  }, [isRecording, audioRecorderPlayer]);

  const stopAndTranscribe = useCallback(async (sessionId?: string): Promise<string> => {
    if (!isRecording) return '';

    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);

      const uri = currentPath.current;
      if (!uri) {
        console.error('[AudioRecorder] No recording URI available');
        return '';
      }

      // Convert uri to a format suitable for fetch (e.g. file:// on Android)
      const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') ? `file://${uri}` : uri;

      // Upload to backend for transcription
      const token = authSession?.access_token || null;
      const result = await api.transcribeAudio(fileUri, sessionId, token);
      return result.text?.trim() || '';
    } catch (error) {
      console.error('[AudioRecorder] Transcription failed:', error);
      setIsRecording(false);
      return '';
    }
  }, [isRecording, authSession, audioRecorderPlayer]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    stopAndTranscribe,
  };
}
