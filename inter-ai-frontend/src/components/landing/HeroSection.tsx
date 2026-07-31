import { ArrowRight, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Scene3D from './Scene3D';

/* ── Stagger Variants ──────────────────────────────── */
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }
};

/* ── Typing effect for the badge ──────────────────── */
const phrases = [
    'AI Coaching That Actually Works',
    'Built for Real Conversations',
    'Not Another Chatbot',
];

function useTypingLoop(items: string[], speed = 50, pause = 2200) {
    const [text, setText] = useState('');
    const [idx, setIdx] = useState(0);
    const [typing, setTyping] = useState(true);

    useEffect(() => {
        const current = items[idx];
        let timer: ReturnType<typeof setTimeout>;

        if (typing) {
            if (text.length < current.length) {
                timer = setTimeout(() => setText(current.slice(0, text.length + 1)), speed);
            } else {
                timer = setTimeout(() => setTyping(false), pause);
            }
        } else {
            if (text.length > 0) {
                timer = setTimeout(() => setText(text.slice(0, -1)), speed / 2);
            } else {
                setIdx((idx + 1) % items.length);
                setTyping(true);
            }
        }

        return () => clearTimeout(timer);
    }, [text, typing, idx, items, speed, pause]);

    return text;
}

const HeroSection = () => {
    const navigate = useNavigate();
    const typedText = useTypingLoop(phrases);

    return (
        <section className="relative min-h-[92vh] pt-24 pb-12 lg:pt-28 lg:pb-20 overflow-hidden bg-background flex items-center">
            {/* Organic Background Blobs — not perfect circles */}
            <div className="absolute left-[10%] top-[15%] w-[420px] h-[320px] opacity-[0.07] bg-primary organic-blob blur-[100px] pointer-events-none" />
            <div className="absolute right-[5%] bottom-[10%] w-[280px] h-[220px] opacity-[0.05] bg-annotation organic-blob-2 blur-[80px] pointer-events-none" />

            {/* Subtle dot pattern — editorial feel */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }} />

            <div className="container relative mx-auto px-6 z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
                    {/* ── Left: Text Content ─────────── */}
                    <motion.div
                        className="flex flex-col items-start text-left z-10"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        {/* Typing Badge */}
                        <motion.div
                            variants={fadeUp}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/[0.08] text-primary border border-primary/20 text-xs font-medium mb-6"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="typing-cursor">{typedText}</span>
                        </motion.div>

                        {/* Headline — editorial, asymmetric */}
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-[3.4rem] xl:text-[3.8rem] font-bold tracking-tight text-foreground mb-5 leading-[1.08]" style={{ fontFamily: 'var(--font-display)' }}>
                            Stop rehearsing{' '}
                            <br className="hidden sm:block" />
                            in your head.{' '}
                            <br />
                            <span className="ink-highlight">Practice for real.</span>
                        </motion.h1>

                        {/* Subheadline — conversational */}
                        <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground mb-3 max-w-lg leading-relaxed">
                            CoAct is an AI roleplay partner that sounds like a real person — not a bot.
                            Practice tough sales calls, negotiations, and difficult conversations.
                            Get honest feedback in seconds.
                        </motion.p>

                        {/* Handwritten annotation */}
                        <motion.p
                            variants={fadeUp}
                            className="hand-note text-lg md:text-xl mb-6 -rotate-1"
                        >
                            ↳ seriously, it's free to try
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                            <button
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    navigate(user ? '/practice' : '/login');
                                }}
                                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 text-[15px]"
                            >
                                Try a practice round
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-background text-foreground border border-border font-medium hover:bg-muted transition-all text-[15px]"
                            >
                                <Play className="w-4 h-4" />
                                See how it works
                            </button>
                        </motion.div>

                        {/* Trust Strip */}
                        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-success" />
                                <span>End-to-end encrypted</span>
                            </div>
                            <span className="text-border hidden sm:inline">·</span>
                            <span>No credit card needed</span>
                            <span className="text-border hidden sm:inline">·</span>
                            <span>Setup in 30 seconds</span>
                        </motion.div>

                        {/* Stats — editorial, staggered sizing */}
                        <motion.div variants={fadeUp} className="flex items-end gap-10 mt-10 pt-8 border-t border-border/60">
                            <div>
                                <span className="text-3xl md:text-4xl font-bold stat-shimmer" style={{ fontFamily: 'var(--font-display)' }}>24/7</span>
                                <p className="text-[11px] text-muted-foreground mt-1.5 tracking-wide uppercase">Always on</p>
                            </div>
                            <div>
                                <span className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>&lt; 1s</span>
                                <p className="text-[11px] text-muted-foreground mt-1.5 tracking-wide uppercase">Response</p>
                            </div>
                            <div>
                                <span className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>100%</span>
                                <p className="text-[11px] text-muted-foreground mt-1.5 tracking-wide uppercase">Private</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* ── Right: Atom / 3D Scene with electrons ───────── */}
                    <motion.div
                        className="hidden lg:flex items-center justify-center relative min-h-[380px]"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Scene3D />

                        {/* Floating annotation — handwritten feel */}
                        <motion.div
                            className="absolute -bottom-2 -left-4 hand-note text-base md:text-lg bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 shadow-md -rotate-3 z-20"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                        >
                            ← this is real feedback ✨
                        </motion.div>

                        {/* Floating stat pill */}
                        <motion.div
                            className="absolute -top-2 -right-2 bg-success/10 text-success border border-success/20 rounded-full px-3 py-1 text-xs font-semibold shadow-sm rotate-3 z-20"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.4, duration: 0.4, type: 'spring' }}
                        >
                            +42% improvement
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
