"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    TrendingUp, TrendingDown, Minus, Award, Target, Activity,
    BarChart3, Zap, ArrowRight, Sparkles, Shield, AlertTriangle,
    Clock, Calendar, User, Bot, Trophy, BookOpen
} from "lucide-react"
import { motion } from "framer-motion"
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from "recharts"

import Navigation from "../components/landing/Navigation"
import { getApiUrl } from "@/lib/api"
import { supabase } from "@/lib/supabase"

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
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [recentSessions, setRecentSessions] = useState<SessionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) { navigate("/login"); return }

                const res = await fetch(getApiUrl("/api/analytics"), {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })
                if (!res.ok) throw new Error(`Server error (${res.status})`)
                const json: AnalyticsData = await res.json()
                setData(json)
            } catch (err: any) {
                console.error("Analytics fetch failed:", err)
                setError(err?.message || "Failed to load analytics")
            } finally {
                setLoading(false)
            }
        }

        const fetchSessions = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const res = await fetch(getApiUrl("/api/user/sessions?limit=5"), {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })
                if (res.ok) {
                    const json = await res.json()
                    if (json && json.sessions && Array.isArray(json.sessions)) {
                        setRecentSessions(json.sessions)
                    }
                }
            } catch (err) {
                console.error("Failed to load recent sessions", err)
            }
        }

        Promise.all([fetchAnalytics(), fetchSessions()]).finally(() => {
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 font-sans">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground animate-pulse font-medium tracking-wide">LOADING ANALYTICS...</p>
            </div>
        )
    }

    const noData = !data || data.improvement_status === "no_data"

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <Navigation />

            {/* Background blurs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
            </div>

            <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-32 space-y-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2">Progress Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Track your learning curve, consistency, and skill development over time.</p>
                </motion.div>

                {noData ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-card rounded-3xl border border-border border-dashed"
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
                            className="px-8 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard
                                label="Total Sessions"
                                value={data.session_counts.total.toString()}
                                icon={Activity}
                                colorClass="text-primary"
                                bgClass="bg-primary/10"
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
                        </div>

                        {/* Performance Trend Chart */}
                        {data.performance_trend.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-border/50">
                                        <TrendingUp className="w-6 h-6 text-primary" />
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
                                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                </linearGradient>
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
                                                    backgroundColor: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "12px",
                                                    fontSize: "13px",
                                                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
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

                        {/* Strongest & Weakest Skills */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {data.strongest_skills.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-card rounded-2xl border border-border p-6 shadow-sm"
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
                                                            className="h-full bg-emerald-500 rounded-full"
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
                                    className="bg-card rounded-2xl border border-border p-6 shadow-sm"
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
                                                            className="h-full bg-rose-500 rounded-full"
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
                                className="bg-card rounded-2xl border border-border p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                                        <Trophy className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">Scenario Mastery</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.repeated_scenarios.map((scenario, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between">
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
                                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 text-left flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Start New Session</h3>
                                    <p className="text-sm text-muted-foreground">Practice and improve your weakest areas</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                onClick={() => navigate("/history")}
                                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 text-left flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">View All Sessions</h3>
                                    <p className="text-sm text-muted-foreground">Review past reports and performance</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </motion.button>
                        </div>

                        {/* Recent Sessions Table */}
                        {recentSessions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
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
                                        className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
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
                                            className="group relative p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:bg-muted/30 transition-colors duration-300"
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
                                                
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {session.title || session.scenario || "Untitled Scenario"}
                                                </h3>

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> {session.role}</span>
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
                                                    className="px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all btn-press bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20"
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

// --- STAT CARD ---
const StatCard = ({
    label, value, icon: Icon, colorClass, bgClass, delay
}: {
    label: string; value: string; icon: any; colorClass: string; bgClass: string; delay: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`p-5 rounded-2xl border ${bgClass} flex flex-col gap-3 group hover:shadow-lg transition-all duration-300`}
    >
        <div className={`p-2.5 rounded-xl ${bgClass} w-fit`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl md:text-3xl font-black ${colorClass} tracking-tight`}>{value}</div>
        </div>
    </motion.div>
)
