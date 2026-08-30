import { Mic, MessageSquare, BarChart3 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const steps = [
    {
        icon: Mic,
        label: 'Step 01',
        title: 'Pick your scenario',
        description: 'Choose from 50+ pre-built scenarios — cold calls, salary negotiations, performance reviews — or describe your own situation in plain English. Set the difficulty and persona you want to practice against.',
        color: 'violet',
    },
    {
        icon: MessageSquare,
        label: 'Step 02',
        title: 'Have the conversation',
        description: 'Just talk. Use your mic or type — whatever feels natural. The AI responds in real time, picks up on your tone, and throws curveballs. It feels surprisingly real.',
        color: 'blue',
    },
    {
        icon: BarChart3,
        label: 'Step 03',
        title: 'Get your breakdown',
        description: 'Within 10 seconds of finishing, you\'ll see exactly how you did: confidence trajectory, hesitations, pacing, filler word count, and specific coaching notes on what to try next time.',
        color: 'cyan',
    },
];

const colorMap: Record<string, { glow: string; ring: string; text: string; num: string }> = {
    violet: {
        glow: 'rgba(139,92,246,0.35)',
        ring: 'rgba(139,92,246,0.3)',
        text: 'text-violet-400',
        num: 'from-violet-600 to-violet-400',
    },
    blue: {
        glow: 'rgba(96,165,250,0.30)',
        ring: 'rgba(96,165,250,0.25)',
        text: 'text-blue-400',
        num: 'from-blue-600 to-blue-400',
    },
    cyan: {
        glow: 'rgba(34,211,238,0.25)',
        ring: 'rgba(34,211,238,0.2)',
        text: 'text-cyan-400',
        num: 'from-cyan-600 to-cyan-400',
    },
};

const HowItWorksSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start center', 'end center'],
    });
    const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

    return (
        <section id="how-it-works" className="ds-section py-24 md:py-32 border-b border-white/[0.05]">
            <div className="ds-grid" />
            <div className="ds-shimmer-top" />

            {/* Blue accent glow right */}
            <div className="pointer-events-none absolute top-1/3 right-0 w-[450px] h-[450px] rounded-full z-0"
                style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 65%)', filter: 'blur(40px)' }} />

            <div className="relative z-10 container mx-auto px-6 max-w-5xl">
                {/* Header */}
                <motion.div
                    className="max-w-2xl mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                >
                    <div className="ds-badge mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        How It Works
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.08]"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        Three steps.{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Under five minutes.
                        </span>
                    </h2>
                    <p className="mt-5 text-lg ds-muted leading-relaxed">
                        No onboarding calls, no implementation timeline. Sign up, pick a scenario, and start practicing. Seriously — less time than making coffee.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative" ref={containerRef}>
                    {/* Track */}
                    <div className="hidden md:block absolute left-[39px] top-6 bottom-10 w-px bg-white/[0.06]" />
                    {/* Animated fill */}
                    <motion.div
                        className="hidden md:block absolute left-[39px] top-6 w-px origin-top"
                        style={{
                            height: lineHeight,
                            bottom: '2.5rem',
                            background: 'linear-gradient(to bottom, #8b5cf6, #60a5fa, #22d3ee)',
                        }}
                    />

                    <div className="space-y-14 md:space-y-20">
                        {steps.map((step, i) => {
                            const c = colorMap[step.color];
                            return (
                                <motion.div
                                    key={i}
                                    className="group relative flex flex-col md:flex-row gap-6 md:gap-12"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {/* Icon */}
                                    <div className="relative shrink-0 z-10">
                                        <div
                                            className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${c.ring}`,
                                                boxShadow: `0 0 24px ${c.glow}`,
                                            }}
                                        >
                                            <step.icon className={`w-7 h-7 ${c.text}`} />
                                        </div>
                                        {/* Step number badge */}
                                        <div
                                            className={`absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${c.num}`}
                                        >
                                            {i + 1}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pt-1">
                                        <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${c.text} block mb-2`}>
                                            {step.label}
                                        </span>
                                        <h3 className="text-2xl font-bold text-white tracking-tight mb-3"
                                            style={{ fontFamily: 'var(--font-display)' }}>
                                            {step.title}
                                        </h3>
                                        <p className="ds-muted text-[15px] leading-relaxed max-w-lg">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="ds-shimmer-bottom" />
        </section>
    );
};

export default HowItWorksSection;
