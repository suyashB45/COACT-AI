import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Mic, RotateCcw, Sparkles } from 'lucide-react';

type ScenarioKey = 'sales' | 'feedback' | 'interview';

const scenarios: Record<ScenarioKey, { label: string; person: string; role: string; opening: string; choices: string[]; response: string; note: string }> = {
    sales: {
        label: 'Sales call',
        person: 'Maya',
        role: 'Prospective customer',
        opening: 'I like what I’ve seen, but switching tools feels like a lot of work for our team.',
        choices: ['Ask what a smooth transition would look like', 'Offer a discount right away', 'Explain every feature again'],
        response: 'That’s fair. A phased rollout could make this much easier to consider. What would your team need to see first?',
        note: 'Good move: you acknowledged the concern before jumping to a solution.',
    },
    feedback: {
        label: 'Difficult feedback',
        person: 'Jordan',
        role: 'Team member',
        opening: 'I didn’t realize my part of the presentation landed that badly. I thought it was fine.',
        choices: ['Describe what you observed and its impact', 'Tell them to prepare more next time', 'Change the subject to avoid tension'],
        response: 'I appreciate you bringing it up directly. Can you share which moments you noticed so I can work on them?',
        note: 'Good move: specific feedback makes a difficult conversation easier to act on.',
    },
    interview: {
        label: 'Interview',
        person: 'Elena',
        role: 'Hiring manager',
        opening: 'Tell me about a time you had to influence a decision without having formal authority.',
        choices: ['Answer with a specific situation and result', 'List your strengths broadly', 'Say you work well with everyone'],
        response: 'That’s a helpful example. What did you do when the first approach did not get traction?',
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

    const resetPreview = () => {
        setSelected(null);
        setIsThinking(false);
    };

    return (
        <section className="border-b border-border bg-secondary/15 py-20 md:py-28">
            <div className="container mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-semibold uppercase tracking-widest text-foreground/70">
                        <Sparkles className="h-3.5 w-3.5 text-electric-blue" /> Interactive preview
                    </div>
                    <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                        See how a practice session{' '}
                        <span className="text-muted-foreground">can unfold.</span>
                    </h2>
                    <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                        Pick a situation, try a response, and see the kind of thoughtful follow-up that keeps a conversation moving.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-2">
                        {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
                            <button key={key} onClick={() => setScenarioKey(key)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${scenarioKey === key ? 'bg-foreground text-background' : 'border border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                                {scenarios[key].label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_18px_50px_rgba(18,30,52,0.08)]">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-blue text-white"><Mic className="h-4 w-4" /></div>
                            <div><p className="text-sm font-semibold text-foreground">Practice session</p><p className="text-xs font-medium text-muted-foreground">{scenario.label}</p></div>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready</span>
                    </div>

                    <div className="min-h-[348px] p-5 sm:p-6">
                        <AnimatePresence mode="wait">
                            <motion.div key={scenarioKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                                <div className="flex items-end gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">{scenario.person[0]}</div>
                                    <div><p className="mb-1.5 text-xs font-semibold text-muted-foreground">{scenario.person} · {scenario.role}</p><p className="max-w-md rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-[15px] leading-relaxed text-foreground">{scenario.opening}</p></div>
                                </div>

                                <div className="pl-11"><p className="mb-2 text-xs font-semibold text-muted-foreground">Choose your response</p><div className="space-y-2">{scenario.choices.map((choice, index) => <button key={choice} disabled={selected !== null} onClick={() => chooseResponse(index)} className={`w-full rounded-lg border px-3.5 py-3 text-left text-[15px] font-medium transition-all ${selected === index ? 'border-electric-blue bg-electric-blue/10 text-foreground' : 'border-border text-muted-foreground hover:border-electric-blue/50 hover:bg-secondary/50 hover:text-foreground disabled:opacity-60'}`}>{choice}</button>)}</div></div>

                                {selected !== null && <div className="flex justify-end"><p className="max-w-md rounded-2xl rounded-br-sm bg-foreground px-4 py-3 text-sm leading-relaxed text-background">{scenario.choices[selected]}</p></div>}
                                {isThinking && <div className="pl-11 text-sm text-muted-foreground"><span className="inline-flex gap-1 rounded-full bg-secondary px-3 py-2"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" /></span></div>}
                                {selected !== null && !isThinking && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="flex items-end gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">{scenario.person[0]}</div><p className="max-w-md rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">{scenario.response}</p></div><p className="ml-11 flex items-start gap-2 rounded-lg border border-electric-blue/20 bg-electric-blue/5 p-3 text-xs leading-relaxed text-foreground/80"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric-blue" />{scenario.note}</p></motion.div>}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    {selected !== null && <div className="border-t border-border px-5 py-3 sm:px-6"><button onClick={resetPreview} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /> Try another response</button></div>}
                </motion.div>
            </div>
        </section>
    );
};

export default PracticePreview;
