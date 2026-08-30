"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Download, AlertCircle, Target, History, Award, BookOpen, MessageSquare, ChevronRight, Check, X, ArrowLeft, ArrowRight, Clock, CheckCircle2, Brain, Quote, Lightbulb, Activity, Mic, TrendingUp, Zap, HelpCircle } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { useQuery } from "@tanstack/react-query"

import Navigation from "../components/landing/Navigation"
import { getApiUrl, getAuthHeaders } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// --- TYPES & INTERFACES (UPDATED TO MATCH BACKEND) ---

interface BaseMeta {
    scenario_id: string
    outcome_status: string
    overall_grade: string
    summary: string
    scenario_type?: string
    session_mode?: string
    emotional_trajectory?: string
    session_quality?: string
    key_themes?: string[]
    scenario?: string
}

interface BehaviourItem {
    behavior: string
    quote: string
    insight: string
    impact: string
    improved_approach: string
}

interface DetailedAnalysisItem {
    topic: string
    analysis: string
}

interface QuantitativeAnalytics {
    coaching_questions: number;
    empathy_statements: number;
    action_items: number;
    clarifying_questions: number;
    user_talk_time_percentage?: number;
}

interface ScorecardItem {
    dimension: string
    score: string
    description?: string // Keeping for backward compatibility
    rubric_criteria?: string // New explicit rubric
    reasoning?: string // New field for Proof of Marks
    quote?: string
    suggestion?: string
    alternative_questions?: { question: string; rationale: string }[]
}

interface GenericReportData {
    meta: BaseMeta
    type?: string
    transcript?: { role: "user" | "assistant", content: string }[]
    behaviour_analysis?: BehaviourItem[]
    detailed_analysis?: DetailedAnalysisItem[] | string
    question_analysis?: QuestionAnalysis // NEW: Enhanced question analysis
    mentorship_observations?: any[]
    learning_takeaways?: any
    reflection_prompts?: string[]
    comparison?: ComparisonData | null
    [key: string]: any
}

interface ComparisonDelta {
    dimension: string
    previous: number
    current: number
    change: number
}

interface ComparisonData {
    has_previous: boolean
    previous_score: number | null
    current_score: number | null
    score_change: number | null
    previous_date: string | null
    dimension_deltas: ComparisonDelta[]
}



// --- NEW DEFINITIONS FOR COACHING SIMULATION ---
interface ExecutiveSummary {
    snapshot: string;
    final_score: string;
    strengths_summary: string;
    improvements_summary: string;
    outcome_summary: string;
}

interface GoalAttainment {
    score: string;
    expectation_vs_reality: string;
    primary_gaps: string[];
    observation_focus: string[];
}

interface DeepDiveItem {
    topic: string;
    tone?: string;
    language_impact?: string;
    comfort_level?: string;
    impact?: string;
    questions_asked?: string;
    exploration?: string;
    understanding_depth?: string;
    analysis?: string; // fallback
}

interface ActionPlan {
    specific_actions: string[];
    timeline: string;
    success_indicators: string[];
}

interface FollowUpStrategy {
    review_cadence: string;
    metrics_to_track: string[];
    accountability_method: string;
}

interface FinalEvaluation {
    readiness_level: string;
    maturity_rating: string;
    immediate_focus: string[];
    long_term_suggestion: string;
}

interface SimulationReportData extends GenericReportData {
    executive_summary?: ExecutiveSummary;
    goal_attainment?: GoalAttainment;
    deep_dive_analysis?: DeepDiveItem[]; // Override generic
    quantitative_analytics?: QuantitativeAnalytics;
    scorecard?: ScorecardItem[]; // using existing
    participant_performance?: ScorecardItem[];
    missed_opportunities?: string[];
    action_plan?: ActionPlan;
    follow_up_strategy?: FollowUpStrategy;
    strengths_and_improvements?: { strengths: string[]; missed_opportunities: string[] };
    final_evaluation?: FinalEvaluation;
    pattern_summary?: string;
    turning_points?: { point: string; timestamp: string }[];
    coaching_style?: { primary_style: string; description: string };
    deal_coaching_questions?: { question: string; definition: string; scoring: string; impact: string }[];
    ideal_questions?: { question: string; definition: string; scoring: string; impact: string }[];
    learning_takeaways?: string[];
    reflection_prompts?: string[];
    speech_analysis?: {
        total_words?: number;
        filler_count?: number;
        filler_ratio?: number;
        filler_breakdown?: Record<string, number>;
        wpm?: number;
        wpm_label?: string;
    };
}

