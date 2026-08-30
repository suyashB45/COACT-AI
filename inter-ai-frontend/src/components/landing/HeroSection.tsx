import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AIVisualization from './AIVisualization';
import FloatingStatCard from './FloatingStatCard';

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease, delay },
});

export default function HeroSection() {
    const navigate = useNavigate();
    const startPractice = () => navigate(localStorage.getItem('user') ? '/practice' : '/login');
    const scrollToHowItWorks = () =>
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section className="hero-dark relative min-h-screen overflow-hidden flex flex-col">
            {/* ── Background layers ── */}
            <div className="hero-dark-bg" aria-hidden="true" />
            <div className="hero-dark-grid" aria-hidden="true" />

            {/* ── Content ── */}
            <div className="relative z-10 flex flex-1 items-center">
                <div className="mx-auto w-full max-w-7xl px-6 py-28 md:py-32 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
                    <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-[45%_55%] lg:gap-8 xl:gap-12">

                        {/* ════════════════════════════════════════
                            LEFT — AI Visualization + floating cards
                        ════════════════════════════════════════ */}
                        <motion.div
                            className="relative flex items-center justify-center order-1 lg:order-none"
                            {...fadeUp(0.15)}
                        >
                            {/* viz wrapper */}
                            <div className="relative">
                                <AIVisualization />

                                {/* Floating proof cards — simplified to keep the composition clean and readable */}
                                <div className="absolute -top-2 -right-2 sm:-right-8 lg:-right-10">
                                    <FloatingStatCard
                                        value="95%"
                                        label="Success Rate"
                                        floatDelay={0.6}
                                        floatDuration={3.2}
                                        floatDistance={10}
                                    />
                                </div>

                                <div className="absolute -bottom-3 -left-2 sm:-left-8 lg:-left-10">
                                    <FloatingStatCard
                                        value="24/7"
                                        label="AI Support"
                                        floatDelay={0.9}
                                        floatDuration={3.8}
                                        floatDistance={7}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* ════════════════════════════════════════
                            RIGHT — Heading + description + CTAs
                        ════════════════════════════════════════ */}
                        <div className="flex flex-col justify-center order-2 lg:order-none lg:pl-4 xl:pl-8">

                            {/* Badge */}
                            <motion.div {...fadeUp(0)} className="mb-6 lg:mb-8">
                                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold tracking-[0.22em] text-slate-600 dark:text-slate-300 uppercase backdrop-blur-md">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                                    AI-Powered Coaching Platform
                                </span>
                            </motion.div>

                            {/* Heading */}
                            <motion.h1
                                {...fadeUp(0.1)}
                                className="hero-dark-heading text-[2.8rem] sm:text-[3.6rem] lg:text-[4rem] xl:text-[4.5rem] font-black leading-[0.95] tracking-[-0.04em] text-slate-900 dark:text-white"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                AI-Powered
                                <br />
                                <span className="text-slate-900 dark:text-white">
                                    Coaching
                                </span>
                                <br />
                                <span className="text-slate-500 dark:text-slate-400 font-medium">for Real World</span>
                                <br />
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Conversation</span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                {...fadeUp(0.2)}
                                className="mt-6 max-w-[540px] text-[15px] sm:text-base leading-relaxed text-slate-600 dark:text-slate-400"
                            >
                                Personalized AI coaching that adapts to your goals, delivering
                                real-time guidance, actionable insights, and measurable
                                performance improvement.
                            </motion.p>

                            {/* CTA Buttons */}
                            <motion.div
                                {...fadeUp(0.3)}
                                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
                            >
                                {/* Primary */}
                                <button
                                    onClick={startPractice}
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-semibold transition-all duration-200
                                        bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-black/10
                                        dark:bg-white dark:text-black dark:hover:bg-slate-100 dark:shadow-white/10
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-white"
                                    aria-label="Get started with CoAct.AI"
                                >
                                    Get Started
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>

                                {/* Secondary */}
                                <button
                                    onClick={scrollToHowItWorks}
                                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-7 py-3.5 text-[15px] font-semibold text-slate-700 dark:text-white/80 transition-all duration-200
                                        hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-black/20 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-white/30"
                                    aria-label="Learn how CoAct.AI works"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-colors">
                                        <Play className="h-2.5 w-2.5 fill-slate-700 dark:fill-white text-slate-700 dark:text-white ml-0.5" />
                                    </span>
                                    How It Works
                                </button>
                            </motion.div>

                            {/* Social proof */}
                            <motion.div
                                {...fadeUp(0.4)}
                                className="mt-8 flex flex-wrap items-center gap-3 text-[12px] text-slate-500 dark:text-slate-300/80"
                            >
                                <div className="flex -space-x-2">
                                    {['M', 'J', 'A', 'S'].map((letter, i) => (
                                        <div
                                            key={i}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-[#03050D] text-[10px] font-bold text-white"
                                            style={{
                                                background: ['#7c3aed', '#2563eb', '#0891b2', '#7c3aed'][i],
                                                opacity: 0.85,
                                            }}
                                        >
                                            {letter}
                                        </div>
                                    ))}
                                </div>
                                <span>Trusted by professionals worldwide</span>
                                <span className="text-slate-300 dark:text-white/20">·</span>
                                <span className="text-slate-400 dark:text-white/30">No credit card required</span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Scroll indicator ── */}
            <motion.div
                className="relative z-10 flex justify-center pb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
            >
                <motion.div
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                    onClick={scrollToHowItWorks}
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/20">Scroll</span>
                    <div className="h-8 w-[1px] bg-gradient-to-b from-slate-300 dark:from-white/20 to-transparent" />
                </motion.div>
            </motion.div>
        </section>
    );
}
