"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, User, Bot, Calendar, Trophy, Sparkles, BookOpen } from "lucide-react"
import { motion } from "framer-motion"

import Navigation from "../components/landing/Navigation"
import { getApiUrl, getAuthHeaders } from "../lib/api"
import { Skeleton } from "../components/ui/skeleton"

interface SessionItem {
    id: string
    session_id: string
    created_at: string
    role: string
    ai_role: string
    scenario: string
    topic: string
    fit_score: number
    session_mode: string
}

export default function SessionHistory() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState<SessionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) { navigate('/login'); return; }

                const res = await fetch(getApiUrl('/api/history'), {
                    headers: { ...getAuthHeaders() }
                });

                if (!res.ok) {
                    const errBody = await res.text().catch(() => '')
                    console.error(`History API returned ${res.status}: ${errBody}`)
                    throw new Error(`Server error (${res.status})`)
                }

                const data = await res.json()

                if (!Array.isArray(data)) {
                    console.error('History API returned non-array:', data)
                    throw new Error(data?.error || 'Unexpected response format')
                }

                const mappedSessions = data.map((s: any) => ({
                    id: s.session_id,
                    session_id: s.session_id,
                    created_at: s.date,
                    role: s.role,
                    ai_role: s.ai_role,
                    scenario: s.title || s.scenario || "Untitled Scenario",
                    topic: s.scenario_type || "General",
                    fit_score: s.score || 0,
                    session_mode: s.session_mode || "skill_assessment"
                }))

                setSessions(mappedSessions)
                setError(null)
            } catch (err: any) {
                console.error("Failed to load sessions:", err)
                setError(err?.message || 'Failed to load session history')
            } finally {
                setLoading(false)
            }
        }

        fetchSessions()
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <Navigation />



            <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-32">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Completed Sessions</h2>
                    <p className="text-muted-foreground text-lg">Review your completed conversations and reports.</p>
                </div>

                {loading ? (
                    <div className="grid gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 md:items-center justify-between max-w-[800px] mx-auto w-full">
                                <div className="flex-1 space-y-4">
                                    <div className="flex gap-3">
                                        <Skeleton className="h-6 w-24 rounded-md" />
                                        <Skeleton className="h-6 w-32 rounded-md" />
                                    </div>
                                    <Skeleton className="h-8 w-3/4 rounded-md" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center space-y-2">
                                        <Skeleton className="h-4 w-12 mx-auto" />
                                        <Skeleton className="h-10 w-16 mx-auto rounded-lg" />
                                    </div>
                                    <Skeleton className="h-10 w-28 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-24 bg-card border border-border border-dashed rounded-xl shadow-sm group">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border group-hover:bg-muted transition-colors">
                            <Clock className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            {error ? 'Unable to Load History' : 'No Completed Sessions Yet'}
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            {error
                                ? `There was a problem loading your sessions: ${error}. Please try refreshing the page.`
                                : "Complete a conversation to see your session history and reports here."}
                        </p>
                        <button onClick={() => error ? window.location.reload() : navigate("/practice")} className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm">
                            {error ? 'Refresh Page' : 'Start New Session'}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {sessions.map((session, idx) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -4, scale: 1.01 }}
                                className="group relative bg-card hover:bg-muted border border-border rounded-xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-8 md:items-center justify-between transition-all duration-200 max-w-[800px] mx-auto w-full"
                            >
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(session.created_at)}
                                        </div>
                                        {/* Topic Badge */}
                                        <span className="text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                                            {session.topic.toUpperCase()}
                                        </span>
                                        {/* Session Mode Badge */}
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

                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                                            {session.scenario}
                                        </h3>

                                        {/* Explicit Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">User Role</div>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <User className="w-4 h-4 text-primary" />
                                                    {session.role}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">AI Role</div>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Bot className="w-4 h-4 text-purple-400" />
                                                    {session.ai_role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 justify-between md:justify-end md:flex-col lg:flex-row border-t md:border-t-0 border-border/50 pt-4 md:pt-0">
                                    {session.session_mode !== 'mentorship' && session.fit_score > 0 && (
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Score</div>
                                            <div className={`text-2xl sm:text-3xl font-black ${session.fit_score >= 7 ? 'text-emerald-500' : session.fit_score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {session.fit_score.toFixed(1)}<span className="text-sm text-muted-foreground font-semibold ml-0.5">/10</span>
                                            </div>
                                        </div>
                                    )}
                                    {session.session_mode === 'mentorship' && (
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</div>
                                            <div className="text-lg font-black text-purple-500">
                                                ✓ Complete
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate(`/report/${session.id}`)}
                                        className="min-w-[140px] px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all btn-press bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-border/80"
                                    >
                                        <Trophy className="w-4 h-4" /> View Report
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