interface MentorshipReflectionData extends GenericReportData {
    conversation_snapshot?: {
        simulation_context?: {
            your_role?: string;
            ai_role?: string;
            scenario_type?: string;
            primary_skill_focus?: string;
        };
        conversation_flow_overview?: string;
    };
    ai_response_strategy_observed?: string[];
    questioning_techniques_used_by_ai?: string[];
    emotional_handling_patterns?: string[];
    turning_points?: {
        point_number?: number;
        title?: string;
        description?: string;
        ai_technique_used?: string;
        impact?: string;
    }[];
    example_phrases_demonstrated?: {
        phrase?: string;
        context?: string;
        technique?: string;
    }[];
    learning_takeaways?: {
        what_you_can_observe_and_practice?: string[];
    };
    alternative_pathways?: {
        note?: string;
        alternatives?: string[];
    } | string[];
    closing_reflection_prompts?: string[];
}

// Question Analysis (Backend Enhanced)
interface QuestionMissed {
    question: string
    category?: string // Discovery, Probing, Clarifying, Vision, Closing
    timing?: string // Early, Mid, Late
    why_important: string
    when_to_ask: string
    impact_if_asked: string
}

interface QuestionAnalysis {
    questions_asked_count: number
    questions_missed: QuestionMissed[]
    question_quality_score?: string
    question_quality_feedback?: string
    questioning_improvement_tip?: string
}

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
}

