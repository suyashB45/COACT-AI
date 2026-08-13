import { ArrowRight, Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

import { MagneticButton } from '../ui/MagneticButton';
import { AnimatedText } from '../ui/AnimatedText';

/* ── Stagger Variants ──────────────────────────────── */
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

const HeroSection = () => {
    const navigate = useNavigate();

    // Interactive mouse follow glow
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const { currentTarget, clientX, clientY } = e;
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    return (
        <section
            onMouseMove={handleMouseMove}
            className="relative min-h-[92vh] pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-background flex items-center justify-center border-b border-border"
        >
            {/* Minimal Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

            {/* Interactive Mouse Glow (Vercel Style) */}
            <motion.div
                className="pointer-events-none absolute w-[800px] h-[800px] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(var(--color-electric-blue-rgb), 0.12) 0%, transparent 60%)',
                    x: smoothX,
                    y: smoothY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />

            {/* Subtle central glow fallback */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-electric-blue/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container relative mx-auto px-6 z-10">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col items-center"
                    >
                        {/* Pill Badge */}
                        <motion.div
                            variants={fadeUp}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/80 text-[13px] font-medium mb-8 cursor-pointer hover:bg-border/50 transition-colors backdrop-blur-sm shadow-sm"
                        >
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 status-dot"></span>
                            A calmer way to prepare for high-stakes conversations
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                        </motion.div>

                        {/* Headline with Rotating Text */}
                        <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-tighter text-foreground mb-6 leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
                            Stop rehearsing{' '}
                            <br className="hidden md:block" />
                            in your head.{' '}
                            <br className="hidden lg:block" />
                            <AnimatedText
                                words={['Practice for real.', 'Close more deals.', 'Lead with confidence.', 'Handle tough calls.']}
                                className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-electric-blue/80 to-foreground/80"
                            />
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed font-medium">
                            An AI partner that plays the other side of your toughest conversations — sales calls, negotiations, difficult feedback — so you walk in ready, not nervous.
                        </motion.p>

                        {/* CTA Buttons (Magnetic) */}
                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-6">
                            <MagneticButton
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    navigate(user ? '/practice' : '/login');
                                }}
                                className="relative w-full sm:w-auto group rounded-full bg-electric-blue text-white font-medium text-[15px] shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.4)] transition-all px-8 py-3.5 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Start practicing — it's free
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </MagneticButton>

                            <MagneticButton
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto group rounded-full bg-background/50 backdrop-blur-md text-foreground border border-border/50 font-medium hover:bg-secondary/50 transition-colors text-[15px] shadow-glass px-8 py-3.5 flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 text-electric-blue" />
                                See how it works
                            </MagneticButton>
                        </motion.div>

                        {/* No credit card note */}
                        <motion.p variants={fadeUp} className="text-xs text-muted-foreground/70 mb-16">
                            No credit card required · Free plan includes 3 sessions/month
                        </motion.p>



                        {/* Product proof — useful details, not made-up vanity metrics */}
                        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-14 mt-8 border-t border-border/60">
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-foreground tracking-tight">Speak or type</span>
                                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mt-1.5">Practice your way</span>
                            </div>
                            <div className="hidden sm:block w-px h-10 bg-border"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-foreground tracking-tight">Real scenarios</span>
                                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mt-1.5">Not generic scripts</span>
                            </div>
                            <div className="hidden sm:block w-px h-10 bg-border"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-foreground tracking-tight">Clear feedback</span>
                                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mt-1.5">After every session</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
