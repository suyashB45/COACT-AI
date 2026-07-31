import { Mic, MessageSquare, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
    {
        icon: Mic,
        label: "First",
        title: "Pick a scenario",
        description: "Choose from pre-built sales calls, negotiations, performance reviews — or create your own. Set the difficulty, the persona, the stakes. You're in control.",
        annotation: "takes ~10 seconds",
    },
    {
        icon: MessageSquare,
        label: "Then",
        title: "Have a real conversation",
        description: "Speak naturally. The AI listens, responds, pushes back, changes tone — just like a real person would. No scripts. No multiple choice. Just talk.",
        annotation: "this is the fun part",
    },
    {
        icon: BarChart3,
        label: "Finally",
        title: "See what you nailed (and what you didn't)",
        description: "Get a detailed breakdown: sentiment analysis, confidence score, pacing, filler words, and specific coaching notes. All within seconds.",
        annotation: "honest, not sugarcoated",
    }
];

const HowItWorksSection = () => {
    return (
        <section className="py-24 md:py-32 bg-muted/20 border-y border-border relative overflow-hidden" id="how-it-works">
            {/* Background accent */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.03] bg-primary blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header — editorial, left-aligned on large screens */}
                <motion.div
                    className="max-w-2xl mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How it works</p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Three steps.{' '}
                        <span className="text-muted-foreground">No onboarding call needed.</span>
                    </h2>
                </motion.div>

                {/* Editorial Timeline */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Connecting line — hand-drawn feel */}
                    <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            <line
                                x1="0" y1="0" x2="0" y2="100%"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-border hand-drawn-line"
                            />
                        </svg>
                    </div>

                    <div className="space-y-16 md:space-y-20">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative flex flex-col md:flex-row gap-6 md:gap-10 group"
                                initial={{ opacity: 0, y: 35 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Step Icon */}
                                <div className="relative shrink-0">
                                    <div className="w-20 h-20 bg-background border-2 border-border shadow-sm rounded-2xl flex items-center justify-center text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5 group-hover:-translate-y-1 relative z-10">
                                        <step.icon className="w-8 h-8" />
                                    </div>
                                    {/* Step number — tucked into corner */}
                                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-20">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 pt-1">
                                    <span className="hand-note text-base mb-1 block">{step.label},</span>
                                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed text-[15px] max-w-lg mb-3">
                                        {step.description}
                                    </p>
                                    {/* Handwritten annotation */}
                                    <span className="hand-note text-sm -rotate-1 inline-block opacity-70">
                                        ↳ {step.annotation}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
