import { motion } from "framer-motion"
import { Activity, ArrowDown, ArrowUp, Zap, AlertTriangle } from "lucide-react"
import { useAiUsage } from "@/hooks/useAiUsage"
import { AiUsageMeter } from "@/lib/api"

const formatTokens = (n: number) => n.toLocaleString("en-US")

interface UsageLevel {
    tone: string
    bar: string
    label: string
    note: string
}

const levelFor = (pct: number): UsageLevel => {
    if (pct >= 100) return {
        tone: "text-rose-500",
        bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
        label: "Limit reached",
        note: "AI responses paused until the window resets",
    }
    if (pct >= 95) return {
        tone: "text-rose-500",
        bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
        label: "Almost at your limit",
        note: "Very little usage left",
    }
    if (pct >= 85) return {
        tone: "text-amber-500",
        bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
        label: "Usage warning",
        note: "You're nearly out of quota for this window",
    }
    if (pct >= 70) return {
        tone: "text-amber-500",
        bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
        label: "Approaching your limit",
        note: "Keep an eye on remaining usage",
    }
    return {
        tone: "text-emerald-500",
        bar: "bg-electric-blue shadow-[0_0_10px_rgba(37,99,235,0.8)]",
        label: "Healthy",
        note: "Plenty of usage remaining",
    }
}

const resetTime = (iso: string) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return "unavailable"
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const pctOf = (meter: AiUsageMeter) =>
    meter.limit > 0 ? Math.min(100, (meter.used / meter.limit) * 100) : 0

const MiniMeter = ({ title, meter, icon: Icon, iconColor }: {
    title: string
    meter: AiUsageMeter
    icon: any
    iconColor: string
}) => {
    const pct = pctOf(meter)
    const level = levelFor(pct)
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
                </span>
                <span className="font-mono font-black text-foreground">
                    {formatTokens(meter.used)} <span className="opacity-50">/ {formatTokens(meter.limit)}</span>
                </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(2, pct)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${level.bar}`}
                />
            </div>
            <p className={`text-[11px] font-semibold ${level.tone}`}>
                {formatTokens(meter.remaining)} left · resets {resetTime(meter.reset_at)}
            </p>
        </div>
    )
}

export default function AiUsageCard() {
    // Guests have no quota rows; skip the card entirely.
    const isLoggedIn = !!localStorage.getItem("user")
    const { data, isLoading } = useAiUsage({ enabled: isLoggedIn, poll: true })

    if (!isLoggedIn) return null
    if (isLoading || !data) {
        return (
            <div className="glass-panel p-6 md:p-8 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-electric-blue/10 ring-1 ring-electric-blue/20">
                        <Activity className="w-6 h-6 text-electric-blue" />
                    </div>
                    <div>
                        <div className="h-6 w-32 bg-muted rounded" />
                        <div className="h-4 w-48 bg-muted rounded mt-2" />
                    </div>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full mb-8" />
                <div className="grid sm:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded" />)}
                </div>
            </div>
        )
    }

    const daily = data.daily.tokens
    const dailyPct = pctOf(daily)
    const dailyLevel = levelFor(dailyPct)
    const blocked = dailyPct >= 100
    const hasWarnings = dailyPct >= 70 || data.hourly.input_tokens.used / data.hourly.input_tokens.limit >= 0.7

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 md:p-8"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-electric-blue/10 ring-1 ring-electric-blue/20">
                    <Activity className="w-6 h-6 text-electric-blue" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground tracking-wide uppercase">AI Usage</h2>
                    <p className="text-sm text-muted-foreground">
                        Daily quota resets at {resetTime(daily.reset_at)}
                    </p>
                </div>
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ring-1 ${dailyLevel.tone} ${blocked ? "bg-rose-500/10" : "bg-electric-blue/10"} ring-white/10`}>
                    {dailyLevel.label}
                </span>
            </div>

            {blocked && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-sm text-foreground">
                        Your AI usage limit has been reached. New AI requests will be paused until the quota resets.
                    </p>
                </div>
            )}

            <div className="space-y-2 mb-8">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-electric-blue" /> AI Tokens (daily total)
                    </span>
                    <span className="font-mono font-black text-foreground">
                        {formatTokens(daily.used)} <span className="opacity-50">/ {formatTokens(daily.limit)}</span>
                    </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, dailyPct)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`h-full rounded-full ${dailyLevel.bar}`}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{hasWarnings ? dailyLevel.note : `${formatTokens(daily.remaining)} tokens remaining today`}</span>
                    <span>{Math.round(dailyPct)}% used</span>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
                <MiniMeter title="Requests / min" meter={data.requests} icon={Activity} iconColor="text-electric-blue" />
                <MiniMeter title="Input / hour" meter={data.hourly.input_tokens} icon={ArrowUp} iconColor="text-emerald-500" />
                <MiniMeter title="Output / hour" meter={data.hourly.output_tokens} icon={ArrowDown} iconColor="text-purple-500" />
            </div>
        </motion.div>
    )
}