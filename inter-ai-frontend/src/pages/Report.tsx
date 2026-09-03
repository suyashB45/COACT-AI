"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Download, AlertCircle, Target, History, Award, BookOpen, MessageSquare, ChevronRight, Check, X, ArrowLeft, ArrowRight, Clock, CheckCircle2, Brain, Quote, Lightbulb, Activity, Mic, TrendingUp, Zap, HelpCircle } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { useQuery } from "@tanstack/react-query"

import Navigation from "../components/landing/Navigation"
import { getApiUrl, getAuthHeaders, safeJson } from "@/lib/api"
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

interface TimingData {
    duration?: string
    start_time?: string
    end_time?: string
    conversation_turns?: number
    speaker_distribution?: string
}

interface ConversationSnapshot {
    primary_topic?: string
    key_objectives?: string[]
    main_challenges?: string[]
    summary?: string
    key_themes?: string[]
}

interface ExecutiveDashboard {
    session_duration?: string
    key_themes?: number
    strength_areas?: number
    missed_opportunities?: number
    coaching_opportunities?: number
    recommended_actions?: number
}

interface CoachingEfficacyDimension {
    score: number
    label?: string
}

interface HeatMapSegment {
    label: string
    intensity: number[]
}

interface SkillGroup {
    [key: string]: number | undefined
    clarity?: number
    active_listening?: number
    articulation?: number
    questioning?: number
    decision_making?: number
    accountability?: number
    delegation?: number
    conflict_management?: number
    empathy?: number
    collaboration?: number
    emotional_awareness?: number
}

interface GoalItem {
    goal: string
    evidence: string
    status: 'Achieved' | 'Partially Achieved' | 'Not Addressed' | string
}

interface ScorecardDimension {
    dimension: string
    score: number | string
    interpretation: string
}

interface BehaviourEvidence {
    score: number | string
    evidence: string
}

interface EQDimension {
    score: number | string
    evidence: string
    improvement: string
}

interface IdealQuestion {
    question: string
    definition: string
    impact: string
    impact_score?: number | string
    scoring?: string
}

interface ActionPlanItem {
    action: string
    why_it_matters: string
    success_indicator: string
    priority: 'High' | 'Medium' | 'Low' | string
}

interface SimulationReportData extends GenericReportData {
    timing?: TimingData;
    conversation_snapshot?: ConversationSnapshot;
    executive_dashboard?: ExecutiveDashboard;
    coaching_efficacy?: {
        dimensions: Record<string, CoachingEfficacyDimension>;
        score?: string
        summary?: string
    };
    heat_map?: {
        dimensions: string[]
        segments: HeatMapSegment[]
    };
    skill_visualization?: {
        communication: SkillGroup
        leadership: SkillGroup
        interpersonal: SkillGroup
    };
    goal_attainment?: GoalItem[];
    performance_scorecard?: {
        dimensions: ScorecardDimension[]
        overall_performance: string
        scoring_methodology: string
    };
    deep_dive_analysis?: {
        communication_style: {
            observed_style?: string
            clarity?: string
            directness?: string
            conciseness?: string
            assertiveness?: string
            listening?: string
            questioning?: string
            adaptability?: string
            strength?: string
            development_area?: string
        };
        behaviour_analysis: Record<string, BehaviourEvidence>;
        emotional_intelligence: {
            self_awareness: EQDimension
            self_regulation: EQDimension
            empathy: EQDimension
            social_awareness: EQDimension
            relationship_management: EQDimension
        };
    };
    strengths_and_opportunities?: {
        strengths: string[]
        missed_opportunities: string[]
    };
    ideal_coaching_questions?: IdealQuestion[];
    action_plan?: ActionPlanItem[];
    quantitative_analytics?: QuantitativeAnalytics;
    scorecard?: ScorecardItem[]; // using existing
    participant_performance?: ScorecardItem[];
    missed_opportunities?: string[];
    follow_up_strategy?: FollowUpStrategy;
    strengths_and_improvements?: { strengths: string[]; missed_opportunities: string[] };
    final_evaluation?: FinalEvaluation;
    coaching_style?: { primary_style: string; description: string };
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
    timing?: {
        duration?: string;
        start_time?: string;
        end_time?: string;
    };
    conversation_snapshot?: {
        primary_topic?: string;
        main_objective?: string;
        key_topics?: string[];
        summary?: string;
    };
    executive_dashboard?: {
        main_goal?: string;
        topics_discussed?: string[];
        key_insights?: string[];
        development_areas?: string[];
        key_actions?: string[];
    };
    mentorship_focus?: string;
    goal_progress?: {
        goal?: string;
        progress_observed?: string;
        current_situation?: string;
        what_remains?: string;
    }[];
    skill_development?: {
        skill?: string;
        current_observation?: string;
        development_direction?: string;
    }[];
    mentor_guidance?: {
        advice_given?: string[];
        recommendations?: string[];
        explanations?: string[];
        examples_provided?: string[];
        resources_suggested?: string[];
        additional_guidance_needed?: string[];
    };
    mentee_reflection?: {
        concerns_expressed?: string[];
        challenges_identified?: string[];
        self_reflections?: string[];
        questions_raised?: string[];
        areas_of_uncertainty?: string[];
        key_realizations?: string[];
    };
    strengths_and_development?: {
        strengths?: string[];
        development_opportunities?: string[];
    };
    key_insights?: string[];
    recommended_mentorship_questions?: string[];
    action_plan?: {
        action?: string;
        purpose?: string;
        expected_outcome?: string;
    }[];
    next_mentorship_focus?: {
        progress_review?: string;
        unresolved_challenges?: string;
        new_development_areas?: string;
        follow_up_on_previous_actions?: string;
        next_milestone?: string;
    };
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
            