export default function Report() {
    const params = useParams()
    const navigate = useNavigate()
    const sessionId = params.sessionId as string
    const [showTranscript, setShowTranscript] = useState(false)

    const { data, isLoading: loading } = useQuery<GenericReportData>({
        queryKey: ['report', sessionId],
        queryFn: async () => {
            if (!sessionId) throw new Error("No session ID")
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            const response = await fetch(getApiUrl(`/api/session/${sessionId}/report_data`), { headers: { ...headers, ...getAuthHeaders() } });
            
            if (response.status === 400 || response.status === 404 || response.status === 202) {
                throw new Error("Report not ready");
            }
            if (!response.ok) throw new Error("Failed to fetch report data");
            
            return response.json();
        },
        enabled: !!sessionId,
        retry: (failureCount, error) => {
            if (error.message === "Report not ready" && failureCount < 30) {
                console.log(`Report not ready. Retrying in 3s... (Attempt ${failureCount + 1}/30)`);
                return true;
            }
            return false;
        },
        retryDelay: 3000,
    });

    const handleDownload = async () => {
        try {
            const headers: Record<string, string> = {};

            const response = await fetch(getApiUrl(`/api/report/${sessionId}`), { headers: { ...headers, ...getAuthHeaders() } })
            if (!response.ok) throw new Error("Failed to generate PDF")

            const contentType = response.headers.get('content-type') || ''

            // If backend returns a redirect URL (Blob Storage), open it directly
            if (contentType.includes('application/json')) {
                const jsonData = await response.json()
                if (jsonData.url) {
                    window.open(jsonData.url, '_blank')
                    return
                }
                throw new Error("No report URL found")
            }

            // Otherwise, handle as binary PDF
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `CoActAI_Report_${sessionId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading PDF:", error)
            alert("PDF export failed. Please ensure the backend is running.")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans">
                <Navigation />
                <main className="container mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-10">
                    <div className="flex flex-col items-center justify-center mb-12">
                        <Skeleton className="h-10 w-64 mb-4" />
                        <Skeleton className="h-6 w-96 mb-6" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-32 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                        <div className="space-y-6">
                            <Skeleton className="h-[120px] w-full rounded-2xl" />
                            <Skeleton className="h-[120px] w-full rounded-2xl" />
                            <Skeleton className="h-[120px] w-full rounded-2xl" />
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!data || !data.meta) {
        return (
            <div className="min-h-screen bg-background p-12 flex flex-col items-center justify-center font-sans">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-6" />
                <h2 className="text-3xl font-bold text-foreground mb-3">Report Unavailable</h2>
                <Button onClick={() => navigate("/")} variant="secondary">Return Home</Button>
            </div>
        )
    }

    const renderContent = () => {
        // Mentorship sessions use dedicated observation-based view (no scores)
        const isMentorshipRoute = data.meta?.session_mode === 'mentorship'
            || data.type === 'mentorship_reflection'
            || data.meta?.scenario_type?.toLowerCase().includes('mentorship')
        if (isMentorshipRoute) {
            return <MentorshipReflectionView data={data as MentorshipReflectionData} />
        }
        // ALL assessment scenarios use the rich SimulationView template
        return <SimulationView data={data as SimulationReportData} />
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <Navigation />
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative container mx-auto px-4 sm:px-6 py-24 sm:py-32 space-y-12">
                {/* HEADER & BANNER */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
                        <div>
                            <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to History
                            </button>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            {data.meta.scenario_type || 'Custom Scenario'}
                                        </span>
                                        {data.meta.session_mode && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${data.meta.session_mode === 'skill_assessment'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : data.meta.session_mode === 'practice'
                                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                    : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                                }`}>
                                                {data.meta.session_mode.replace('_', ' ')}
                                            </span>
                                        )}
                                        <span className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2">
                                        {(data.meta.session_mode === 'mentorship' || data.meta?.scenario_type?.toLowerCase().includes('mentorship')) ? 'Mentorship Reflection Report' : 'Session Analysis'}
                                    </h1>
                                    {(data.meta.session_mode === 'mentorship' || data.meta?.scenario_type?.toLowerCase().includes('mentorship')) ? (
                                        <p className="text-lg text-muted-foreground italic">This report summarizes key interaction patterns and learning insights from your practice simulation.</p>
                                    ) : (
                                        <p className="text-xl text-muted-foreground">{data.meta.summary}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-4 min-w-[200px]">
                            {data.meta.session_mode !== 'mentorship' && !data.meta?.scenario_type?.toLowerCase().includes('mentorship') && (
                                <div className="text-right">
                                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                        Overall Grade
                                    </div>
                                    <div className="text-7xl font-black text-primary leading-none">
                                        {data.meta.overall_grade}
                                    </div>
                                </div>
                            )}
                            <Button onClick={handleDownload} variant="outline" className="gap-2 border-border hover:bg-accent w-full">
                                <Download className="w-4 h-4" /> Export PDF Report
                            </Button>
                        </div>
                    </div>

                    {/* METRICS BANNER (Matches PDF Banner) - hidden for mentorship */}
                    {data.meta.session_mode !== 'mentorship' && !data.meta?.scenario_type?.toLowerCase().includes('mentorship') && <div className="grid md:grid-cols-3 gap-6">
                        {data.meta.emotional_trajectory && (
                            <GlassCard className="p-4 flex flex-col bg-indigo-500/5 border-indigo-500/10">
                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Emotional Arc</span>
                                <span className="text-sm font-medium text-foreground">{data.meta.emotional_trajectory}</span>
                            </GlassCard>
                        )}
                        {data.meta.session_quality && (
                            <GlassCard className="p-4 flex flex-col bg-emerald-500/5 border-emerald-500/10">
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Session Quality</span>
                                <span className="text-sm font-medium text-foreground">{data.meta.session_quality}</span>
                            </GlassCard>
                        )}
                        {data.meta.key_themes && (
                            <GlassCard className="p-4 flex flex-col bg-pink-500/5 border-pink-500/10">
                                <span className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">Key Themes</span>
                                <div className="flex flex-wrap gap-2">
                                    {data.meta.key_themes.slice(0, 3).map((t, i) => (
                                        <span key={i} className="text-xs bg-background/50 px-2 py-1 rounded border border-border/50">{t}</span>
                                    ))}
                                </div>
                            </GlassCard>
                        )}
                    </div>}
                </motion.div>

                {/* COMPARISON BANNER */}
                {data.comparison && data.comparison.has_previous && (
                    <ComparisonBanner comparison={data.comparison} />
                )}

                <motion.div variants={containerVars} initial="hidden" animate="show">
                    {renderContent()}
                </motion.div>

                {/* TRANSCRIPT */}
                {data.transcript && (
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="rounded-3xl bg-card border border-border overflow-hidden backdrop-blur-sm">
                        <div className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors group" onClick={() => setShowTranscript(!showTranscript)}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20 text-primary"><History className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Session Transcript</h3>
                                    <p className="text-sm text-muted-foreground">Review the full conversation log</p>
                                </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showTranscript ? 'rotate-90' : ''}`} />
                        </div>
                        {showTranscript && (
                            <div className="p-8 max-h-[600px] overflow-y-auto space-y-6 border-t border-border bg-muted/20">
                                {data.transcript?.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground border border-border rounded-bl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    )
}

// --- COMPARISON BANNER ---
const ComparisonBanner = ({ comparison }: { comparison: ComparisonData }) => {
    const change = comparison.score_change
    const isImproved = change !== null && change > 0
    const isDeclined = change !== null && change < 0
    const prevDate = comparison.previous_date
        ? new Date(comparison.previous_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`rounded-2xl border p-6 md:p-8 ${
                isImproved
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                    : isDeclined
                        ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
            }`}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Title + Score Change */}
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isImproved ? 'bg-emerald-500/20' : isDeclined ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
                        <TrendingUp className={`w-6 h-6 ${isImproved ? 'text-emerald-500' : isDeclined ? 'text-rose-500 rotate-180' : 'text-blue-500'}`} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isImproved ? 'text-emerald-600 dark:text-emerald-400' : isDeclined ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {isImproved ? 'You Improved! 🎉' : isDeclined ? 'Room to Grow' : 'Same Level'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Compared to your previous attempt{prevDate ? ` on ${prevDate}` : ''}
                        </p>
                    </div>
                </div>

                {/* Right: Score Delta */}
                {comparison.previous_score !== null && comparison.current_score !== null && (
                    <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-xl px-5 py-3 border border-border/50">
                        <span className="text-2xl font-black text-muted-foreground">{comparison.previous_score}</span>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        <span className={`text-2xl font-black ${isImproved ? 'text-emerald-500' : isDeclined ? 'text-rose-500' : 'text-blue-500'}`}>
                            {comparison.current_score}
                        </span>
                        {change !== null && change !== 0 && (
                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${isImproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                {change > 0 ? '+' : ''}{change}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Per-Dimension Deltas */}
            {comparison.dimension_deltas && comparison.dimension_deltas.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {comparison.dimension_deltas.map((d, i) => {
                        const improved = d.change > 0
                        const declined = d.change < 0
                        return (
                            <div key={i} className="bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 p-3 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 line-clamp-1" title={d.dimension}>
                                    {d.dimension}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-xs text-muted-foreground">{d.previous}</span>
                                    <span className="text-muted-foreground text-xs">→</span>
                                    <span className={`text-sm font-black ${improved ? 'text-emerald-500' : declined ? 'text-rose-500' : 'text-foreground'}`}>
                                        {d.current}
                                    </span>
                                </div>
                                {d.change !== 0 && (
                                    <span className={`text-xs font-bold ${improved ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {d.change > 0 ? '+' : ''}{d.change}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </motion.div>
    )
}

// --- SHARED COMPONENTS ---

const GlassCard = ({ children, className = "" }: any) => (
    <motion.div variants={itemVars} className={`bg-card rounded-2xl border border-border p-6 shadow-sm ${className}`}>{children}</motion.div>
)

const SectionHeader = ({ icon: Icon, title, colorClass = "text-primary", bgClass = "bg-primary/10" }: any) => (
    <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${bgClass} ring-1 ring-border/50`}><Icon className={`w-6 h-6 ${colorClass}`} /></div>
        <h2 className="text-xl font-bold text-foreground tracking-wide uppercase">{title}</h2>
    </div>
)

const ProgressBar = ({ value, colorClass = "bg-primary" }: { value: number, colorClass?: string }) => (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${value}%` }} transition={{ duration: 1 }} className={`h-full ${colorClass}`} />
    </div>
)



