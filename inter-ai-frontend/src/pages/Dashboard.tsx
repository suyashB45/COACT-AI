"use client"

import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
    TrendingUp, TrendingDown, Minus, Award, Target, Activity,
    BarChart3, Zap, ArrowRight, Sparkles, Shield, AlertTriangle,
    Clock, Calendar, User, Bot, Trophy, BookOpen, Flame, Lightbulb
} from "lucide-react"
import { motion } from "framer-motion"
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"

import Navigation from "../components/landing/Navigation"
import AiUsageCard from "@/components/AiUsageCard"
import { getApiUrl, getAuthHeaders, getUserUsage, UserUsage, safeJson } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

// --- TYPES ---
interface AnalyticsData {
    performance_trend: { date: string; score: number; scenario_type: string }[]
    all_time_average: number
    consistency_index: number
    strongest_skills: { dimension: string; average: number; count: number }[]
    weakest_skills: { dimension: string; average: number; count: number }[]
    session_counts: Record<string, number>
    improvement_status: "improving" | "declining" | "stable" | "insufficient_data" | "no_data"
    repeated_scenarios: {
        title: string
        attempts: number
        first_score: number
        latest_score: number
        change: number
    }[]
    activity_heatmap: Record<string, number>
    current_streak: number
    best_streak: number
    next_best_action: string | null
}

export interface SessionItem {
    id: string
    session_id: string
    created_at: string
    role: string
    ai_role: string
    scenario: string
    title?: string
    topic?: string
    fit_score: number
    score?: number
    session_mode: string
    completed: boolean
}

// --- HELPERS ---
const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500"
    if (score >= 5) return "text-amber-500"
    return "text-rose-500"
}

const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-500/10 border-emerald-500/20"
    if (score >= 5) return "bg-amber-500/10 border-amber-500/20"
    return "bg-rose-500/10 border-rose-500/20"
}

