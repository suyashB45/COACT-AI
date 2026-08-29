import { Mic, MessageSquare, BarChart3 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const steps = [
    {
        icon: Mic,
        label: "Step 1",
        title: "Pick your scenario",
        description: "Choose from 50+ pre-built scenarios — cold calls, salary negotiations, performance reviews, client escalations — or describe your own situation in plain English. Set the difficulty and the persona you want to practice against.",
    },
    {
        icon: MessageSquare,
        label: "Step 2",
        title: "Have the conversation",
        description: "Just talk. Use your mic or type — whatever feels natural. The AI responds in real time, picks up on your tone, throws curveballs, and doesn't follow a script. It feels surprisingly real (our users' words, not ours).",
    },
    {
        icon: BarChart3,
        label: "Step 3",
        title: "Get your breakdown",
        description: "Within 10 seconds of finishing, you'll see exactly how you did: confidence trajectory, moments where you hesitated, pacing analysis, filler word count, and specific coaching notes on what to try differently next time.",
    }
];

const HowItWorksSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    // Animate the height of the highlighted line based on scroll
    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section className="py-28 md:py-36 border-b border-border relative overflow-hidden" id="how-it-works"
            style={{
                background: 'linear-gradient(170deg, #f0f5ec 0%, #eaf2e4 40%, #f2f7ee 70%, #e8f0e3 100%)',
            }}
        >
            {/* Ambient top glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(95,157,118,0.10)_0%,transparent_70%)] blur-3xl" />
            {/* Gold accent bottom-right */}
            <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(219,185,106,0.10)_0%,transparent_65%)] blur-2xl" />
            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <motion.div
                    className="max-w-2xl mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/80 text-[12px] font-semibold uppercase tracking-widest text-foreground/70 mb-6">
                        How it works
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                        Three steps.{' '}
                        <span className="text-muted-foreground">Under five minutes.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        No onboarding calls, no "implementation timeline." Sign up, pick a scenario, and start practicing. Seriously — it takes less time than making coffee.
                    </p>
                </motion.div>

                {/* Linear Timeline */}
                <div className="relative mx-auto" ref={containerRef}>
                    {/* Background line */}
                    <div className="hidden md:block absolute left-[39px] top-4 bottom-12 w-px bg-border overflow-hidden" />
                    
                    {/* Foreground Animated Line */}
                    <motion.div 
                        className="hidden md:block absolute left-[39px] top-4 w-px origin-top"
                        style={{ 
                            height: lineHeight, 
                            bottom: "3rem",
                            background: 'linear-gradient(to bottom, #193c2a, #5f9d76, #dbb96a)',
                        }}
                    />

                    <div className="space-y-16 md:space-y-24">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative flex flex-col md:flex-row gap-8 md:gap-16 group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Step Icon */}
                                <div className="relative shrink-0">
                                    <div className="w-20 h-20 bg-background border border-border rounded-xl flex items-center justify-center transition-all duration-500 group-hover:border-[#5f9d76]/50 group-hover:shadow-[0_0_24px_rgba(25,60,42,0.12)] relative z-10 shadow-sm overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#5f9d76]/[0.08] to-[#dbb96a]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <step.icon className="w-7 h-7 text-foreground/80 group-hover:text-foreground transition-colors duration-300 relative z-10" />
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold shadow-md z-20 text-white"
                                        style={{ background: 'linear-gradient(135deg, #193c2a 0%, #2d6645 100%)' }}
                                    >
                                        0{index + 1}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 pt-2">
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-3">
                                        {step.label}
                                    </span>
                                    <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed text-base max-w-lg">
                                        {step.description}
                                    </p>
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