            return safeJson(response);
        },
        enabled: !!sessionId,
        retry: (failureCount, error) => {
            if (error.message === "Report not ready" && failureCount < 30) {
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
            || data.type === 'mentorship_report'
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
                                        {(data.meta.session_mode === 'mentorship' || data.type === 'mentorship_report' || data.type === 'mentorship_reflection' || data.meta?.scenario_type?.toLowerCase().includes('mentorship')) ? 'Mentorship Report' : 'Session Analysis'}
                                    </h1>
                                    {(data.meta.session_mode === 'mentorship' || data.type === 'mentorship_report' || data.type === 'mentorship_reflection' || data.meta?.scenario_type?.toLowerCase().includes('mentorship')) ? (
                                        <p className="text-lg text-muted-foreground italic">This report captures the mentorship conversation, the guidance explored, and the development focus for the next session.</p>
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
                    {data.meta.session_mode !== 'mentorship' && !data.meta?.scenario_type?.toLowerCase().includes('mentorship') && (data.meta.emotional_trajectory || data.meta.session_quality || data.meta.key_themes) && <div className="grid md:grid-cols-3 gap-6">
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
export const IdealCoachingQuestionsSection = ({ questions }: { questions?: IdealQuestion[] }) => {
    if (!questions || questions.length === 0) return null
    const impactOf = (q: IdealQuestion) => {
        if (q.impact_score !== undefined && q.impact_score !== null) return `${parseInt(String(q.impact_score).split('/')[0]) || 0}/10`
        return q.scoring || '—'
    }
    return (
        <GlassCard className="border-l-4 border-l-indigo-500">
            <SectionHeader icon={MessageSquare} title="11. Ideal Coaching Questions" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
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
                                    Impact: {impactOf(q)}
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

// --- MENTORSHIP REFLECTION VIEW ---
const MentorshipReflectionView = ({ data }: { data: MentorshipReflectionData }) => {

    const d = data as any

    const renderItems = (items: any, Icon: any, color = 'text-slate-500') => (
        <ul className="mt-4 space-y-3">
            {(Array.isArray(items) ? items : items ? [items] : []).map((item: any, i: number) => (
                <li key={i} className={`flex gap-3 text-sm text-foreground/85 ${color} rounded-xl p-3 border bg-background/40`}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                    <span className="text-foreground/80">{item}</span>
                </li>
            ))}
        </ul>
    )

    const renderSlots = (obj: any, slots: { key: string; label: string; color: string }[]) => (
        <div className="mt-4 grid sm:grid-cols-1 gap-4">
            {slots.map(({ key, label, color }) => obj?.[key] ? (
                <div key={key} className={`rounded-xl ${color} p-4`}>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1.5">{label}</span>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{obj[key]}</p>
                </div>
            ) : null)}
        </div>
    )

    return (
        <div className="space-y-8">

            {/* 1 — Timing */}
            {d.timing && (
                <GlassCard className="border-l-4 border-l-blue-500">
                    <SectionHeader icon={Clock} title="1. Timing" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    <div className="mt-4 grid sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Session Duration', value: d.timing.duration },
                            { label: 'Start Time', value: d.timing.start_time },
                            { label: 'End Time', value: d.timing.end_time },
                        ].map(({ label, value }) => value ? (
                            <div key={label} className="rounded-xl bg-blue-500/5 border border-blue-500/15 p-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-1.5">{label}</span>
                                <p className="text-sm font-bold text-foreground">{value}</p>
                            </div>
                        ) : null)}
                    </div>
                </GlassCard>
            )}

            {/* 2 — Conversation Snapshot */}
            {d.conversation_snapshot && (
                <GlassCard className="border-l-4 border-l-purple-500">
                    <SectionHeader icon={MessageSquare} title="2. Conversation Snapshot" colorClass="text-purple-500" bgClass="bg-purple-500/10" />
                    <div className="mt-4 space-y-4">
                        {d.conversation_snapshot.primary_topic && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-1">What Was Discussed</span>
                                <p className="text-sm text-foreground/85 leading-relaxed">{d.conversation_snapshot.primary_topic}</p>
                            </div>
                        )}
                        {d.conversation_snapshot.main_objective && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-1">Main Objective</span>
                                <p className="text-sm text-foreground/85 leading-relaxed">{d.conversation_snapshot.main_objective}</p>
                            </div>
                        )}
                        {d.conversation_snapshot.key_topics && d.conversation_snapshot.key_topics.length > 0 && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-1">Key Topics Covered</span>
                                <div className="flex flex-wrap gap-2">
                                    {d.conversation_snapshot.key_topics.map((t: string, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-500/20">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {d.conversation_snapshot.summary && (
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Overall Summary</span>
                                <p className="text-sm text-foreground/80 leading-relaxed">{d.conversation_snapshot.summary}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* 3 — Executive Dashboard (no scores) */}
            {d.executive_dashboard && (
                <GlassCard className="border-l-4 border-l-emerald-500">
                    <SectionHeader icon={Activity} title="3. Executive Dashboard" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                    {d.executive_dashboard.main_goal && (
                        <div className="mt-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Main Goal</span>
                            <p className="text-sm text-foreground/85 leading-relaxed">{d.executive_dashboard.main_goal}</p>
                        </div>
                    )}
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Topics Discussed', value: d.executive_dashboard.topics_discussed, Icon: MessageSquare },
                            { label: 'Key Insights', value: d.executive_dashboard.key_insights, Icon: Lightbulb },
                            { label: 'Development Areas', value: d.executive_dashboard.development_areas, Icon: TrendingUp },
                            { label: 'Key Actions', value: d.executive_dashboard.key_actions, Icon: CheckCircle2 },
                        ].map(({ label, value, Icon }) => value && (Array.isArray(value) ? value.length > 0 : true) ? (
                            <div key={label} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-2">{label}</span>
                                {Array.isArray(value) ? (
                                    <ul className="space-y-1.5">
                                        {value.map((v: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                                <Icon className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                                                <span>{v}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
                                )}
                            </div>
                        ) : null)}
                    </div>
                </GlassCard>
            )}

            {/* 4 — Mentorship Focus */}
            {d.mentorship_focus && (
                <GlassCard className="border-l-4 border-l-blue-500">
                    <SectionHeader icon={Target} title="4. Mentorship Focus" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    <p className="mt-3 text-base font-medium text-foreground/90 leading-relaxed">{d.mentorship_focus}</p>
                </GlassCard>
            )}

            {/* 5 — Goal Progress */}
            {d.goal_progress && d.goal_progress.length > 0 && (
                <GlassCard className="border-l-4 border-l-emerald-500">
                    <SectionHeader icon={TrendingUp} title="5. Goal Progress" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                    <div className="mt-4 space-y-6">
                        {d.goal_progress.map((gp: any, i: number) => (
                            <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-black border border-emerald-500/25">{i + 1}</span>
                                    <span className="text-sm font-bold text-foreground">{gp.goal}</span>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {[
                                        { label: 'Progress Observed', value: gp.progress_observed },
                                        { label: 'Current Situation', value: gp.current_situation },
                                        { label: 'What Remains', value: gp.what_remains },
                                    ].map(({ label, value }) => value ? (
                                        <div key={label}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">{label}</span>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
                                        </div>
                                    ) : null)}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* 6 — Skill Development */}
            {d.skill_development && d.skill_development.length > 0 && (
                <GlassCard className="border-l-4 border-l-purple-500">
                    <SectionHeader icon={BookOpen} title="6. Skill Development" colorClass="text-purple-500" bgClass="bg-purple-500/10" />
                    <div className="mt-4 space-y-4">
                        {d.skill_development.map((sk: any, i: number) => (
                            <div key={i} className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-4">
                                <span className="text-sm font-bold text-foreground block mb-3">{sk.skill}</span>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {sk.current_observation && (
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-1">Current Observation</span>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{sk.current_observation}</p>
                                        </div>
                                    )}
                                    {sk.development_direction && (
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Development Direction</span>
                                            <p className="text-sm text-foreground/80 leading-relaxed">{sk.development_direction}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* 7 — Mentor Guidance */}
            {d.mentor_guidance && (
                <GlassCard className="border-l-4 border-l-indigo-500">
                    <SectionHeader icon={Brain} title="7. Mentor Guidance" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Advice Given', value: d.mentor_guidance.advice_given, Icon: CheckCircle2 },
                            { label: 'Recommendations', value: d.mentor_guidance.recommendations, Icon: Lightbulb },
                            { label: 'Explanations', value: d.mentor_guidance.explanations, Icon: BookOpen },
                            { label: 'Examples Provided', value: d.mentor_guidance.examples_provided, Icon: MessageSquare },
                            { label: 'Resources Suggested', value: d.mentor_guidance.resources_suggested, Icon: BookOpen },
                            { label: 'Additional Guidance That May Be Useful', value: d.mentor_guidance.additional_guidance_needed, Icon: TrendingUp },
                        ].map(({ label, value, Icon }) => value && (Array.isArray(value) ? value.length > 0 : true) ? (
                            <div key={label} className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-2">{label}</span>
                                {renderItems(Array.isArray(value) ? value : [value], Icon)}
                            </div>
                        ) : null)}
                    </div>
                </GlassCard>
            )}

            {/* 8 — Mentee Reflection */}
            {d.mentee_reflection && (
                <GlassCard className="border-l-4 border-l-amber-500">
                    <SectionHeader icon={MessageSquare} title="8. Mentee Reflection" colorClass="text-amber-500" bgClass="bg-amber-500/10" />
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Concerns Expressed', value: d.mentee_reflection.concerns_expressed, Icon: AlertCircle },
                            { label: 'Challenges Identified', value: d.mentee_reflection.challenges_identified, Icon: AlertCircle },
                            { label: 'Self-Reflections', value: d.mentee_reflection.self_reflections, Icon: Brain },
                            { label: 'Questions Raised', value: d.mentee_reflection.questions_raised, Icon: HelpCircle },
                            { label: 'Areas of Uncertainty', value: d.mentee_reflection.areas_of_uncertainty, Icon: HelpCircle },
                            { label: 'Key Realizations', value: d.mentee_reflection.key_realizations, Icon: Zap },
                        ].map(({ label, value, Icon }) => value && (Array.isArray(value) ? value.length > 0 : true) ? (
                            <div key={label} className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-2">{label}</span>
                                <ul className="space-y-1.5">
                                    {(Array.isArray(value) ? value : [value]).map((v: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                            <Icon className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                                            <span>{v}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null)}
                    </div>
                </GlassCard>
            )}

            {/* 9 — Strengths & Development Opportunities */}
            {d.strengths_and_development && (d.strengths_and_development.strengths?.length || d.strengths_and_development.development_opportunities?.length) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {d.strengths_and_development.strengths && d.strengths_and_development.strengths.length > 0 && (
                        <GlassCard className="h-full border-t-4 border-t-emerald-500">
                            <SectionHeader icon={CheckCircle2} title="Strengths" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                            <ul className="mt-4 space-y-3">
                                {d.strengths_and_development.strengths.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/85 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    )}
                    {d.strengths_and_development.development_opportunities && d.strengths_and_development.development_opportunities.length > 0 && (
                        <GlassCard className="h-full border-t-4 border-t-rose-500">
                            <SectionHeader icon={TrendingUp} title="Development Opportunities" colorClass="text-rose-500" bgClass="bg-rose-500/10" />
                            <ul className="mt-4 space-y-3">
                                {d.strengths_and_development.development_opportunities.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/85 bg-rose-500/5 border border-rose-500/15 rounded-xl p-3">
                                        <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* 10 — Key Insights */}
            {d.key_insights && d.key_insights.length > 0 && (
                <GlassCard className="border-l-4 border-l-blue-500">
                    <SectionHeader icon={Lightbulb} title="10. Key Insights" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                    {renderItems(d.key_insights, Lightbulb, 'bg-blue-500/5 border-blue-500/15')}
                </GlassCard>
            )}

            {/* 11 — Recommended Mentorship Questions */}
            {d.recommended_mentorship_questions && d.recommended_mentorship_questions.length > 0 && (
                <GlassCard className="border-l-4 border-l-indigo-500">
                    <SectionHeader icon={HelpCircle} title="11. Recommended Mentorship Questions" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-500">Useful questions for the next mentorship conversation</p>
                    <ul className="mt-3 space-y-3">
                        {d.recommended_mentorship_questions.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-foreground/80 items-start">
                                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span>{q}</span>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}

            {/* 12 — Action Plan */}
            {d.action_plan && d.action_plan.length > 0 && (
                <GlassCard className="border-l-4 border-l-emerald-500">
                    <SectionHeader icon={CheckCircle2} title="12. Action Plan" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-emerald-500/20">
                                    <th className="py-2 pr-4 text-[10px] font-black uppercase tracking-widest text-emerald-600">Action</th>
                                    <th className="py-2 pr-4 text-[10px] font-black uppercase tracking-widest text-emerald-600">Purpose</th>
                                    <th className="py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">Expected Outcome</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.action_plan.map((a: any, i: number) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="py-2.5 pr-4 font-semibold text-foreground/90">{a.action}</td>
                                        <td className="py-2.5 pr-4 text-foreground/75">{a.purpose}</td>
                                        <td className="py-2.5 text-foreground/75">{a.expected_outcome}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}

            {/* 13 — Next Mentorship Focus */}
            {d.next_mentorship_focus && (
                <GlassCard className="bg-primary/5 border-primary/20 border-l-4 border-l-primary">
                    <SectionHeader icon={Zap} title="13. Next Mentorship Focus" colorClass="text-primary" bgClass="bg-primary/10" />
                    {renderSlots(d.next_mentorship_focus, [
                        { key: 'progress_review', label: 'Progress Review', color: 'bg-sky-500/5 border border-sky-500/15' },
                        { key: 'unresolved_challenges', label: 'Unresolved Challenges', color: 'bg-rose-500/5 border border-rose-500/15' },
                        { key: 'new_development_areas', label: 'New Development Areas', color: 'bg-purple-500/5 border border-purple-500/15' },
                        { key: 'follow_up_on_previous_actions', label: 'Follow-Up on Previous Actions', color: 'bg-amber-500/5 border border-amber-500/15' },
                        { key: 'next_milestone', label: 'Next Milestone', color: 'bg-emerald-500/5 border border-emerald-500/15' },
                    ])}
                </GlassCard>
            )}
        </div>
    )
}

// --- ASSESSMENT REPORT VIEW ---
const SimulationView = ({ data }: { data: SimulationReportData }) => {
    const d = data as any

    return (
        <div className="space-y-10">
            {/* ═══════════════ 1. TIMING ═══════════════ */}
            {d.timing && (
                <TimingSection timing={d.timing} />
            )}

            {/* ═══════════════ 2. CONVERSATION SNAPSHOT ═══════════════ */}
            {d.conversation_snapshot && (
                <ConversationSnapshotSection2 snapshot={d.conversation_snapshot} />
            )}

            {/* ═══════════════ 3. EXECUTIVE DASHBOARD ═══════════════ */}
            {d.executive_dashboard && (
                <ExecutiveDashboardSection dashboard={d.executive_dashboard} />
            )}

            {/* ═══════════════ 4. COACHING EFFICACY ═══════════════ */}
            {d.coaching_efficacy?.dimensions && (
                <CoachingEfficacySection efficacy={d.coaching_efficacy} />
            )}

            {/* ═══════════════ 5. HEAT MAP ═══════════════ */}
            {d.heat_map && (
                <HeatMapSection heatMap={d.heat_map} />
            )}

            {/* ═══════════════ 6. SKILL VISUALIZATION ═══════════════ */}
            {d.skill_visualization && (
                <SkillVisualizationSection skills={d.skill_visualization} />
            )}

            {/* ═══════════════ 7. GOAL ATTAINMENT ═══════════════ */}
            {d.goal_attainment && d.goal_attainment.length > 0 && (
                <GoalAttainmentSection goals={d.goal_attainment} />
            )}

            {/* ═══════════════ 8. PERFORMANCE SCORECARD ═══════════════ */}
            {d.performance_scorecard && (
                <PerformanceScorecardSection scorecard={d.performance_scorecard} />
            )}

            {/* ═══════════════ 9. DEEP-DIVE ANALYSIS ═══════════════ */}
            {d.deep_dive_analysis && (
                <DeepDiveAnalysisSection deepDive={d.deep_dive_analysis} />
            )}

            {/* ═══════════════ 10. STRENGTHS & MISSED OPPORTUNITIES ═══════════════ */}
            {d.strengths_and_opportunities && (
                <StrengthsMissedSection data={d.strengths_and_opportunities} />
            )}

            {/* ═══════════════ 11. IDEAL COACHING QUESTIONS ═══════════════ */}
            {d.ideal_coaching_questions && d.ideal_coaching_questions.length > 0 && (
                <IdealCoachingQuestionsSection questions={d.ideal_coaching_questions} />
            )}

            {/* ═══════════════ 12. ACTION PLAN ═══════════════ */}
            {d.action_plan && d.action_plan.length > 0 && (
                <ActionPlanSection actions={d.action_plan} />
            )}

            {/* ── Quantitative Analytics (if present) ── */}
            {data.quantitative_analytics && (
                <QuantitativeAnalyticsSection data={data.quantitative_analytics} />
            )}
        </div>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 1: TIMING
// ═════════════════════════════════════════════════════════════════
const TimingSection = ({ timing }: { timing: TimingData }) => {
    const stats: { label: string; value: string | number }[] = [
        { label: "Session Duration", value: timing.duration || '—' },
        { label: "Start Time", value: timing.start_time || '—' },
        { label: "End Time", value: timing.end_time || '—' },
        { label: "Conversation Turns", value: timing.conversation_turns ?? '—' },
        { label: "Speaker Distribution", value: timing.speaker_distribution || '—' },
    ]
    return (
        <GlassCard className="border-l-4 border-l-blue-500">
            <SectionHeader icon={Clock} title="1. Timing" colorClass="text-blue-500" bgClass="bg-blue-500/10" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-background rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-lg font-black text-blue-500 mb-1">{s.value}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 2: CONVERSATION SNAPSHOT
// ═════════════════════════════════════════════════════════════════
const ConversationSnapshotSection2 = ({ snapshot }: { snapshot: ConversationSnapshot }) => (
    <GlassCard className="border-l-4 border-l-purple-500">
        <SectionHeader icon={MessageSquare} title="2. Conversation Snapshot" colorClass="text-purple-500" bgClass="bg-purple-500/10" />
        <div className="space-y-4">
            {snapshot.primary_topic && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block mb-1">Primary Topic</span>
                    <p className="text-sm font-medium text-foreground">{snapshot.primary_topic}</p>
                </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
                {snapshot.key_objectives && snapshot.key_objectives.length > 0 && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-2">Key Objectives</span>
                        <ul className="space-y-1.5">
                            {snapshot.key_objectives.map((o, i) => (
                                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                    <span className="text-blue-400 shrink-0">{i + 1}.</span>{o}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {snapshot.main_challenges && snapshot.main_challenges.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block mb-2">Main Challenges</span>
                        <ul className="space-y-1.5">
                            {snapshot.main_challenges.map((c, i) => (
                                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                    <span className="text-rose-400 shrink-0">{i + 1}.</span>{c}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {snapshot.summary && (
                <p className="text-sm text-foreground/85 leading-relaxed p-4 rounded-xl bg-muted/30 border border-border/50">{snapshot.summary}</p>
            )}
            {snapshot.key_themes && snapshot.key_themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {snapshot.key_themes.map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">{t}</span>
                    ))}
                </div>
            )}
        </div>
    </GlassCard>
)

// ═════════════════════════════════════════════════════════════════
// SECTION 3: EXECUTIVE DASHBOARD
// ═════════════════════════════════════════════════════════════════
const ExecutiveDashboardSection = ({ dashboard }: { dashboard: ExecutiveDashboard }) => {
    const cards: { label: string; value: string | number }[] = [
        { label: "Session Duration", value: dashboard.session_duration || '—' },
        { label: "Key Themes", value: dashboard.key_themes ?? '—' },
        { label: "Strength Areas", value: dashboard.strength_areas ?? '—' },
        { label: "Missed Opportunities", value: dashboard.missed_opportunities ?? '—' },
        { label: "Coaching Opportunities", value: dashboard.coaching_opportunities ?? '—' },
        { label: "Recommended Actions", value: dashboard.recommended_actions ?? '—' },
    ]
    return (
        <GlassCard className="border-l-4 border-l-emerald-500">
            <SectionHeader icon={Activity} title="3. Executive Dashboard" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
            <p className="text-sm text-muted-foreground italic -mt-4 mb-4">What should an executive understand about this session in 10 seconds?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className="bg-background rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm hover:border-emerald-500/30 transition-colors">
                        <span className="text-3xl font-black text-emerald-500 mb-1">{c.value}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">{c.label}</span>
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 4: COACHING EFFICACY
// ═════════════════════════════════════════════════════════════════
const CoachingEfficacySection = ({ efficacy }: { efficacy: NonNullable<SimulationReportData['coaching_efficacy']> }) => {
    const labelMap: Record<string, string> = {
        goal_alignment: 'Goal Alignment',
        question_quality: 'Question Quality',
        active_listening: 'Active Listening',
        feedback_quality: 'Feedback Quality',
        depth_of_exploration: 'Depth of Exploration',
        actionability: 'Actionability',
        participant_engagement: 'Participant Engagement',
    }
    const dims = efficacy.dimensions || {}
    const entries = Object.entries(dims)
    return (
        <GlassCard className="border-l-4 border-l-sky-500">
            <SectionHeader icon={Award} title="4. Coaching Efficacy" colorClass="text-sky-500" bgClass="bg-sky-500/10" />
            {efficacy.summary && <p className="text-sm text-foreground/80 -mt-4 mb-5 leading-relaxed">{efficacy.summary}</p>}
            <div className="space-y-4">
                {entries.map(([key, dim]) => {
                    const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    const rawScore = (dim as any).score
                    let score = typeof rawScore === 'string' ? parseFloat(rawScore.split('/')[0]) : Number(rawScore)
                    if (isNaN(score)) score = 0
                    const pct = Math.min(Math.max(score, 0), 10) * 10
                    const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                    return (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-sm font-semibold text-foreground">{label}</span>
                                <span className="text-sm font-black text-foreground">{score}/10</span>
                            </div>
                            <ProgressBar value={pct} colorClass={color} />
                        </div>
                    )
                })}
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 5: HEAT MAP
// ═════════════════════════════════════════════════════════════════
const HeatMapSection = ({ heatMap }: { heatMap: NonNullable<SimulationReportData['heat_map']> }) => {
    const { dimensions = [], segments = [] } = heatMap
    const heatColor = (val: number) => {
        if (val >= 8) return 'bg-emerald-500/80 text-white'
        if (val >= 6) return 'bg-emerald-500/50 text-emerald-900'
        if (val >= 4) return 'bg-amber-500/50 text-amber-900'
        if (val >= 2) return 'bg-rose-500/40 text-rose-900'
        return 'bg-muted text-muted-foreground'
    }
    return (
        <GlassCard className="border-l-4 border-l-rose-500">
            <SectionHeader icon={Activity} title="5. Conversation Heat Map" colorClass="text-rose-500" bgClass="bg-rose-500/10" />
            <p className="text-sm text-muted-foreground italic -mt-4 mb-5">Where did important coaching signals occur across the conversation timeline?</p>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Dimension</th>
                            {segments.map((seg, i) => (
                                <th key={i} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">{seg.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dimensions.map((dim, rowIdx) => (
                            <tr key={rowIdx}>
                                <td className="px-3 py-1.5 text-sm font-medium text-foreground whitespace-nowrap">{dim}</td>
                                {segments.map((seg, colIdx) => {
                                    const val = seg.intensity?.[rowIdx] ?? 0
                                    return (
                                        <td key={colIdx} className="p-1">
                                            <div className={`h-8 w-full min-w-[70px] rounded-md flex items-center justify-center text-xs font-bold ${heatColor(val)}`}>
                                                {val}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 6: SKILL VISUALIZATION
// ═════════════════════════════════════════════════════════════════
const SkillVisualizationSection = ({ skills }: { skills: NonNullable<SimulationReportData['skill_visualization']> }) => {
    const groups: { name: string; data: SkillGroup; color: string; barColor: string }[] = [
        { name: 'Communication', data: skills.communication || {}, color: 'text-sky-500', barColor: 'bg-sky-500' },
        { name: 'Leadership', data: skills.leadership || {}, color: 'text-indigo-500', barColor: 'bg-indigo-500' },
        { name: 'Interpersonal', data: skills.interpersonal || {}, color: 'text-emerald-500', barColor: 'bg-emerald-500' },
    ]
    return (
        <GlassCard className="border-l-4 border-l-indigo-500">
            <SectionHeader icon={Brain} title="6. Skill Visualization" colorClass="text-indigo-500" bgClass="bg-indigo-500/10" />
            <div className="space-y-6">
                {groups.map((group, gi) => {
                    const entries = Object.entries(group.data)
                    if (entries.length === 0) return null
                    return (
                        <div key={gi}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${group.color} block mb-3`}>{group.name}</span>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {entries.map(([key, val]) => {
                                    const rawVal = val as number | string | undefined
                                    let score = typeof rawVal === 'string' ? parseFloat(rawVal.split('/')[0]) : Number(rawVal ?? 0)
                                    if (isNaN(score)) score = 0
                                    const pct = Math.min(Math.max(score, 0), 10) * 10
                                    return (
                                        <div key={key} className="bg-background rounded-lg border border-border p-3">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm text-foreground font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-xs font-bold text-muted-foreground">{score}/10</span>
                                            </div>
                                            <ProgressBar value={pct} colorClass={group.barColor} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 7: GOAL ATTAINMENT
// ═════════════════════════════════════════════════════════════════
const GoalAttainmentSection = ({ goals }: { goals: GoalItem[] }) => {
    const statusMeta = (status: string) => {
        const s = (status || '').toLowerCase()
        if (s === 'achieved') return { dot: '🟢', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
        if (s.includes('partially')) return { dot: '🟡', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
        return { dot: '🔴', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
    }
    return (
        <GlassCard className="border-l-4 border-l-emerald-500">
            <SectionHeader icon={Target} title="7. Goal Attainment" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goal</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evidence</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {goals.map((g, i) => {
                            const meta = statusMeta(g.status)
                            return (
                                <tr key={i} className="border-b border-border/50 last:border-0">
                                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{g.goal}</td>
                                    <td className="px-4 py-3 text-sm text-foreground/75">{g.evidence}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.badge}`}>
                                            <span>{meta.dot}</span>{g.status}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 8: PERFORMANCE SCORECARD
// ═════════════════════════════════════════════════════════════════
const PerformanceScorecardSection = ({ scorecard }: { scorecard: NonNullable<SimulationReportData['performance_scorecard']> }) => {
    const { dimensions = [], overall_performance, scoring_methodology } = scorecard
    let overallNum = overall_performance ? parseFloat(overall_performance.split('/')[0]) : NaN
    if (isNaN(overallNum)) overallNum = NaN
    const overallColor = isNaN(overallNum) ? 'text-muted-foreground' : overallNum >= 8 ? 'text-emerald-500' : overallNum >= 5 ? 'text-amber-500' : 'text-rose-500'
    return (
        <GlassCard className="border-l-4 border-l-primary">
            <SectionHeader icon={CheckCircle2} title="8. Performance Scorecard" colorClass="text-primary" bgClass="bg-primary/10" />
            <div className="space-y-5">
                {dimensions.map((dim, i) => {
                    let score = typeof dim.score === 'string' ? parseFloat(dim.score.split('/')[0]) : dim.score
                    if (isNaN(score)) score = 0
                    const pct = Math.min(Math.max(score * 10, 0), 100)
                    const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                    return (
                        <div key={i}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-sm font-semibold text-foreground">{dim.dimension}</span>
                                <span className="flex items-center gap-2">
                                    <span className="text-sm font-black text-foreground">{score}/10</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase tracking-wider">{dim.interpretation}</span>
                                </span>
                            </div>
                            <ProgressBar value={pct} colorClass={color} />
                        </div>
                    )
                })}
            </div>
            {overall_performance && (
                <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Performance</span>
                    <span className={`text-3xl font-black ${overallColor}`}>{overall_performance}</span>
                </div>
            )}
            {scoring_methodology && (
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">How The Score Was Derived</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{scoring_methodology}</p>
                </div>
            )}
        </GlassCard>
    )
}

// ═════════════════════════════════════════════════════════════════
// SECTION 9: DEEP-DIVE ANALYSIS
// ═════════════════════════════════════════════════════════════════
const DeepDiveAnalysisSection = ({ deepDive }: { deepDive: NonNullable<SimulationReportData['deep_dive_analysis']> }) => (
    <GlassCard className="border-l-4 border-l-purple-500">
        <SectionHeader icon={Brain} title="9. Deep-Dive Analysis" colorClass="text-purple-500" bgClass="bg-purple-500/10" />
        <div className="space-y-8">
            {/* 9.1 Communication Style */}
            {deepDive.communication_style && (
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-sky-500 mb-4">9.1 Communication Style</h3>
                    <div className="space-y-4">
                        {deepDive.communication_style.observed_style && (
                            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 block mb-1">Observed Style</span>
                                <p className="text-sm font-semibold text-foreground">{deepDive.communication_style.observed_style}</p>
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {(['clarity', 'directness', 'conciseness', 'assertiveness', 'listening', 'questioning', 'adaptability'] as const).map((key) => {
                                const val = deepDive.communication_style[key]
                                if (!val) return null
                                return (
                                    <div key={key} className="bg-background rounded-lg border border-border p-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">{key}</span>
                                        <p className="text-sm text-foreground/85 leading-relaxed">{val}</p>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {deepDive.communication_style.strength && (
                                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Strength</span>
                                    <p className="text-sm text-foreground/90 leading-relaxed">{deepDive.communication_style.strength}</p>
                                </div>
                            )}
                            {deepDive.communication_style.development_area && (
                                <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">Development Area</span>
                                    <p className="text-sm text-foreground/90 leading-relaxed">{deepDive.communication_style.development_area}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 9.2 Behaviour Analysis */}
            {deepDive.behaviour_analysis && (
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-500 mb-4">9.2 Behaviour Analysis</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {Object.entries(deepDive.behaviour_analysis).map(([key, item]) => {
                            let score = typeof item.score === 'string' ? parseFloat(item.score.split('/')[0]) : item.score
                            if (isNaN(score)) score = 0
                            return (
                                <div key={key} className="bg-background rounded-xl border border-border p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className={`text-lg font-black ${score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>{score}/10</span>
                                    </div>
                                    <p className="text-xs text-foreground/75 leading-relaxed">{item.evidence}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* 9.3 Emotional Intelligence */}
            {deepDive.emotional_intelligence && (
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-rose-500 mb-4">9.3 Emotional Intelligence</h3>
                    <div className="space-y-4">
                        {Object.entries(deepDive.emotional_intelligence).map(([key, item]) => {
                            let score = typeof item.score === 'string' ? parseFloat(item.score.split('/')[0]) : item.score
                            if (isNaN(score)) score = 0
                            return (
                                <div key={key} className="rounded-xl p-4 border border-border/60 bg-muted/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className={`text-base font-black ${score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>{score}/10</span>
                                    </div>
                                    {item.evidence && <p className="text-xs text-foreground/75 leading-relaxed mb-1.5"><span className="font-semibold text-muted-foreground">Evidence:</span> {item.evidence}</p>}
                                    {item.improvement && <p className="text-xs text-foreground/75 leading-relaxed"><span className="font-semibold text-muted-foreground">Improvement:</span> {item.improvement}</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    </GlassCard>
)

// ═════════════════════════════════════════════════════════════════
// SECTION 10: STRENGTHS & MISSED OPPORTUNITIES
// ═════════════════════════════════════════════════════════════════
const StrengthsMissedSection = ({ data }: { data: { strengths: string[]; missed_opportunities: string[] } }) => (
    <GlassCard className="border-l-4 border-l-amber-500">
        <SectionHeader icon={Zap} title="10. Strengths & Missed Opportunities" colorClass="text-amber-500" bgClass="bg-amber-500/10" />
        <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-3">Strengths</span>
                <ul className="space-y-2.5">
                    {data.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-foreground/85 leading-relaxed">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-5">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-3">Missed Opportunities</span>
                <ul className="space-y-2.5">
                    {data.missed_opportunities.map((m, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-foreground/85 leading-relaxed">
                            <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{m}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </GlassCard>
)

// ═════════════════════════════════════════════════════════════════
// SECTION 12: ACTION PLAN
// ═════════════════════════════════════════════════════════════════
const ActionPlanSection = ({ actions }: { actions: ActionPlanItem[] }) => {
    const priorityMeta = (p: string) => {
        const s = (p || '').toLowerCase()
        if (s === 'high') return 'badge bg-rose-500/10 text-rose-600 border-rose-500/20'
        if (s === 'medium') return 'badge bg-amber-500/10 text-amber-600 border-amber-500/20'
        return 'badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    }
    return (
        <GlassCard className="border-l-4 border-l-emerald-500">
            <SectionHeader icon={Lightbulb} title="12. Action Plan" colorClass="text-emerald-500" bgClass="bg-emerald-500/10" />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Why It Matters</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Success Indicator</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actions.map((a, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0">
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">{a.action}</td>
                                <td className="px-4 py-3 text-sm text-foreground/75">{a.why_it_matters}</td>
                                <td className="px-4 py-3 text-sm text-foreground/75">{a.success_indicator}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${priorityMeta(a.priority)}`}>{a.priority}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    )
}

