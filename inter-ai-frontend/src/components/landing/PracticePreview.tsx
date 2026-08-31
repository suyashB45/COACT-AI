import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Mic, RotateCcw, Sparkles } from 'lucide-react';

type ScenarioKey = 'sales' | 'feedback' | 'interview';

const scenarios: Record<ScenarioKey, {
    label: string; person: string; role: string; opening: string;
    choices: string[]; response: string; note: string;
}> = {
    sales: {
        label: 'Sales Call',
        person: 'Maya',
        role: 'Prospective customer',
        opening: "I like what I've seen, but switching tools feels like a lot of work for our team.",
        choices: ['Ask what a smooth transition would look like', 'Offer a discount right away', 'Explain every feature again'],
        response: "That's fair. A phased rollout could make this much easier to consider. What would your team need to see first?",
        note: 'Good move: you acknowledged the concern before jumping to a solution.',
    },
    feedback: {
        label: 'Feedback',
        person: 'Jordan',
        role: 'Team member',
        opening: "I didn't realize my part of the presentation landed that badly. I thought it was fine.",
        choices: ['Describe what you observed and its impact', 'Tell them to prepare more next time', 'Change the subject to avoid tension'],
        response: "I appreciate you bringing it up directly. Can you share which moments you noticed so I can work on them?",
        note: 'Good move: specific feedback makes a difficult conversation easier to act on.',
    },
    interview: {
        label: 'Interview',
        person: 'Elena',
        role: 'Hiring manager',
        opening: "Tell me about a time you had to influence a decision without having formal authority.",
        choices: ['Answer with a specific situation and result', 'List your strengths broadly', 'Say you work well with everyone'],
        response: "That's a helpful example. What did you do when the first approach did not get traction?",
        note: 'Good move: a concrete story gives the interviewer something meaningful to explore.',
    },
};

const PracticePreview = () => {
    const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('sales');
    const [selected, setSelected] = useState<number | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const scenario = scenarios[scenarioKey];

    useEffect(() => {
        setSelected(null);
        setIsThinking(false);
    }, [scenarioKey]);

    const chooseResponse = (index: number) => {
        if (selected !== null) return;
        setSelected(index);
        setIsThinking(true);
        window.setTimeout(() => setIsThinking(false), 700);
    };

    return (
        <section className="ds-section py-20 md:py-28 border-b border-slate-200 dark:border-white/[0.05]">
            <div className="ds-grid" />
            <div className="ds-shimmer-top" />

            {/* Center glow */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full z-0"
                style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }} />

            <div className="relative z-10 container mx-auto max-w-6xl items-center gap-12 px-6 grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

                {/* Left copy */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                >
                    <div className="ds-badge mb-6">
                        <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        Interactive Preview
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground dark:text-white leading-[1.08] tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        See how a practice session{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                            can unfold.
                        </span>
                    </h2>
                    <p className="mt-5 max-w-md text-lg ds-muted leading-relaxed">
                        Pick a situation, try a response, and see the kind of thoughtful follow-up that keeps a conversation moving.
                    </p>

                    {/* Scenario tabs */}
                    <div className="mt-8 flex flex-wrap gap-2">
                        {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setScenarioKey(key)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                    scenarioKey === key
                                        ? 'bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                                        : 'border border-slate-300 dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70 hover:border-slate-400 dark:hover:border-white/20 bg-slate-900/[0.03] dark:bg-white/[0.03]'
                                }`}
                            >
                                {scenarios[key].label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Right panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-card dark:bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
                >
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.07] px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 dark:bg-violet-500/20 border border-violet-500/30 text-violet-500 dark:text-violet-400">
                                <Mic className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground dark:text-white">Practice session</p>
                                <p className="text-[11px] text-slate-500 dark:text-white/40">{scenario.label}</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ready
                        </span>
                    </div>

                    {/* Chat area */}
                    <div className="min-h-[320px] p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scenarioKey}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-4"
                            >
                                {/* AI message */}
                                <div className="flex items-end gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 dark:bg-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-300 border border-violet-500/20">
                                        {scenario.person[0]}
                                    </div>
                                    <div>
                                        <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-white/35">
                                            {scenario.person} · {scenario.role}
                                        </p>
                                        <p className="max-w-sm rounded-2xl rounded-bl-sm border border-slate-200 dark:border-white/[0.08] bg-slate-900/[0.04] dark:bg-white/[0.06] px-4 py-3 text-[14px] leading-relaxed text-slate-800 dark:text-white/80">
                                            {scenario.opening}
                                        </p>
                                    </div>
                                </div>

                                {/* Choices */}
                                <div className="pl-11">
                                    <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-white/35 uppercase tracking-wider">Choose your response</p>
                                    <div className="space-y-2">
                                        {scenario.choices.map((choice, idx) => (
                                            <button
                                                key={choice}
                                                disabled={selected !== null}
                                                onClick={() => chooseResponse(idx)}
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                                                    selected === idx
                                                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-200'
                                                        : 'border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-white/45 hover:border-violet-500/40 dark:hover:border-violet-500/30 hover:bg-violet-500/[0.08] hover:text-slate-900 dark:hover:text-white/80 disabled:opacity-50'
                                                }`}
                                            >
                                                {choice}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* User bubble */}
                                {selected !== null && (
                                    <div className="flex justify-end">
                                        <p className="max-w-sm rounded-2xl rounded-br-sm border border-violet-600/50 bg-gradient-to-br from-violet-600 to-blue-600 px-4 py-3 text-[13px] leading-relaxed text-white font-medium">
                                            {scenario.choices[selected]}
                                        </p>
                                    </div>
                                )}

                                {/* Thinking dots */}
                                {isThinking && (
                                    <div className="pl-11">
                                        <span className="inline-flex gap-1 rounded-full bg-slate-900/[0.05] dark:bg-white/[0.05] px-3 py-2">
                                            {[0, 1, 2].map((d) => (
                                                <i key={d} className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-white/40 animate-bounce"
                                                    style={{ animationDelay: `${d * 120}ms` }} />
                                            ))}
                                        </span>
                                    </div>
                                )}

                                {/* AI reply + coaching note */}
                                {selected !== null && !isThinking && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                        <div className="flex items-end gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 dark:bg-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-300 border border-violet-500/20">
                                                {scenario.person[0]}
                                            </div>
                                            <p className="max-w-sm rounded-2xl rounded-bl-sm border border-slate-200 dark:border-white/[0.08] bg-slate-900/[0.04] dark:bg-white/[0.06] px-4 py-3 text-[13px] leading-relaxed text-slate-800 dark:text-white/75">
                                                {scenario.response}
                                            </p>
                                        </div>
                                        {/* Coaching note */}
                                        <p className="ml-11 flex items-start gap-2 rounded-xl border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.07] p-3 text-[12px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            {scenario.note}
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Reset */}
                    {selected !== null && (
                        <div className="border-t border-slate-200 dark:border-white/[0.06] px-5 py-3">
                            <button
                                onClick={() => { setSelected(null); setIsThinking(false); }}
                                className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-white/35 hover:text-slate-800 dark:hover:text-white/70 transition-colors"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Try another response
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
            <div className="ds-shimmer-bottom" />
        </section>
    );
};

export default PracticePreview;