// --- CONVERSATION SNAPSHOT SECTION (shared by Assessment + Mentorship) ---
export const ConversationSnapshotSection = ({ data }: { data: any }) => {
    const snap = data.conversation_snapshot as any | undefined
    if (!snap) return null
    return (
        <div className="space-y-6">
            {snap.simulation_context && (
                <GlassCard className="border-l-4 border-l-violet-500">
                    <SectionHeader icon={Mic} title="Conversation Snapshot" colorClass="text-violet-500" bgClass="bg-violet-500/10" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest block mb-1">Your Role</span>
                            <p className="text-sm font-medium text-foreground">{snap.simulation_context.your_role}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest block mb-1">AI Role</span>
                            <p className="text-sm font-medium text-foreground">{snap.simulation_context.ai_role}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Scenario Type</span>
                            <p className="text-sm font-medium text-foreground">{snap.simulation_context.scenario_type}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Primary Skill Focus</span>
                            <p className="text-sm font-bold text-indigo-600">{snap.simulation_context.primary_skill_focus}</p>
                        </div>
                    </div>
                    {snap.conversation_flow_overview && (
                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Conversation Flow Overview</span>
                            <p className="text-sm text-foreground/90 leading-relaxed">{snap.conversation_flow_overview}</p>
                        </div>
                    )}
                </GlassCard>
            )}
            {!snap.simulation_context && snap.conversation_flow_overview && (
                <GlassCard className="border-l-4 border-l-violet-500">
                    <SectionHeader icon={Mic} title="Conversation Snapshot" colorClass="text-violet-500" bgClass="bg-violet-500/10" />
                    <p className="text-base text-foreground/90 leading-relaxed">{snap.conversation_flow_overview}</p>
                </GlassCard>
            )}
        </div>
    )
}

