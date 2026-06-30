"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Square, ArrowLeft, Clock, User, History, X, Loader2, Video, VideoOff, Phone, Mic, MicOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getApiUrl, getAuthHeaders } from "@/lib/api"

interface TranscriptMessage {
    role: "user" | "assistant"
    content: string
}

interface SessionData {
    role: string
    ai_role: string
    scenario: string
    createdAt: string
    transcript: TranscriptMessage[]
    sessionId?: string
    ai_character?: string
    multi_characters?: boolean
    characters?: CharacterConfig[]
}

interface CharacterConfig {
    name: string
    label: string
    voice: string
    color: string
}

interface ConversationState {
    transcript: TranscriptMessage[]
    isRecording: boolean
    isProcessing: boolean
    turnCount: number
    sessionData: SessionData | null
    elapsedSeconds: number
    currentDraft: string
    interimText: string  // Real-time text preview while speaking
    showTranscript: boolean
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function Conversation() {
    const params = useParams()
    const navigate = useNavigate()
    const sessionId = params.sessionId as string
    const recognitionRef = useRef<any>(null)
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const sessionEndedRef = useRef(false)
    const ttsAbortRef = useRef<AbortController | null>(null)

    const [state, setState] = useState<ConversationState>({
        transcript: [],
        isRecording: false,
        isProcessing: false,
        turnCount: 0,
        sessionData: null,
        elapsedSeconds: 0,
        currentDraft: "",
        interimText: "",
        showTranscript: false,
    })
    const isProcessingRef = useRef(false)
    useEffect(() => {
        isProcessingRef.current = state.isProcessing
    }, [state.isProcessing])

    const [isAiSpeaking, setIsAiSpeaking] = useState(false)
    const isAiSpeakingRef = useRef(false)
    useEffect(() => {
        isAiSpeakingRef.current = isAiSpeaking
    }, [isAiSpeaking])

    const [showEndConfirm, setShowEndConfirm] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [multiCharacters, setMultiCharacters] = useState(false)
    const [characters, setCharacters] = useState<CharacterConfig[]>([])

    // Video call state
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [userStream, setUserStream] = useState<MediaStream | null>(null)
    const userVideoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (isVideoOn && userVideoRef.current && userStream) {
            userVideoRef.current.srcObject = userStream
        }
    }, [isVideoOn, userStream, userVideoRef.current])

    useEffect(() => {
        let mounted = true
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                if (mounted) {
                    setUserStream(stream)
                } else {
                    stream.getTracks().forEach(track => track.stop())
                }
            } catch (err) {
                console.error('Error accessing webcam:', err)
                if (mounted) setIsVideoOn(false)
            }
        }
        startVideo()
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        return () => {
            if (userStream) {
                 userStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [userStream])

    const toggleUserVideo = async () => {
        if (!isVideoOn) {
            try {
                let stream = userStream;
                if (!stream || !stream.active) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true })
                    setUserStream(stream)
                }
                setIsVideoOn(true)
            } catch (err) {
                console.error('Error accessing webcam:', err)
            }
        } else {
            if (userStream) {
                userStream.getTracks().forEach(track => track.stop())
                setUserStream(null)
            }
            setIsVideoOn(false)
        }
    }

    const stopVideo = useCallback(() => {
        if (userStream) {
            userStream.getTracks().forEach(track => track.stop());
            setUserStream(null);
        }
        setIsVideoOn(false);
    }, [userStream]);



    // Helper: Parse character-labeled lines from AI response
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const parseCharacterLines = (
        text: string,
        chars: CharacterConfig[] = characters,
        multi: boolean = multiCharacters
    ): { char: string; text: string; voice: string; color: string }[] => {
        if (!multi || !chars.length) return [{ char: '', text, voice: 'fable', color: 'blue' }]

        const lines = text.split('\n').filter(l => l.trim())
        const parsed: { char: string; text: string; voice: string; color: string }[] = []

        const names = chars.map(c => escapeRegExp(c.name)).join('|')
        const segmentRegex = new RegExp(`(?:\\[?(${names})\\]?:\\s*)([^]*?)(?=(?:\\[?(?:${names})\\]?:)|$)`, 'gi')

        for (const line of lines) {
            let lineProcessed = false
            let match: RegExpExecArray | null
            segmentRegex.lastIndex = 0

            // Detect one or more labeled segments within the same line
            while ((match = segmentRegex.exec(line)) !== null) {
                const charName = match[1]
                const textSegment = match[2].trim()
                const charConfig = chars.find(c => c.name.toLowerCase() === charName.toLowerCase())

                if (charConfig && textSegment) {
                    parsed.push({ char: charConfig.name, text: textSegment, voice: charConfig.voice, color: charConfig.color })
                    lineProcessed = true
                }
            }

            if (!lineProcessed && line.trim()) {
                // Keep old behavior: non-labeled lines append to last parsed part
                if (parsed.length > 0) {
                    parsed[parsed.length - 1].text += ' ' + line.trim()
                } else {
                    parsed.push({ char: chars[0].name || '', text: line.trim(), voice: chars[0].voice || 'fable', color: chars[0].color || 'blue' })
                }
            }
        }

        return parsed.length > 0 ? parsed : [{ char: '', text, voice: 'fable', color: 'blue' }]
    }

    // Scroll to bottom of transcript only if it's open
    useEffect(() => {
        if (state.showTranscript) {
            transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [state.transcript, state.currentDraft, state.showTranscript]);

    useEffect(() => {
        const timer = setInterval(() => {
            setState(prev => {
                const newSecs = prev.elapsedSeconds + 1
                // Show warning at 5 minutes (2 minutes remaining)
                if (newSecs === 300) {
                    setTimeout(() => toast.warning("2 Minutes Remaining", {
                        description: "This conversation is limited to 7 minutes. Please wrap up your thoughts.",
                        duration: 5000
                    }), 0)
                }
                return { ...prev, elapsedSeconds: newSecs }
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Second effect to auto-end session at 7 minutes
    useEffect(() => {
        if (state.elapsedSeconds >= 420 && !isEnding && !sessionEndedRef.current) {
            toast.error("Time Limit Reached", {
                description: "The 7-minute conversation limit has been reached."
            })
            handleEndConversation()
        }
    }, [state.elapsedSeconds, isEnding])

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])


    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Audio playback for AI response
    const aiAudioRef = useRef<HTMLAudioElement | null>(null)

    const speakText = async (text: string, forcedCharacter?: string, forceVoice?: string) => {
        // Don't start TTS if session has ended
        if (sessionEndedRef.current) {
            console.warn("[TTS] Skipped — session ended")
            return
        }

        try {
            // Determine voice: explicit override > character-based > default
            const voice = forceVoice || (forcedCharacter === 'sarah' || state.sessionData?.ai_character === 'sarah' ? 'nova' : 'fable')

            setIsAiSpeaking(true)

            // Abort any previous TTS request
            if (ttsAbortRef.current) ttsAbortRef.current.abort()
            const ttsController = new AbortController()
            ttsAbortRef.current = ttsController

            console.log("[TTS] Fetching audio...", { voice, textLen: text.length })
            const response = await fetch(getApiUrl('/api/speak'), {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({ text, voice }),
                signal: ttsController.signal
            })

            if (!response.ok) throw new Error(`TTS failed: ${response.status}`)

            // Don't play if session ended while fetching
            if (sessionEndedRef.current) {
                setIsAiSpeaking(false)
                return
            }

            const blob = await response.blob()
            console.log("[TTS] Audio received:", blob.size, "bytes, type:", blob.type)
            const url = URL.createObjectURL(blob)

            if (aiAudioRef.current) {
                aiAudioRef.current.pause()
                aiAudioRef.current = null
            }

            const audio = new Audio(url)
            aiAudioRef.current = audio

            // Wait for audio to finish playing before resolving
            // This ensures sequential playback in multi-character mode
            await new Promise<void>((resolve) => {
                audio.onended = () => {
                    setIsAiSpeaking(false)
                    URL.revokeObjectURL(url)
                    resolve()
                }

                audio.onerror = (e) => {
                    setIsAiSpeaking(false)
                    console.error("[TTS] Audio playback error:", e)
                    URL.revokeObjectURL(url)
                    resolve()
                }

                audio.play().catch((err) => {
                    setIsAiSpeaking(false)
                    console.error("[TTS] audio.play() rejected:", err)
                    URL.revokeObjectURL(url)
                    resolve()
                })
            })

        } catch (error) {
            console.error("TTS Error:", error)
            setIsAiSpeaking(false)
        }
    }

    // Speak multi-character text with different voices sequentially
    const speakMultiCharacter = async (text: string, chars: CharacterConfig[] = characters) => {
        if (sessionEndedRef.current) return
        const parts = parseCharacterLines(text, chars, true)
        
        setIsAiSpeaking(true)
        if (ttsAbortRef.current) ttsAbortRef.current.abort()
        const ttsController = new AbortController()
        ttsAbortRef.current = ttsController
        
        try {
            // Fire all TTS requests in parallel
            const audioUrlPromises = parts.map(async (part) => {
                const voice = part.voice || 'fable'
                const response = await fetch(getApiUrl('/api/speak'), {
                    method: 'POST',
                    headers: { ...getAuthHeaders() },
                    body: JSON.stringify({ text: part.text, voice }),
                    signal: ttsController.signal
                })
                if (!response.ok) throw new Error(`TTS failed`)
                const blob = await response.blob()
                return URL.createObjectURL(blob)
            })

            // Play them sequentially as they become ready
            for (let i = 0; i < parts.length; i++) {
                if (sessionEndedRef.current) break
                const url = await audioUrlPromises[i]
                
                await new Promise<void>((resolve) => {
                    if (sessionEndedRef.current) {
                        URL.revokeObjectURL(url)
                        return resolve()
                    }
                    
                    const audio = new Audio(url)
                    aiAudioRef.current = audio
                    
                    audio.onended = () => {
                        URL.revokeObjectURL(url)
                        resolve()
                    }
                    audio.onerror = () => {
                        URL.revokeObjectURL(url)
                        resolve()
                    }
                    audio.play().catch(err => {
                        console.error("Audio playback error:", err)
                        URL.revokeObjectURL(url)
                        resolve()
                    })
                })
            }
        } catch (e) {
            console.error("Multi TTS Error", e)
        } finally {
            setIsAiSpeaking(false)
        }
    }

    // Reset sessionEnded on mount, clean up on unmount
    useEffect(() => {
        sessionEndedRef.current = false
        return () => {
            sessionEndedRef.current = true
            if (ttsAbortRef.current) ttsAbortRef.current.abort()
            if (aiAudioRef.current) {
                aiAudioRef.current.pause()
                aiAudioRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        const storedData = localStorage.getItem(`session_${sessionId}`)
        if (storedData) {
            const sessionData: SessionData = JSON.parse(storedData)

            const initialTranscript = sessionData.transcript.length > 0
                ? sessionData.transcript
                : [{
                    role: "assistant",
                    content: `Thank you for joining this session — I'm glad you're here. Today we'll be working through a conversation where I'll play the role of ${sessionData.ai_role}, and you'll step into the role of ${sessionData.role}. Take your time, there's no pressure — this is your space to practice and grow. Whenever you're ready, go ahead and start.`
                }]

            setState((prev) => ({
                ...prev,
                sessionData,
                transcript: initialTranscript as TranscriptMessage[],
            }))

            // Set multi-character state
            if (sessionData.multi_characters && sessionData.characters) {
                setMultiCharacters(true)
                setCharacters(sessionData.characters)
            }

            // Speak initial message
            const latestMsg = initialTranscript[initialTranscript.length - 1]
            if (latestMsg.role === 'assistant' && initialTranscript.length === 1) {
                const timer = setTimeout(() => {
                    if (sessionData.multi_characters && sessionData.characters) {
                        speakMultiCharacter(latestMsg.content, sessionData.characters)
                    } else {
                        speakText(latestMsg.content, sessionData.ai_character)
                    }
                }, 500)
                return () => clearTimeout(timer)
            }
        }
    }, [sessionId])

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
            // Abort any pending API calls
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            // Stop user video if active
            if (userVideoRef.current && userVideoRef.current.srcObject) {
                const stream = userVideoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
            // Stop Live Mode
            stopLiveMode()
        }
    }, [])

    // ===== VAD State and Refs =====
    const [isLiveMode, setIsLiveMode] = useState(false)
    const [isUserSpeaking, setIsUserSpeaking] = useState(false)
    const liveRecordingActive = useRef(false)
    
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const vadStreamRef = useRef<MediaStream | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    const stopLiveMode = useCallback(() => {
        setIsLiveMode(false)
        setIsUserSpeaking(false)
        liveRecordingActive.current = false

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = null
            mediaRecorderRef.current.stop()
        }
        
        if (vadStreamRef.current) {
            vadStreamRef.current.getTracks().forEach(t => t.stop())
            vadStreamRef.current = null
        }
        
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        
        setState((prev) => ({ ...prev, isRecording: false }))
    }, [])

    // Global cleanup on unmount
    useEffect(() => {
        return () => {
            stopVideo();
            stopLiveMode();
        };
    }, [stopVideo, stopLiveMode]);

    const submitMessage = async (message: string, audioUrl: string | null) => {
        if (!message.trim()) return

        setState((prev) => ({
            ...prev,
            transcript: [...prev.transcript, { role: "user", content: message }],
            currentDraft: "",
            isProcessing: true,
        }))

        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            const controller = new AbortController()
            abortControllerRef.current = controller

            const authHeaders: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            const response = await fetch(getApiUrl(`/api/session/${sessionId}/chat?stream=true`), {
                method: 'POST',
                headers: { ...authHeaders, ...getAuthHeaders() },
                body: JSON.stringify({
                    message,
                    audio_url: audioUrl
                }),
                signal: controller.signal
            })


            if (!response.ok) {
                if (response.status === 429 || response.status === 403) {
                    let errorMsg = undefined
                    try {
                        const errorData = await response.json()
                        if (errorData.error) errorMsg = errorData.error
                    } catch (e) {}
                    
                    navigate('/limit-reached', { state: { message: errorMsg } })
                    return
                }
                throw new Error("Failed to get AI response")
            }

            if (!response.body) throw new Error("No response body")

            const reader = response.body.getReader()
            const decoder = new TextDecoder("utf-8")
            let done = false
            let rawAiResponse = ""
            let visibleAiResponse = ""
            let ttsCursor = 0
            
            const audioUrlQueue: string[] = []
            let isPlayingQueue = false
            
            const processAudioQueue = async () => {
                if (isPlayingQueue) return
                isPlayingQueue = true
                
                while (audioUrlQueue.length > 0) {
                    if (sessionEndedRef.current || abortControllerRef.current?.signal.aborted) break
                    const url = audioUrlQueue.shift()!
                    
                    await new Promise<void>((resolve) => {
                        setIsAiSpeaking(true)
                        const audio = new Audio(url)
                        aiAudioRef.current = audio
                        
                        audio.onended = () => {
                            URL.revokeObjectURL(url)
                            resolve()
                        }
                        audio.onerror = () => {
                            URL.revokeObjectURL(url)
                            resolve()
                        }
                        audio.play().catch(() => resolve())
                    })
                }
                setIsAiSpeaking(false)
                isPlayingQueue = false
            }
            
            // Add a temporary assistant message to the transcript that we will update
            setState((prev) => ({
                ...prev,
                transcript: [...prev.transcript, { role: "assistant", content: "" }]
            }))

            while (!done) {
                const { value, done: readerDone } = await reader.read()
                done = readerDone
                if (value) {
                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split("\n")
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6))
                                if (data.token) {
                                    rawAiResponse += data.token
                                    visibleAiResponse = rawAiResponse.replace(/\[THOUGHT\][\s\S]*?(?:\[\/THOUGHT\]|$)/g, "").replace(/<<[\s\S]*?(?:>>|$)/g, "").trimStart()
                                    
                                    // Update the last message in the transcript with the new token
                                    setState((prev) => {
                                        const newTranscript = [...prev.transcript]
                                        newTranscript[newTranscript.length - 1] = { role: "assistant", content: visibleAiResponse }
                                        return { ...prev, transcript: newTranscript }
                                    })
                                    
                                    if (!multiCharacters) {
                                        const unprocessed = visibleAiResponse.substring(ttsCursor)
                                        // Match up to the first end-of-sentence punctuation followed by a space
                                        const sentenceMatch = unprocessed.match(/^([\s\S]*?[.!?\n]+)(?=\s)/)
                                        if (sentenceMatch) {
                                            const sentence = sentenceMatch[1]
                                            ttsCursor += sentence.length
                                            
                                            if (sentence.trim().length > 0) {
                                                const voice = state.sessionData?.ai_character === 'sarah' ? 'nova' : 'fable'
                                                fetch(getApiUrl('/api/speak'), {
                                                    method: 'POST',
                                                    headers: { ...getAuthHeaders() },
                                                    body: JSON.stringify({ text: sentence.trim(), voice })
                                                }).then(res => res.ok ? res.blob() : null).then(blob => {
                                                    if (blob) {
                                                        audioUrlQueue.push(URL.createObjectURL(blob))
                                                        processAudioQueue()
                                                    }
                                                }).catch(err => console.error("Streaming TTS error", err))
                                            }
                                        }
                                    }
                                }
                                if (data.done) {
                                    visibleAiResponse = data.follow_up || visibleAiResponse
                                }
                                if (data.error) {
                                    console.error("Stream error:", data.error)
                                }
                            } catch (e) {
                                console.error("Error parsing SSE:", e, line)
                            }
                        }
                    }
                }
            }

            setState((prev) => ({
                ...prev,
                turnCount: prev.turnCount + 1,
                isProcessing: false,
            }))

            if (!multiCharacters) {
                // Speak any remaining text in the buffer
                const unprocessed = visibleAiResponse.substring(ttsCursor)
                if (unprocessed.trim().length > 0) {
                    const voice = state.sessionData?.ai_character === 'sarah' ? 'nova' : 'fable'
                    fetch(getApiUrl('/api/speak'), {
                        method: 'POST',
                        headers: { ...getAuthHeaders() },
                        body: JSON.stringify({ text: unprocessed.trim(), voice })
                    }).then(res => res.ok ? res.blob() : null).then(blob => {
                        if (blob) {
                            audioUrlQueue.push(URL.createObjectURL(blob))
                            processAudioQueue()
                        }
                    }).catch(err => console.error("Streaming TTS error", err))
                }
            } else {
                speakMultiCharacter(visibleAiResponse, characters)
            }

            if (state.sessionData) {
                const updated = {
                    ...state.sessionData,
                    transcript: [...state.sessionData.transcript,
                    { role: "user", content: message },
                    { role: "assistant", content: visibleAiResponse }
                    ]
                }
                localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated))
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return
            console.error("Conversation Error:", error)
            setState((prev) => ({ ...prev, isProcessing: false }))
            toast.error("Error", { description: "Something went wrong. Please try again." })
        }
    }



    const handleInterrupt = useCallback(() => {
        if (!isAiSpeakingRef.current && !isProcessingRef.current) return;

        console.log("Interrupting AI...");

        // 1. Abort TTS requests
        if (ttsAbortRef.current) {
            ttsAbortRef.current.abort();
        }

        // 2. Stop audio playback
        if (aiAudioRef.current) {
            aiAudioRef.current.pause();
            aiAudioRef.current.currentTime = 0;
            aiAudioRef.current = null;
        }
        setIsAiSpeaking(false);

        // 3. Abort chat completion request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        setState((prev) => ({ ...prev, isProcessing: false }));
    }, []);

    const startVADRecording = () => {
        if (liveRecordingActive.current || !vadStreamRef.current) return
        liveRecordingActive.current = true
        setState(prev => ({ ...prev, isRecording: true, interimText: "Listening..." }))

        audioChunksRef.current = []
        try {
            const mediaRecorder = new MediaRecorder(vadStreamRef.current)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            mediaRecorder.start(100) // Get chunks every 100ms
        } catch (e) {
            console.error("MediaRecorder start error:", e)
        }
    }

    const monitorVAD = () => {
        if (!analyserRef.current) return
        const analyser = analyserRef.current
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        
        const checkAudio = () => {
            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
            const average = sum / dataArray.length
            
            const THRESHOLD = 20 
            
            if (average > THRESHOLD) {
                if (isAiSpeakingRef.current || isProcessingRef.current) {
                    handleInterrupt()
                }

                if (!liveRecordingActive.current) {
                    setIsUserSpeaking(true)
                    startVADRecording()
                }
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
                
                silenceTimerRef.current = setTimeout(() => {
                    setIsUserSpeaking(false)
                    liveRecordingActive.current = false
                    setState(prev => ({ ...prev, isRecording: false, interimText: "Processing..." }))
                    
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                        mediaRecorderRef.current.onstop = async () => {
                            if (audioChunksRef.current.length === 0) {
                                setState(prev => ({ ...prev, interimText: "" }))
                                return
                            }
                            
                            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                            audioChunksRef.current = []
                            
                            const formData = new FormData()
                            formData.append("file", audioBlob, "audio.webm")
                            formData.append("session_id", sessionId)
                            
                            try {
                                const res = await fetch(getApiUrl('/api/transcribe'), {
                                    method: 'POST',
                                    body: formData
                                })
                                if (!res.ok) throw new Error("Transcription failed")
                                const data = await res.json()
                                
                                setState(prev => ({ ...prev, interimText: "" }))
                                if (data.text && data.text.trim().length > 0) {
                                    submitMessage(data.text, data.audio_url || null)
                                }
                            } catch (e) {
                                console.error("Transcription error:", e)
                                setState(prev => ({ ...prev, interimText: "" }))
                            }
                        }
                        mediaRecorderRef.current.stop()
                    } else {
                        setState(prev => ({ ...prev, interimText: "" }))
                    }
                }, 250) // 250ms silence triggers send (was 400ms — lower = faster response)
            }
            
            animationFrameRef.current = requestAnimationFrame(checkAudio)
        }
        
        checkAudio()
    }

    const toggleLiveMode = async () => {
        if (isLiveMode) {
            stopLiveMode()
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })
            vadStreamRef.current = stream

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioCtx = new AudioContextClass({ sampleRate: 16000 })
            
            // CRITICAL: Browsers suspend AudioContexts created without an active user gesture.
            // We must resume it explicitly to guarantee audio flows to the VAD and Worklet.
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume()
            }
            
            audioContextRef.current = audioCtx

            const source = audioCtx.createMediaStreamSource(stream)
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 512
            analyser.smoothingTimeConstant = 0.4
            source.connect(analyser)
            analyserRef.current = analyser
            


            setIsLiveMode(true)
            monitorVAD()

        } catch (error) {
            console.error("VAD Microphone error:", error)
            toast.error("Microphone Error", { description: "Unable to access microphone." })
        }
    }

    // Auto-start Live Mode on mount
    useEffect(() => {
        let mounted = true;
        const initLiveMode = async () => {
            if (!isLiveMode) {
                await toggleLiveMode();
            }
        };
        // Small delay to ensure refs and elements are ready
        const timer = setTimeout(() => {
            if (mounted) initLiveMode();
        }, 1000);
        return () => { 
            mounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleEndConversation = async () => {
        if (isEnding) return // Prevent double-clicks
        setIsEnding(true)

        // Mark session as ended to prevent any new TTS
        sessionEndedRef.current = true

        // Abort any in-flight TTS request
        if (ttsAbortRef.current) {
            ttsAbortRef.current.abort()
        }

        // Aggressively kill AI Speech
        if (aiAudioRef.current) {
            aiAudioRef.current.pause()
            aiAudioRef.current.currentTime = 0
            aiAudioRef.current = null
        }
        setIsAiSpeaking(false)

        // Aggressively kill network requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Aggressively kill microphone without triggering transcription
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null
        }
        stopLiveMode()
        
        // Aggressively kill camera
        stopVideo()

        try {
            // Call backend to complete session and generate report
            const completeRes = await fetch(getApiUrl(`/api/session/${sessionId}/complete`), {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({})
            })

            if (!completeRes.ok) {
                console.error(`[COMPLETE] Server returned ${completeRes.status}`)
            }

            // Update localStorage for offline reference
            if (state.sessionData) {
                const updated = {
                    ...state.sessionData,
                    completed: true
                }
                localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated))
            }

            // Backend handles report generation async. Navigate immediately.
            navigate(`/report/${sessionId}`)

        } catch (error) {
            console.error("Error completing session:", error)
            toast.error("Error", { description: "Failed to complete session. Navigating to report anyway." })
            setIsEnding(false)
            setShowEndConfirm(false)
            navigate(`/report/${sessionId}`) // Optional: still try to navigate if we want them to see partial data/error state
        }
    }

    // Get the latest message for captioning
    const lastMessage = state.transcript.length > 0 ? state.transcript[state.transcript.length - 1] : null

    return (
        <div className="h-screen bg-background relative overflow-hidden flex flex-col font-sans">

            {/* ===== DYNAMIC ISLAND (TOP BAR) ===== */}
            <header className="relative z-30 pt-6 sm:pt-8 flex justify-center w-full pointer-events-none">
                <div className="dynamic-island px-2 py-2 rounded-full flex items-center gap-2 pointer-events-auto max-w-full overflow-hidden mx-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/practice")}
                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 shrink-0 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    
                    <div className="flex items-center gap-3 px-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                            state.isRecording
                                ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                                : isAiSpeaking 
                                    ? 'bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]'
                                    : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        }`} />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="text-[11px] sm:text-xs font-semibold text-white/90 tracking-wide uppercase">
                                {multiCharacters 
                                    ? (characters.length > 0 ? characters.map(c => c.name).join(' & ') : 'Simulation')
                                    : (state.sessionData?.ai_character === 'sarah' ? 'Sarah' : 'Alex')}
                            </span>
                            <span className="text-[10px] sm:text-xs font-medium text-white/50 hidden sm:inline">
                                • {isAiSpeaking ? 'Speaking' : state.isRecording ? 'Listening' : state.isProcessing ? 'Thinking' : 'Connected'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    
                    <div className="flex items-center gap-1.5 px-3">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs text-white/70 font-mono tracking-wider">{formatTime(state.elapsedSeconds)}</span>
                    </div>
                </div>
            </header>

            {/* ===== MAIN AREA (SPLIT PANE) ===== */}
            <main className="flex-1 relative z-10 w-full p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden">
                {/* Left Panel(s): AI */}
                {multiCharacters && characters.length > 0 ? (
                    characters.map((char, index) => (
                        <div key={index} className="flex-1 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 relative shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
                            
                            <div className="relative flex items-center justify-center w-[min(12rem,40vh)] h-[min(12rem,40vh)] md:w-[min(16rem,50vh)] md:h-[min(16rem,50vh)] max-h-full">
                                <AnimatePresence>
                                    {isAiSpeaking && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <div className="ripple-ring" style={{ animationDelay: '0s' }}></div>
                                            <div className="ripple-ring" style={{ animationDelay: '0.6s' }}></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className={`w-full h-full rounded-full bg-primary flex items-center justify-center relative z-10 shadow-sm border border-border`}>
                                    <span className="text-5xl md:text-7xl font-black text-white shadow-sm">
                                        {char.name.charAt(0)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Status text */}
                            <div className="mt-4 sm:mt-8 flex items-center gap-2 sm:gap-3 bg-black/50 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/10 shadow-lg z-20 shrink-0">
                                {isUserSpeaking ? (
                                    <>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                                        <span className="text-xs sm:text-base font-semibold text-white/95">Listening...</span>
                                    </>
                                ) : isAiSpeaking ? (
                                    <>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                                        <span className="text-xs sm:text-base font-semibold text-white/95">Speaking...</span>
                                    </>
                                ) : state.isProcessing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/90 animate-spin" />
                                        <span className="text-xs sm:text-base font-semibold text-white/95">Thinking...</span>
                                    </>
                                ) : isLiveMode ? (
                                    <>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                                        <span className="text-xs sm:text-base font-semibold text-white/95">Live Mode On</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-500 shadow-[0_0_12px_rgba(107,114,128,0.8)]" />
                                        <span className="text-xs sm:text-base font-semibold text-white/50">Muted</span>
                                    </>
                                )}
                            </div>

                            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 text-center">
                                <span className="text-[10px] sm:text-xs font-semibold text-white/90">
                                    {char.name}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex-1 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-sm border border-white/10 relative shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
                        
                        <div className="relative flex items-center justify-center w-[min(12rem,40vh)] h-[min(12rem,40vh)] md:w-[min(16rem,50vh)] md:h-[min(16rem,50vh)] max-h-full">
                            <AnimatePresence>
                                {isAiSpeaking && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="ripple-ring" style={{ animationDelay: '0s' }}></div>
                                        <div className="ripple-ring" style={{ animationDelay: '0.6s' }}></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center relative z-10 shadow-sm border border-border">
                                <span className="text-5xl md:text-7xl font-black text-white shadow-sm">
                                    {state.sessionData?.ai_character === 'sarah' ? 'S' : 'A'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Status text */}
                        <div className="mt-4 sm:mt-8 flex items-center gap-2 sm:gap-3 bg-black/50 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/10 shadow-lg z-20 shrink-0">
                            {state.isRecording ? (
                                <>
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                                    <span className="text-xs sm:text-base font-semibold text-white/95">Listening...</span>
                                </>
                            ) : isAiSpeaking ? (
                                <>
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                                    <span className="text-xs sm:text-base font-semibold text-white/95">Speaking...</span>
                                </>
                            ) : state.isProcessing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/90 animate-spin" />
                                    <span className="text-xs sm:text-base font-semibold text-white/95">Thinking...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                                    <span className="text-xs sm:text-base font-semibold text-white/95">Connected</span>
                                </>
                            )}
                        </div>

                        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 text-center">
                            <span className="text-[10px] sm:text-xs font-semibold text-white/90">
                                {state.sessionData?.ai_character === 'sarah' ? 'Sarah' : 'Alex'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Right Panel: User */}
                <div className={`flex-1 rounded-3xl overflow-hidden bg-card backdrop-blur-sm border border-border relative shadow-sm transition-all duration-300 ${
                    isUserSpeaking ? 'ring-2 ring-primary border-primary' : ''
                }`}>
                    {isVideoOn ? (
                        <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center shadow-inner">
                                <User className="w-10 h-10 sm:w-14 sm:h-14 text-white/30" />
                            </div>
                        </div>
                    )}
                    
                    {isUserSpeaking && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
                        </div>
                    )}
                    
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-3 py-1.5 text-center">
                        <span className="text-xs font-semibold text-white/90">You</span>
                    </div>
                </div>
            </main>

            {/* ===== FLOATING SUBTITLES (Lower Third) ===== */}
            <div className="absolute bottom-[100px] sm:bottom-[120px] left-1/2 -translate-x-1/2 z-40 px-4 sm:px-8 w-full max-w-2xl mx-auto pointer-events-none">
                <AnimatePresence mode="wait">
                    {state.currentDraft ? (
                        <motion.div
                            key="draft"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full pointer-events-auto"
                        >
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Listening</span>
                                </div>
                                <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
                                    {state.currentDraft}
                                    <span className="inline-block w-1 h-4 bg-primary rounded-full animate-pulse ml-1.5 align-middle" />
                                </p>
                            </div>
                        </motion.div>
                    ) : lastMessage ? (
                        <motion.div
                            key="last-msg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide pointer-events-auto"
                        >
                            {lastMessage.role === 'assistant' && multiCharacters ? (
                                parseCharacterLines(lastMessage.content).map((part, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-lg relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${part.color === 'pink' ? 'bg-pink-500' : 'bg-purple-500'}`} />
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                part.color === 'pink' ? 'text-pink-400' : 'text-purple-400'
                                            }`}>{part.char}</span>
                                        </div>
                                        <p className="text-sm sm:text-base leading-relaxed text-white/95 font-medium">{part.text}</p>
                                    </div>
                                ))
                            ) : (
                                <div className={`bg-black/60 backdrop-blur-md border rounded-2xl px-4 py-3 shadow-lg relative overflow-hidden transition-colors duration-500 ${
                                    lastMessage.role === 'assistant' ? 'border-primary/30' : 'border-white/10'
                                }`}>
                                    {lastMessage.role === 'assistant' && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600 opacity-50" />
                                    )}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                            lastMessage.role === 'assistant' ? 'text-primary' : 'text-white/40'
                                        }`}>
                                            {lastMessage.role === 'assistant'
                                                ? (state.sessionData?.ai_character === 'sarah' ? 'Sarah' : 'Alex')
                                                : 'You'}
                                        </span>
                                    </div>
                                    <p className={`text-sm sm:text-base leading-relaxed font-medium ${
                                        lastMessage.role === 'assistant' ? 'text-white/95' : 'text-white/70'
                                    }`}>{lastMessage.content}</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {/* No longer showing the tap text since it's automatic */}
                        </AnimatePresence>
                    )}
                </AnimatePresence>
            </div>

            {/* ===== BOTTOM CONTROL BAR (Glass Dock) ===== */}
            <div className="relative z-30 px-4 pb-6 sm:pb-8 w-full flex justify-center">
                <div className="bg-card border border-border shadow-md rounded-[2rem] px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-5 transition-all">
                    
                    {/* Transcript Toggle */}
                    <button
                        onClick={() => setState(prev => ({ ...prev, showTranscript: true }))}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                        title="View Transcript"
                        aria-label="View Transcript"
                    >
                        <History className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                    </button>

                    {/* Mic Toggle */}
                    <button
                        onClick={toggleLiveMode}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${
                            isLiveMode
                                ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                        }`}
                        title={isLiveMode ? "Mute Microphone" : "Unmute Microphone"}
                        aria-label={isLiveMode ? "Mute Microphone" : "Unmute Microphone"}
                    >
                        {isLiveMode
                            ? <Mic className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                            : <MicOff className="w-5 h-5" />
                        }
                    </button>

                    {/* Video Toggle */}
                    <button
                        onClick={toggleUserVideo}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${
                            isVideoOn
                                ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                        }`}
                        title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                        aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
                    >
                        {isVideoOn
                            ? <Video className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                            : <VideoOff className="w-5 h-5" />
                        }
                    </button>

                    {/* End Call */}
                    <button
                        onClick={() => setShowEndConfirm(true)}
                        disabled={isEnding}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
                        title="End Session"
                        aria-label="End Session"
                    >
                        <Phone className="w-5 h-5 text-white rotate-[135deg]" />
                    </button>
                </div>
            </div>


            {/* Transcript Drawer / Panel */}
            <AnimatePresence>
                {state.showTranscript && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setState(prev => ({ ...prev, showTranscript: false }))}
                            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-lg h-full bg-card/90 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-card/5">
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <History className="w-5 h-5 text-primary" />
                                    </div>
                                    Session Transcript
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setState(prev => ({ ...prev, showTranscript: false }))}
                                    className="hover:bg-muted/10 rounded-full"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                {state.transcript.map((msg, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * idx }}
                                        key={idx}
                                        className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        {msg.role === 'assistant' && multiCharacters ? (
                                            /* Multi-character transcript entries */
                                            <div className="space-y-2 w-full">
                                                {parseCharacterLines(msg.content).map((part, pIdx) => (
                                                    <div key={pIdx}>
                                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1 ${part.color === 'pink' ? 'text-pink-500' : 'text-blue-500'
                                                            }`}>
                                                            {part.char} <div className={`w-6 h-[1px] ${part.color === 'pink' ? 'bg-pink-500/30' : 'bg-blue-500/30'}`}></div>
                                                        </div>
                                                        <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed backdrop-blur-md border shadow-lg rounded-tl-sm ${part.color === 'pink'
                                                            ? 'bg-pink-500/10 border-pink-500/20 text-foreground'
                                                            : 'bg-blue-500/10 border-blue-500/20 text-foreground'
                                                            }`}>
                                                            {part.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Original single-character transcript entries */
                                            <>
                                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-muted-foreground flex-row-reverse' : 'text-primary'}`}>
                                                    {msg.role === 'user' ? (
                                                        <>You <div className="w-6 h-[1px] bg-border"></div></>
                                                    ) : (
                                                        <>AI Coach <div className="w-6 h-[1px] bg-primary/30"></div></>
                                                    )}
                                                </div>

                                                <div className={`p-5 rounded-2xl max-w-[85%] text-sm leading-relaxed backdrop-blur-md border shadow-lg ${msg.role === 'user'
                                                    ? 'bg-card border-border text-foreground rounded-tr-sm'
                                                    : 'bg-primary/10 border-primary/20 text-foreground rounded-tl-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                                <div ref={transcriptEndRef} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* End Session Confirmation Modal */}
            <AnimatePresence>
                {showEndConfirm && !isEnding && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEndConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
                        >
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                                    <Square className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">End Session?</h3>
                                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                                    Are you sure you want to end this session? Your report will be generated automatically.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowEndConfirm(false)}
                                        disabled={isEnding}
                                        className="flex-1 rounded-xl border border-border hover:bg-muted/20 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleEndConversation}
                                        disabled={isEnding}
                                        className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        Yes, End Session
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Full Page Generation Loader */}
            <AnimatePresence>
                {isEnding && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative bg-card border border-primary/20 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-primary/10 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Generating Report</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Please wait while our AI analyzes your conversation, determines your scorecard, and compiles actionable feedback. This may take up to 20 seconds.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}