// --- COMPONENT ---
export default function Dashboard() {
    const navigate = useNavigate()

    const { data, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
        queryKey: ['analytics'],
        queryFn: async () => {
            const res = await fetch(getApiUrl("/api/analytics"), {
                headers: { ...getAuthHeaders() }
            })
            if (!res.ok) throw new Error(`Server error (${res.status})`)
            return safeJson(res)
        }
    })

    const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
        queryKey: ['recentSessions'],
        queryFn: async () => {
            const res = await fetch(getApiUrl("/api/user/sessions?limit=5"), {
                headers: { ...getAuthHeaders() }
            })
            if (!res.ok) throw new Error("Failed to load sessions")
            return safeJson(res)
        }
    })

    const { data: usageData, isLoading: usageLoading } = useQuery<UserUsage>({
        queryKey: ['usage'],
        queryFn: () => getUserUsage(),
        refetchInterval: 60_000,
        retry: false
    })

    const recentSessions: SessionItem[] = sessionsData?.sessions || []
    const loading = analyticsLoading || sessionsLoading

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans">
                <Navigation />
                <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-32 space-y-10">
                    <div>
                        <Skeleton className="h-10 w-64 mb-4" />
                        <Skeleton className="h-6 w-96" />
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-[400px] w-full rounded-2xl" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const noData = !data || data.improvement_status === "no_data"

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <Navigation />



            <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-32 space-y-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Progress Dashboard</h1>
                    <p className="text-lg text-muted-foreground font-medium">Track your learning curve, consistency, and skill development over time.</p>
                </motion.div>

                {usageData && !usageLoading && (
                    <MonthlyUsage usage={usageData} />
                )}

                <AiUsageCard />

                {noData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 glass-panel border-dashed"
                    >
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border">
                            <BarChart3 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Analytics Yet</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Complete your first simulation to start tracking your progress and skill development.
                        </p>
                        <button
                            onClick={() => navigate("/practice")}
                            className="px-8 py-3 rounded-xl font-bold bg-electric-blue text-white hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] inline-flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Start First Session
                        </button>
                    </motion.div>
                ) : (
                    <>
                        {/* Improvement Banner */}
                        {data.improvement_status === "improving" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 rounded-2xl border border-emerald-500/20 flex items-center gap-4"
                            >
                                <div className="p-3 rounded-xl bg-emerald-500/20">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">You're Improving! 🎉</h3>
                                    <p className="text-sm text-muted-foreground">Your recent sessions show a positive trend compared to your all-time average. Keep up the great work!</p>
                                </div>
                            </motion.div>
                        )}
                        {data.improvement_status === "declining" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-500/20 flex items-center gap-4"
                            >
                                <div className="p-3 rounded-xl bg-amber-500/20">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-600 dark:text-amber-400 text-lg">Room for Growth</h3>
                                    <p className="text-sm text-muted-foreground">Your recent scores are below your average. Focus on your weakest areas below and keep practicing!</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                            <StatCard
                                label="Total Sessions"
                                value={data.session_counts.total.toString()}
                                icon={Activity}
                                colorClass="text-electric-blue"
                                bgClass="bg-electric-blue/10"
                                delay={0}
                            />
                            <StatCard
                                label="All-Time Average"
                                value={`${data.all_time_average.toFixed(1)}/10`}
                                icon={Award}
                                colorClass={getScoreColor(data.all_time_average)}
                                bgClass={getScoreBg(data.all_time_average)}
                                delay={0.1}
                            />
                            <StatCard
                                label="Consistency Index"
                                value={`${data.consistency_index}%`}
                                icon={Shield}
                                colorClass={data.consistency_index >= 80 ? "text-emerald-500" : data.consistency_index >= 50 ? "text-amber-500" : "text-rose-500"}
                                bgClass={data.consistency_index >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : data.consistency_index >= 50 ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20"}
                                delay={0.2}
                            />
                            <StatCard
                                label="Trend"
                                value={data.improvement_status === "improving" ? "↑ Improving" : data.improvement_status === "declining" ? "↓ Declining" : "→ Stable"}
                                icon={data.improvement_status === "improving" ? TrendingUp : data.improvement_status === "declining" ? TrendingDown : Minus}
                                colorClass={data.improvement_status === "improving" ? "text-emerald-500" : data.improvement_status === "declining" ? "text-rose-500" : "text-blue-500"}
                                bgClass={data.improvement_status === "improving" ? "bg-emerald-500/10 border-emerald-500/20" : data.improvement_status === "declining" ? "bg-rose-500/10 border-rose-500/20" : "bg-blue-500/10 border-blue-500/20"}
                                delay={0.3}
                            />
                            <StatCard
                                label="Current Streak"
                                value={`${data.current_streak} Days`}
                                icon={Flame}
                                colorClass="text-orange-500"
                                bgClass="bg-orange-500/10 border-orange-500/20"
                                delay={0.4}
                            />
                        </div>

                        {/* AI Recommendation Banner */}
                        {data.next_best_action && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-primary/5 border border-electric-blue/20 rounded-xl flex items-center gap-5 p-6 md:p-8 shadow-sm"
                            >
                                <div className="p-4 rounded-full bg-electric-blue/20 ring-1 ring-electric-blue/30 hidden sm:block">
                                    <Lightbulb className="w-8 h-8 text-electric-blue drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-xl text-foreground mb-1 flex items-center gap-2">
                                        Next Best Action <Sparkles className="w-4 h-4 text-purple-400" />
                                    </h3>
                                    <p className="text-muted-foreground font-medium">{data.next_best_action}</p>
                                </div>
                                <button 
                                    onClick={() => navigate("/practice")}
                                    className="hidden md:flex px-6 py-3 rounded-xl font-bold bg-electric-blue text-white hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] items-center gap-2 shadow-lg shadow-electric-blue/30 shrink-0"
                                >
                                    Practice Now <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Performance Trend Chart */}
                        {data.performance_trend.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-panel p-6 md:p-8"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-electric-blue/10 ring-1 ring-border/50">
                                        <TrendingUp className="w-6 h-6 text-electric-blue" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground tracking-wide uppercase">Performance Trend</h2>
                                        <p className="text-sm text-muted-foreground">Your last {data.performance_trend.length} sessions</p>
                                    </div>
                                </div>
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="99%" height="99%" minWidth={10} minHeight={10}>
                                        <AreaChart data={data.performance_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0.1} />
                                                </linearGradient>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/10" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fill: "currentColor", fontSize: 11 }}
                                                className="text-muted-foreground"
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[0, 10]}
                                                tick={{ fill: "currentColor", fontSize: 11 }}
                                                className="text-muted-foreground"
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "rgba(10, 10, 15, 0.7)",
                                                    backdropFilter: "blur(12px)",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    borderRadius: "16px",
                                                    fontSize: "13px",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                                                    color: "white"
                                                }}
                                                labelFormatter={formatDate}
                                                formatter={(value: number | undefined) => [`${value ?? 0}/10`, "Score"]}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#a855f7"
                                                strokeWidth={3}
                                                fill="url(#scoreGradient)"
                                                dot={{ fill: "#a855f7", strokeWidth: 2, r: 5 }}
                                                activeDot={{ r: 7, stroke: "#a855f7", strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}

                        {/* Skill Radar Chart */}
                        {(data.strongest_skills.length > 0 || data.weakest_skills.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="glass-panel p-6 md:p-8"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                                        <Target className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground tracking-wide uppercase">Skill Profile</h2>
                                        <p className="text-sm text-muted-foreground">Your proficiency across core coaching dimensions</p>
                                    </div>
                                </div>
                                <div className="w-full h-[350px]">
                                    <ResponsiveContainer width="99%" height="99%" minWidth={10} minHeight={10}>
                                        <RadarChart
                                            data={[
                                                ...data.strongest_skills.map(s => ({ skill: s.dimension.length > 18 ? s.dimension.slice(0, 16) + '…' : s.dimension, score: parseFloat(s.average.toFixed(1)), fullMark: 10 })),
                                                ...data.weakest_skills.map(s => ({ skill: s.dimension.length > 18 ? s.dimension.slice(0, 16) + '…' : s.dimension, score: parseFloat(s.average.toFixed(1)), fullMark: 10 }))
                                            ].slice(0, 8)}
                                        >
                                            <PolarGrid stroke="hsl(var(--border))" />
                                            <PolarAngleAxis
                                                dataKey="skill"
                                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
                                            />
                                            <PolarRadiusAxis
                                                angle={90}
                                                domain={[0, 10]}
                                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                                axisLine={false}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="score"
                                                stroke="#6366f1"
                                                fill="#6366f1"
                                                fillOpacity={0.2}
                                                strokeWidth={2}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "rgba(10, 10, 15, 0.7)",
                                                    backdropFilter: "blur(12px)",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    borderRadius: "16px",
                                                    fontSize: "13px",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                                                    color: "white"
                                                }}
                                                formatter={(value: number | undefined) => [`${value ?? 0}/10`, "Score"]}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}

                        {/* Strongest & Weakest Skills */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {data.strongest_skills.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="glass-panel p-6"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                            <Zap className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">Strongest Skills</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {data.strongest_skills.map((skill, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                                <div>
                                                    <span className="font-semibold text-foreground">{skill.dimension}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">({skill.count} sessions)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(skill.average / 10) * 100}%` }}
                                                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                                                        />
                                                    </div>
                                                    <span className="font-mono font-black text-emerald-500 w-12 text-right">{skill.average.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {data.weakest_skills.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="glass-panel p-6"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
                                            <Target className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">Needs Improvement</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {data.weakest_skills.map((skill, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                                <div>
                                                    <span className="font-semibold text-foreground">{skill.dimension}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">({skill.count} sessions)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(skill.average / 10) * 100}%` }}
                                                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                                            className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                                                        />
                                                    </div>
                                                    <span className="font-mono font-black text-rose-500 w-12 text-right">{skill.average.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Scenario Mastery */}
                        {data.repeated_scenarios && data.repeated_scenarios.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="glass-panel p-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                                        <Trophy className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">Scenario Mastery</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.repeated_scenarios.map((scenario, i) => (
                                        <div key={i} className="p-5 rounded-xl bg-card/40 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-purple-500/10">
                                            <div className="mb-4">
                                                <h3 className="font-bold text-foreground text-sm line-clamp-2" title={scenario.title}>{scenario.title || "Untitled Scenario"}</h3>
                                                <span className="text-xs text-muted-foreground font-semibold">{scenario.attempts} attempts</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">First Try</span>
                                                    <span className="font-mono font-bold text-foreground">{scenario.first_score.toFixed(1)}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Latest</span>
                                                    <span className="font-mono font-bold text-foreground">{scenario.latest_score.toFixed(1)}</span>
                                                </div>
                                                <div className="ml-2 flex justify-end shrink-0">
                                                    {scenario.change > 0 ? (
                                                        <span className="flex items-center justify-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md min-w-[3rem]">
                                                            +{scenario.change.toFixed(1)}
                                                        </span>
                                                    ) : scenario.change < 0 ? (
                                                        <span className="flex items-center justify-center text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md min-w-[3rem]">
                                                            {scenario.change.toFixed(1)}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md min-w-[3rem]">
                                                            0.0
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={() => navigate("/practice")}
                                className="group p-6 bg-primary/5 hover:bg-electric-blue/10 border border-border shadow-sm rounded-xl text-left flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-electric-blue transition-colors">Start New Session</h3>
                                    <p className="text-sm text-muted-foreground">Practice and improve your weakest areas</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-electric-blue group-hover:translate-x-1 transition-all" />
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                onClick={() => navigate("/history")}
                                className="group p-6 bg-purple-500/5 hover:bg-purple-500/10 border border-border shadow-sm rounded-xl text-left flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-electric-blue transition-colors">View All Sessions</h3>
                                    <p className="text-sm text-muted-foreground">Review past reports and performance</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-electric-blue group-hover:translate-x-1 transition-all" />
                            </motion.button>
                        </div>

                        {/* Recent Sessions Table */}
                        {recentSessions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="glass-panel p-0 overflow-hidden"
                            >
                                <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                                            <Clock className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Recent Sessions</h2>
                                            <p className="text-sm text-muted-foreground">Your latest practice and assessments</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate("/history")}
                                        className="text-sm font-semibold text-electric-blue hover:text-electric-blue/80 flex items-center gap-1 transition-colors"
                                    >
                                        View All <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="divide-y divide-border/50">
                                    {recentSessions.map((session, idx) => (
                                        <motion.div 
                                            key={session.id || session.session_id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.7 + (idx * 0.05) }}
                                            className="group relative p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors duration-200"
                                        >
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                                    <div className="flex items-center gap-1.5 bg-muted/80 px-2 py-1 rounded-md">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(session.created_at)}
                                                    </div>
                                                    {session.session_mode === 'mentorship' ? (
                                                        <span className="text-purple-500 bg-purple-500/10 px-2 py-1 rounded-md flex items-center gap-1.5 border border-purple-500/20">
                                                            <BookOpen className="w-3.5 h-3.5" /> Mentorship
                                                        </span>
                                                    ) : (
                                                        <span className="text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md flex items-center gap-1.5 border border-blue-500/20">
                                                            <Sparkles className="w-3.5 h-3.5" /> Assessment
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-electric-blue transition-colors line-clamp-1">
                                                    {session.title || session.scenario || "Untitled Scenario"}
                                                </h3>

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-electric-blue" /> {session.role}</span>
                                                    <span className="text-border text-xs hidden sm:inline">•</span>
                                                    <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-purple-400" /> {session.ai_role}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 justify-between md:justify-end">
                                                {session.session_mode !== 'mentorship' && session.score !== undefined && session.score !== null && (
                                                    <div className="text-right">
                                                        <div className={`text-xl font-black ${session.score >= 7 ? 'text-emerald-500' : session.score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {Number(session.score).toFixed(1)}<span className="text-sm font-bold opacity-50 ml-0.5">/10</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => navigate(`/report/${session.id || session.session_id}`)}
                                                    className="px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all btn-press bg-electric-blue/10 hover:bg-primary text-electric-blue hover:text-primary-foreground border border-electric-blue/20"
                                                    aria-label={`View full report for ${session.title || 'session'}`}
                                                >
                                                    <Trophy className="w-4 h-4" /> Report
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

// --- MONTHLY USAGE ---
const formatTokens = (n: number) => n.toLocaleString("en-US")

const MonthlyUsage = ({ usage }: { usage: UserUsage }) => {
    const tokenPct = Math.min(100, (usage.tokens_used / usage.monthly_token_limit) * 100)
    const sessionPct = Math.min(100, (usage.sessions_this_month / usage.monthly_session_limit) * 100)
    const tokensLeft = Math.max(0, usage.monthly_token_limit - usage.tokens_used)
    const sessionsLeft = Math.max(0, usage.monthly_session_limit - usage.sessions_this_month)

    const tokenBar = tokenPct >= 90 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
        : tokenPct >= 70 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
        : "bg-electric-blue shadow-[0_0_10px_rgba(37,99,235,0.8)]"
    const sessionBar = sessionPct >= 90 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
        : sessionPct >= 70 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
        : "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"

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
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-wide uppercase">Monthly Usage</h2>
                    <p className="text-sm text-muted-foreground">Your plan resets at the start of each month</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-electric-blue" /> AI Tokens
                        </span>
                        <span className="font-mono font-black text-foreground">
                            {formatTokens(usage.tokens_used)} <span className="opacity-50">/ {formatTokens(usage.monthly_token_limit)}</span>
                        </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tokenPct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${tokenBar}`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {tokensLeft > 0 ? `${formatTokens(tokensLeft)} tokens remaining this month` : "Token quota exhausted for this month"}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-purple-500" /> Sessions
                        </span>
                        <span className="font-mono font-black text-foreground">
                            {usage.sessions_this_month} <span className="opacity-50">/ {usage.monthly_session_limit}</span>
                        </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sessionPct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                            className={`h-full rounded-full ${sessionBar}`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {sessionsLeft > 0 ? `${sessionsLeft} session${sessionsLeft > 1 ? "s" : ""} remaining this month` : "Session quota exhausted for this month"}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

// --- STAT CARD ---
const StatCard = ({
    label, value, icon: Icon, colorClass, bgClass, delay
}: {
    label: string; value: string; icon: any; colorClass: string; bgClass: string; delay: number
}) => {
    const glowClass = bgClass.includes("emerald") ? "hover:shadow-emerald-500/10 hover:border-emerald-500/30" 
                  : bgClass.includes("amber") ? "hover:shadow-amber-500/10 hover:border-amber-500/30"
                  : bgClass.includes("rose") ? "hover:shadow-rose-500/10 hover:border-rose-500/30"
                  : "hover:shadow-primary/10 hover:border-primary/30";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`glass-panel flex flex-col gap-3 group ${glowClass} relative overflow-hidden`}
        >
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-20 ${bgClass.split(' ')[0]}`} />
            
            <div className={`p-3 rounded-2xl ${bgClass} w-fit ring-1 ring-inset ring-white/10 z-10`}>
                <Icon className={`w-6 h-6 ${colorClass} drop-shadow-md`} />
            </div>
            <div className="z-10 mt-1">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 mb-1.5">{label}</div>
                <div className={`text-3xl md:text-4xl font-black ${colorClass} tracking-tight drop-shadow-sm`}>{value}</div>
            </div>
        </motion.div>
    )
}