// --- IDEAL COACHING QUESTIONS SECTION (with definition + scoring + impact) ---
export const IdealCoachingQuestionsSection = ({ questions }: { questions?: { question: string; definition: string; scoring: string; impact: string }[] }) => {
    if (!questions || questions.length === 0) return null
    return (
        <GlassCard className="border-l-4 border-l-indigo-500">
            <SectionHeader icon={MessageSquare} title="IDEAL COACHING QUESTIONS" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
            <div className="mb-5 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">What Are Ideal Coaching Questions?</span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                    Ideal coaching questions are purposefully crafted, open-ended prompts that guide the coachee to deeper self-reflection, unlock new perspectives, and drive meaningful action. They are non-judgmental, curiosity-driven, and timed to match the conversation's emotional and logical flow.
                </p>
            </div>
            <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">High Impact</span>
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Strategic</span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">Coachee-Centered</span>
            </div>
            <ul className="space-y-4">
                {questions.map((q, i) => (
                    <li key={i} className="flex gap-4 p-4 rounded-xl bg-background border border-border hover:border-indigo-500/30 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border border-indigo-500/20">{i + 1}</div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground italic mb-3">"{q.question}"</p>
                            <div className="grid sm:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Definition</span>
                                    <p className="text-xs text-foreground/90">{q.definition}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Impact</span>
                                    <p className="text-xs text-foreground/90">{q.impact}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold uppercase tracking-wide border border-amber-500/20">
                                    Score: {q.scoring}
                                </span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </GlassCard>
    )
}




const SkillRadarChart = ({ items }: { items: { dimension: string; score: number | string }[] }) => {
    const data = items.map(item => ({
        subject: item.dimension,
        A: typeof item.score === 'number' ? item.score : parseFloat(item.score.split('/')[0]) || 0,
        fullMark: 10
    }))

    return (
        <div className="w-full h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="99%" height="99%" minWidth={10} minHeight={10}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="currentColor" className="text-muted-foreground/20" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                        className="text-muted-foreground"
                    />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#a855f7"
                        fill="#a855f7"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}

export const CompetencyHeatMap = ({ items }: { items: { dimension: string; score: number }[] }) => {
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 ring-emerald-500/30'
        if (score >= 5) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 ring-amber-500/30'
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20 ring-rose-500/30'
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 group hover:shadow-lg transition-all duration-300 ring-1 ${getScoreColor(item.score)}`}
                >
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-center leading-tight">
                        {item.dimension}
                    </div>
                    <div className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform">
                        {item.score}
                    </div>
                    <div className="w-full h-1 bg-current/10 rounded-full mt-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(item.score / 10) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-current"
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    )
}


const QuantitativeAnalyticsSection = ({ data }: { data: QuantitativeAnalytics }) => (
    <GlassCard>
        <SectionHeader icon={Activity} title="Quantitative Analytics" colorClass="text-sky-500" bgClass="bg-sky-500/10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-background rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-3xl font-black text-sky-500 mb-1">{data.coaching_questions || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coaching Questions</span>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-3xl font-black text-rose-400 mb-1">{data.empathy_statements || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Empathy Statements</span>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-3xl font-black text-emerald-500 mb-1">{data.action_items || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action Items</span>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-3xl font-black text-amber-500 mb-1">{data.clarifying_questions || 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clarifying Questions</span>
            </div>
            {data.user_talk_time_percentage !== undefined && (
                <div className="bg-background rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-3xl font-black text-indigo-500 mb-1">{data.user_talk_time_percentage}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Talk Time</span>
                </div>
            )}
        </div>
    </GlassCard>
)

export const ScorecardSection = ({ items }: { items: ScorecardItem[] }) => (
    <GlassCard>
        <SectionHeader icon={Target} title="AI Assessment Scorecard" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />

        {/* Radar Chart Visualization */}
        <SkillRadarChart items={items} />

        <div className="space-y-8">
            {items?.map((item, i) => {
                const scoreLabel = typeof item.score === 'number' ? `${item.score}/10` : String(item.score || '0/10')
                const numScore = parseFloat(scoreLabel.split('/')[0] || "0")
                const color = numScore >= 8 ? 'bg-emerald-500' : numScore >= 5 ? 'bg-amber-500' : 'bg-rose-500'

                return (
                    <div key={i} className="group border-b border-border/50 last:border-0 pb-8 last:pb-0">
                        {/* Header: Dimension + Score */}
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{item.dimension}</h3>
                            <span className={`font-mono font-black text-2xl ${numScore >= 8 ? 'text-emerald-500' : numScore >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>{scoreLabel}</span>
                        </div>

                        <ProgressBar value={numScore * 10} colorClass={color} />

                        <div className="mt-5 space-y-4">
                            {/* RUBRIC */}
                            {item.rubric_criteria && (
                                <div className="bg-muted/10 rounded-xl p-4 border border-border/30">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5" /> Scoring Rubric
                                    </span>
                                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                                        {item.rubric_criteria}
                                    </p>
                                </div>
                            )}

                            {/* PROOF / REASONING */}
                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Proof of Marks</span>
                                <p className="text-sm text-foreground leading-relaxed">
                                    {item.reasoning || item.description}
                                </p>
                                {item.quote && (
                                    <div className="mt-3 flex gap-2 text-sm text-muted-foreground/80 italic">
                                        <Quote className="w-4 h-4 shrink-0 opacity-50" />
                                        <span>"{item.quote}"</span>
                                    </div>
                                )}
                            </div>

                            {/* SUGGESTION */}
                            {item.suggestion && (
                                <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30" />
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Lightbulb className="w-3.5 h-3.5" /> Suggestion
                                    </span>
                                    <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                                        {item.suggestion}
                                    </p>
                                </div>
                            )}

                            {/* ALTERNATIVE QUESTIONS */}
                            {item.alternative_questions && item.alternative_questions.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-2">Try asking instead:</p>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {item.alternative_questions.map((aq, idx) => (
                                            <div key={idx} className="p-3 bg-background rounded-lg border border-border text-xs shadow-sm">
                                                <span className="font-semibold text-primary block mb-1">"{aq.question}"</span>
                                                <span className="text-muted-foreground text-[10px] uppercase tracking-wide opacity-80">{aq.rationale}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    </GlassCard>
)

// --- VIEW COMPONENTS ---

// ── Shared about block ──────────────────────────────────────────────
const AboutCoActAI = ({ text }: { text?: string }) => (
    <GlassCard className="border-l-4 border-l-slate-400">
        <SectionHeader icon={BookOpen} title="About CoAct.AI" colorClass="text-slate-500" bgClass="bg-slate-500/10" />
        <blockquote className="mt-4 border-l-2 border-slate-400/40 pl-4 text-sm text-foreground/75 italic leading-relaxed">
            {text || "CoAct.AI is an advanced simulation platform designed to provide hyper-realistic, AI-driven roleplay scenarios. It evaluates communication, behavioral patterns, and performance in critical situations. By leveraging cutting-edge AI, CoAct.AI offers objective analysis, helping professionals identify blind spots, hone their skills, and develop actionable strategies for growth."}
        </blockquote>
    </GlassCard>
)

// --- MENTORSHIP REFLECTION VIEW ---
const MentorshipReflectionView = ({ data }: { data: MentorshipReflectionData }) => {

    const d = data as any

    return (
        <div className="space-y-8">

            {/* 1 — Mentorship Focus */}
            {d.mentorship_focus && (
                <GlassCard className="border-l-4 border-l-purple-500">
                    <SectionHeader icon={Target} title="Mentorship Focus" colorClass="text-purple-500" bgClass="bg-purple-500/10" />
                    <p className="mt-3 text-base font-medium text-foreground/90 leading-relaxed">{d.mentorship_focus}</p>
                </GlassCard>
            )}

            {/* 2 — Executive Summary */}
            {d.executive_summary && (
                <GlassCard className="border-l-4 border-l-blue-500">
                    <SectionHeader icon={Activity} title="Executive Summary" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    <p className="mt-3 text-[15px] text-foreground/85 leading-relaxed">{d.executive_summary}</p>
                </GlassCard>
            )}

            {/* 3 — About CoAct.AI */}
            <AboutCoActAI text={d.about_coactai} />

            {/* 4 — How the AI Approached the Conversation */}
            {d.how_ai_approached && (
                <GlassCard className="border-l-4 border-l-indigo-500">
                    <SectionHeader icon={Brain} title="How the AI Approached the Conversation" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
                    <p className="mt-3 text-[14px] text-foreground/80 leading-relaxed whitespace-pre-line">{d.how_ai_approached}</p>
                </GlassCard>
            )}

            {/* 5 — How You Responded */}
            {d.how_you_responded && (
                <GlassCard className="border-l-4 border-l-amber-500">
                    <SectionHeader icon={MessageSquare} title="How You Responded" colorClass="text-amber-500" bgClass="bg-amber-500/10" />
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'opening_approach', label: 'Opening Approach' },
                            { key: 'handling_pushback', label: 'Handling Pushback' },
                            { key: 'depth_of_engagement', label: 'Depth of Engagement' },
                            { key: 'closing_the_conversation', label: 'Closing the Conversation' },
                        ].map(({ key, label }) =>
                            d.how_you_responded[key] ? (
                                <div key={key} className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-2">{label}</span>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{d.how_you_responded[key]}</p>
                                </div>
                            ) : null
                        )}
                    </div>
                </GlassCard>
            )}

            {/* 6 — What Went Well + Where You Can Grow */}
            {(d.what_went_well?.length || d.where_you_can_grow?.length) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {d.what_went_well && d.what_went_well.length > 0 && (
                        <GlassCard className="h-full border-t-4 border-t-emerald-500">
                            <SectionHeader icon={CheckCircle2} title="What Went Well" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                            <ul className="mt-4 space-y-3">
                                {d.what_went_well.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/85 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{item.replace(/^\+\s*/, '')}</span>
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    )}
                    {d.where_you_can_grow && d.where_you_can_grow.length > 0 && (
                        <GlassCard className="h-full border-t-4 border-t-rose-500">
                            <SectionHeader icon={TrendingUp} title="Where You Can Grow" colorClass="text-rose-500" bgClass="bg-rose-500/10" />
                            <ul className="mt-4 space-y-3">
                                {d.where_you_can_grow.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/85 bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                                        <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span>{item.replace(/^-\s*/, '')}</span>
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* 7 — Suggested Approach for Next Assessment */}
            {d.suggested_approach_for_next_assessment && d.suggested_approach_for_next_assessment.length > 0 && (
                <GlassCard className="border-l-4 border-l-violet-500">
                    <SectionHeader icon={Lightbulb} title="Suggested Approach for Your Next Assessment" colorClass="text-violet-500" bgClass="bg-violet-500/10" />
                    <ol className="mt-4 space-y-4">
                        {d.suggested_approach_for_next_assessment.map((item: any, i: number) => (
                            <li key={i} className="flex gap-4 p-4 bg-violet-500/5 border border-violet-500/15 rounded-xl">
                                <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-600 flex items-center justify-center text-xs font-black shrink-0 border border-violet-500/25">{i + 1}</div>
                                <div>
                                    {item.step && <span className="text-[11px] font-bold uppercase tracking-widest text-violet-500 block mb-1">{item.step}</span>}
                                    <p className="text-sm text-foreground/85 leading-relaxed">{item.instruction || item}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </GlassCard>
            )}

            {/* 8 — Questions to Reflect On */}
            {d.questions_to_reflect_on && d.questions_to_reflect_on.length > 0 && (
                <GlassCard className="border-l-4 border-l-slate-500">
                    <SectionHeader icon={HelpCircle} title="Questions to Reflect On" colorClass="text-slate-500" bgClass="bg-slate-500/10" />
                    <ul className="mt-4 space-y-3">
                        {d.questions_to_reflect_on.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-foreground/80 items-start">
                                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <span>{q}</span>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}

            {/* 9 — What to Expect in Your Next Assessment */}
            {d.what_to_expect_in_next_assessment && (
                <GlassCard className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
                    <SectionHeader icon={Zap} title="What to Expect in Your Next Assessment" colorClass="text-primary" bgClass="bg-primary/10" />
                    <p className="mt-3 text-[14px] text-foreground/85 leading-relaxed">{d.what_to_expect_in_next_assessment}</p>
                </GlassCard>
            )}
        </div>
    )
}

// --- ASSESSMENT REPORT VIEW ---
const SimulationView = ({ data }: { data: SimulationReportData }) => {
    const d = data as any

    // Scorecard items — prefer participant_performance over scorecard
    const scorecardItems: ScorecardItem[] = d.participant_performance || d.scorecard || []

    // Parse overall score as number for display
    const overallScore: string = d.coaching_efficacy?.score
        || d.assessment_results?.overall_score
        || d.meta?.overall_grade
        || '—'

    const scoreNum = parseFloat(overallScore)

    const scoreColor = isNaN(scoreNum)
        ? 'text-muted-foreground'
        : scoreNum >= 7 ? 'text-emerald-500'
        : scoreNum >= 5 ? 'text-amber-500'
        : 'text-rose-500'

    return (
        <div className="space-y-8">

            {/* ── [C] COACHING EFFICACY banner ── */}
            {(d.coaching_efficacy || d.meta?.overall_grade) && (
                <GlassCard className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
                    <div className="flex items-start gap-6">
                        <div className="shrink-0 text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">[C] Coaching Efficacy</span>
                            <span className={`text-5xl font-black leading-none ${scoreColor}`}>{overallScore}</span>
                        </div>
                        <div className="flex-1 pt-1">
                            <SectionHeader icon={Award} title="Coaching Efficacy" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                            {d.coaching_efficacy?.summary && (
                                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{d.coaching_efficacy.summary}</p>
                            )}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* ── Executive Summary ── */}
            {d.executive_summary && (
                <GlassCard className="border-l-4 border-l-primary">
                    <SectionHeader icon={Activity} title="Executive Summary" colorClass="text-primary" bgClass="bg-primary/10" />
                    <p className="mt-3 text-[15px] text-foreground/85 leading-relaxed">
                        {typeof d.executive_summary === 'string' ? d.executive_summary : d.executive_summary.snapshot}
                    </p>
                </GlassCard>
            )}

            {/* ── About CoAct.AI ── */}
            <AboutCoActAI text={d.about_coactai} />

            {/* ── Assessment Objectives ── */}
            {d.assessment_objectives && d.assessment_objectives.length > 0 && (
                <GlassCard className="border-l-4 border-l-blue-500">
                    <SectionHeader icon={Target} title="Assessment Objectives" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    <ul className="mt-4 space-y-2">
                        {d.assessment_objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-foreground/85">
                                <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                                <span>{obj}</span>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}

            {/* ── Assessment Methodology ── */}
            {d.assessment_methodology && (
                <GlassCard className="border-l-4 border-l-slate-400">
                    <SectionHeader icon={BookOpen} title="Assessment Methodology" colorClass="text-slate-500" bgClass="bg-slate-500/10" />
                    <blockquote className="mt-3 border-l-2 border-slate-400/40 pl-4 text-sm text-foreground/75 italic leading-relaxed">
                        {d.assessment_methodology}
                    </blockquote>
                </GlassCard>
            )}

            {/* ── Role-Based Assessment ── */}
            {d.role_based_assessment && (
                <GlassCard className="border-l-4 border-l-indigo-500">
                    <SectionHeader icon={Brain} title="Role-Based Assessment" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
                    <div className="mt-4 space-y-5">
                        {d.role_based_assessment.role_assigned && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-1">Role Assigned</span>
                                <p className="text-sm font-semibold text-foreground">{d.role_based_assessment.role_assigned}</p>
                            </div>
                        )}
                        {d.role_based_assessment.scenario && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-1">Scenario</span>
                                <p className="text-sm text-foreground/80 leading-relaxed">{d.role_based_assessment.scenario}</p>
                            </div>
                        )}
                        {(d.role_based_assessment.your_objectives || d.role_based_assessment.tasks) && (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {d.role_based_assessment.your_objectives?.length > 0 && (
                                    <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-2">Your Objectives</span>
                                        <ul className="space-y-1.5">
                                            {d.role_based_assessment.your_objectives.map((o: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                                    <span className="text-indigo-400 shrink-0">{i + 1}.</span>{o}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {d.role_based_assessment.tasks?.length > 0 && (
                                    <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-2">Tasks</span>
                                        <ul className="space-y-1.5">
                                            {d.role_based_assessment.tasks.map((t: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />{t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        {d.role_based_assessment.expected_behavior && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-1">Expected Behavior</span>
                                <p className="text-sm text-foreground/80 leading-relaxed">{d.role_based_assessment.expected_behavior}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* ── Participant Performance (radar + per-dimension cards) ── */}
            {scorecardItems.length > 0 && (
                <GlassCard>
                    <SectionHeader icon={Target} title="Participant Performance" colorClass="text-purple-500" bgClass="bg-purple-500/10" />

                    {/* Radar chart */}
                    {d.radar_chart_data && d.radar_chart_data.length > 0 && (
                        <div className="my-6 flex justify-center">
                            <div className="w-full max-w-md h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={d.radar_chart_data}>
                                        <PolarGrid stroke="rgba(139,92,246,0.15)" />
                                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                                        <Radar name="Score" dataKey="score" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Per-dimension cards */}
                    <div className="space-y-4 mt-2">
                        {scorecardItems.map((item, i) => {
                            const scoreVal = parseFloat(String(item.score))
                            const dimColor = isNaN(scoreVal) ? 'border-slate-400 text-slate-500'
                                : scoreVal >= 7 ? 'border-emerald-500 text-emerald-500'
                                : scoreVal >= 5 ? 'border-amber-500 text-amber-500'
                                : 'border-rose-500 text-rose-500'
                            const bgTint = isNaN(scoreVal) ? 'bg-slate-500/5'
                                : scoreVal >= 7 ? 'bg-emerald-500/5'
                                : scoreVal >= 5 ? 'bg-amber-500/5'
                                : 'bg-rose-500/5'
                            return (
                                <div key={i} className={`rounded-xl border-l-4 p-5 ${bgTint} ${dimColor.split(' ')[0]}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-base text-foreground">{item.dimension}</h4>
                                        <span className={`text-xl font-black ${dimColor.split(' ')[1]}`}>{item.score}</span>
                                    </div>
                                    {(item.reasoning || (item as any).description) && (
                                        <div className="mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Reasoning</span>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{item.reasoning || (item as any).description}</p>
                                        </div>
                                    )}
                                    {item.quote && (
                                        <div className="mb-3 flex gap-2 text-sm text-foreground/70 bg-background/60 rounded-lg border border-border/50 p-3 italic">
                                            <Quote className="w-4 h-4 shrink-0 opacity-40 mt-0.5" />
                                            <span>"{item.quote}"</span>
                                        </div>
                                    )}
                                    {item.suggestion && (
                                        <div className="flex gap-2 text-sm">
                                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <span className="text-foreground/85 leading-relaxed">{item.suggestion}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
            )}

            {/* ── Assessment Results ── */}
            {d.assessment_results && (
                <GlassCard className="border-l-4 border-l-emerald-500">
                    <SectionHeader icon={CheckCircle2} title="Assessment Results" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                    <div className="mt-4 space-y-6">
                        {d.assessment_results.overall_score && (
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Score</span>
                                <span className={`text-3xl font-black ${scoreColor}`}>{d.assessment_results.overall_score}</span>
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {d.assessment_results.strengths_identified?.length > 0 && (
                                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-2">Strengths Identified</span>
                                    <ul className="space-y-2">
                                        {d.assessment_results.strengths_identified.map((s: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-foreground/85">
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{s.replace(/^\+\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {d.assessment_results.areas_for_improvement?.length > 0 && (
                                <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-2">Areas for Improvement</span>
                                    <ul className="space-y-2">
                                        {d.assessment_results.areas_for_improvement.map((a: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-foreground/85">
                                                <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                <span>{a.replace(/^-\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {d.assessment_results.overall_assessment && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Overall Assessment</span>
                                <p className="text-sm text-foreground/80 leading-relaxed">{d.assessment_results.overall_assessment}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* ── Conclusion ── */}
            {d.conclusion && (
                <GlassCard className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
                    <SectionHeader icon={Zap} title="Conclusion" colorClass="text-primary" bgClass="bg-primary/10" />
                    <p className="mt-3 text-[14px] text-foreground/85 leading-relaxed">{d.conclusion}</p>
                </GlassCard>
            )}

            {/* ── Quantitative Analytics (if present) ── */}
            {data.quantitative_analytics && (
                <QuantitativeAnalyticsSection data={data.quantitative_analytics} />
            )}
        </div>
    )
}

