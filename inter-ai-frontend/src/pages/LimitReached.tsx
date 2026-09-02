import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Sparkles, Timer, Gauge } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AiRateLimitInfo } from '@/lib/api'

const formatTokens = (n: number) => n.toLocaleString('en-US')

const LIMIT_TYPE_LABELS: Record<string, string> = {
    requests_per_minute: 'Requests per minute',
    hourly_input_tokens: 'Hourly input tokens',
    hourly_output_tokens: 'Hourly output tokens',
    daily_tokens: 'Daily token allowance',
}

const formatReset = (retryAfter: number) => {
    if (retryAfter >= 3600) {
        const h = Math.round(retryAfter / 3600)
        return `~${h} hour${h > 1 ? 's' : ''}`
    }
    const m = Math.max(1, Math.round(retryAfter / 60))
    return `~${m} minute${m > 1 ? 's' : ''}`
}

export default function LimitReached() {
    const navigate = useNavigate()
    const location = useLocation()

    const rateLimit = (location.state?.rateLimit as AiRateLimitInfo | null) ?? null

    const defaultMessage = "You've experienced all the sessions available in your current plan. Upgrade to unlock unlimited scenarios, advanced coaching analytics, and Custom Scenario Builders."
    const customMessage = location.state?.message || defaultMessage

    const limitLabel = rateLimit ? (LIMIT_TYPE_LABELS[rateLimit.limit_type] || rateLimit.limit_type) : null
    const usedPct = rateLimit && rateLimit.limit > 0 ? Math.min(100, Math.round((rateLimit.used / rateLimit.limit) * 100)) : null

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background/80 backdrop-blur-3xl rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 max-w-lg w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-12 shadow-2xl text-center"
            >
                <div className="mx-auto w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                    Usage Limit Reached
                </h1>
                
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                    {customMessage}
                </p>

                {rateLimit && limitLabel && usedPct !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mb-8 space-y-4 rounded-2xl border border-border/50 bg-background/40 p-5 text-left"
                    >
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Gauge className="w-4 h-4 text-electric-blue" /> {limitLabel}
                            </span>
                            <span className="font-mono font-black text-foreground">
                                {formatTokens(rateLimit.used)} <span className="opacity-50">/ {formatTokens(rateLimit.limit)}</span>
                            </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, usedPct)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold flex items-center gap-1.5">
                                <Timer className="w-4 h-4" /> AI access resumes in {formatReset(rateLimit.retry_after)}
                            </span>
                            <span className="font-black uppercase tracking-wider text-rose-500">Limit reached · {usedPct}% used</span>
                        </div>
                    </motion.div>
                )}

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-primary bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-bold py-4 px-8 rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                    </motion.button>

                    {!rateLimit && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = "mailto:team@coact-ai.com?subject=Upgrade%20Inquiry"}
                            className="w-full relative group overflow-hidden bg-card hover:bg-muted border border-border/50 text-foreground font-semibold py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-colors"
                        >
                            <Sparkles className="w-5 h-5" /> Contact Sales to Upgrade
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}