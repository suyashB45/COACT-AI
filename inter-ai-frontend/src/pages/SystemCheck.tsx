import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Camera, Mic, CheckCircle2, AlertCircle, Loader2, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { getApiUrl, getAuthHeaders, safeJson } from "@/lib/api"

export default function SystemCheck() {
    const { sessionId } = useParams()
    const navigate = useNavigate()

    const [cameraStatus, setCameraStatus] = useState<"pending" | "checking" | "success" | "error">("pending")
    const [audioStatus, setAudioStatus] = useState<"pending" | "checking" | "success" | "error">("pending")
    const [serverStatus, setServerStatus] = useState<"pending" | "checking" | "success" | "error">("pending")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
    const [audioLevel, setAudioLevel] = useState<number>(0)
    
    const videoRef = useRef<HTMLVideoElement>(null)

    const { refetch: pingServer } = useQuery({
        queryKey: ['healthCheck'],
        queryFn: async () => {
            const response = await fetch(getApiUrl('/api/health'), {
                method: 'GET',
                headers: { ...getAuthHeaders() }
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return safeJson(response)
        },
        enabled: false,
        retry: false
    })

    // Attach video stream whenever the video element or stream is available
    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream
        }
    }, [videoStream, cameraStatus])

    // Process audio level for visualizer
    useEffect(() => {
        if (!audioStream) return
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(audioStream)
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1)

        analyser.smoothingTimeConstant = 0.8
        analyser.fftSize = 1024

        microphone.connect(analyser)
        analyser.connect(scriptProcessor)
        scriptProcessor.connect(audioContext.destination)

        scriptProcessor.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(array)
            let values = 0
            const length = array.length
            for (let i = 0; i < length; i++) {
                values += (array[i])
            }
            const average = values / length
            setAudioLevel(average)
        }

        return () => {
            scriptProcessor.disconnect()
            analyser.disconnect()
            microphone.disconnect()
            if (audioContext.state !== 'closed') {
                audioContext.close()
            }
        }
    }, [audioStream])

    // Stop streams when unmounting
    useEffect(() => {
        return () => {
            if (videoStream) videoStream.getTracks().forEach(t => t.stop())
            if (audioStream) audioStream.getTracks().forEach(t => t.stop())
        }
    }, [videoStream, audioStream])

    const checkCamera = async () => {
        setCameraStatus("checking")
        setErrorMessage(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            setVideoStream(stream)
            setCameraStatus("success")
        } catch (error: any) {
            console.error("Camera access denied:", error)
            setCameraStatus("error")
            setErrorMessage("Camera access denied. Please allow camera permissions in your browser settings.")
        }
    }

    const checkAudio = async () => {
        setAudioStatus("checking")
        setErrorMessage(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setAudioStream(stream)
            setAudioStatus("success")
        } catch (error: any) {
            console.error("Microphone access denied:", error)
            setAudioStatus("error")
            setErrorMessage("Microphone access denied. Please allow microphone permissions in your browser settings.")
        }
    }

    const checkServer = async () => {
        setServerStatus("checking")
        setErrorMessage(null)
        try {
            const { isError, error } = await pingServer()
            if (isError) {
                throw error
            }
            setServerStatus("success")
        } catch (error: any) {
            console.error("Backend connection failed:", error)
            setServerStatus("error")
            setErrorMessage("Unable to connect to the backend server. Please ensure it is running.")
        }
    }

    const handleNext = () => {
        if (allPassed) {
            navigate(`/conversation/${sessionId}`)
        }
    }

    const allPassed = cameraStatus === "success" && audioStatus === "success" && serverStatus === "success"

    return (
        <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center p-4 font-sans text-foreground">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-card/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-3 tracking-tight">System Permissions Setup</h1>
                    <p className="text-muted-foreground">
                        We need access to your camera and microphone to provide the best experience.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Camera Check */}
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                cameraStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                                cameraStatus === 'error' ? 'bg-red-500/20 text-red-400' : 
                                'bg-white/5 text-white/60'
                            }`}>
                                <Camera className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white/90">Camera Access</h3>
                                <p className="text-sm text-white/50">Used for video call simulation</p>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center">
                            {cameraStatus === "success" ? (
                                <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-500/10 rounded-full font-medium text-sm border border-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> Allowed
                                </div>
                            ) : cameraStatus === "error" ? (
                                <div className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-full font-medium text-sm border border-red-500/20">
                                    <AlertCircle className="w-4 h-4" /> Denied
                                </div>
                            ) : cameraStatus === "checking" ? (
                                <Button disabled variant="outline" className="rounded-full w-24 border-white/10">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </Button>
                            ) : (
                                <Button onClick={checkCamera} className="rounded-full w-24 bg-primary hover:bg-primary/90 text-white font-medium">
                                    Check
                                </Button>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {cameraStatus === "success" && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="overflow-hidden rounded-xl border border-white/10"
                            >
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className="w-full h-48 object-cover mirror bg-black" 
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Audio Check */}
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                audioStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                                audioStatus === 'error' ? 'bg-red-500/20 text-red-400' : 
                                'bg-white/5 text-white/60'
                            }`}>
                                <Mic className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white/90">Audio Check</h3>
                                <p className="text-sm text-white/50">Used to communicate with the AI</p>
                                {audioStatus === 'success' && (
                                    <div className="flex gap-1 mt-2 items-end h-4">
                                        {[...Array(8)].map((_, i) => (
                                            <motion.div 
                                                key={i}
                                                className="w-1.5 bg-emerald-500 rounded-full"
                                                animate={{ height: Math.max(4, (audioLevel / 100) * 16 * (Math.random() * 0.5 + 0.5)) }}
                                                transition={{ type: 'tween', duration: 0.1 }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center">
                            {audioStatus === "success" ? (
                                <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-500/10 rounded-full font-medium text-sm border border-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> Allowed
                                </div>
                            ) : audioStatus === "error" ? (
                                <div className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-full font-medium text-sm border border-red-500/20">
                                    <AlertCircle className="w-4 h-4" /> Denied
                                </div>
                            ) : audioStatus === "checking" ? (
                                <Button disabled variant="outline" className="rounded-full w-24 border-white/10">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </Button>
                            ) : (
                                <Button onClick={checkAudio} className="rounded-full w-24 bg-primary hover:bg-primary/90 text-white font-medium">
                                    Check
                                </Button>
                            )}
                        </div>
                    </div>
                    {/* Server Check */}
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                serverStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                                serverStatus === 'error' ? 'bg-red-500/20 text-red-400' : 
                                'bg-white/5 text-white/60'
                            }`}>
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white/90">Backend Integration</h3>
                                <p className="text-sm text-white/50">Used to power AI conversations</p>
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center">
                            {serverStatus === "success" ? (
                                <div className="flex items-center gap-2 text-emerald-400 px-4 py-2 bg-emerald-500/10 rounded-full font-medium text-sm border border-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> Connected
                                </div>
                            ) : serverStatus === "error" ? (
                                <div className="flex items-center gap-2 text-red-400 px-4 py-2 bg-red-500/10 rounded-full font-medium text-sm border border-red-500/20">
                                    <AlertCircle className="w-4 h-4" /> Failed
                                </div>
                            ) : serverStatus === "checking" ? (
                                <Button disabled variant="outline" className="rounded-full w-24 border-white/10">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </Button>
                            ) : (
                                <Button onClick={checkServer} className="rounded-full w-24 bg-primary hover:bg-primary/90 text-white font-medium">
                                    Check
                                </Button>
                            )}
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="text-sm text-red-400 text-center font-medium bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20">
                            {errorMessage}
                        </div>
                    )}
                </div>

                <div className="mt-10 flex justify-center">
                    <Button 
                        size="lg"
                        disabled={!allPassed} 
                        onClick={handleNext}
                        className={`w-full sm:w-auto px-12 rounded-full font-bold h-12 text-base transition-all duration-300 ${
                            allPassed 
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                : 'bg-white/5 text-white/40 cursor-not-allowed'
                        }`}
                    >
                        {allPassed ? "Proceed to Conversation" : "Next"}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
