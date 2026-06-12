import { Mic, MessageSquare, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
    {
        icon: Mic,
        title: "Simulate Real Scenarios",
        description: "Engage in voice-based roleplay using custom or pre-built enterprise scenarios tailored to your organizational goals."
    },
    {
        title: "Adaptive AI Responses",
        description: "Our LLM dynamically adjusts to your conversation style, providing realistic objections, tone shifts, and negotiation tactics.",
        icon: MessageSquare
    },
    {
        title: "Actionable Insights",
        description: "Instantly receive a comprehensive breakdown of your performance, including sentiment analysis, talk-track adherence, and coaching notes.",
        icon: BarChart3
    }
];

const HowItWorksSection = () => {
    return (
        <section className="py-28 bg-muted/20 border-y border-border relative overflow-hidden" id="how-it-works">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,var(--color-primary),transparent)] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-20 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        Built for professional growth
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        A streamlined three-step process designed to maximize learning efficiency without unnecessary friction.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px z-0">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-border to-transparent" />
                    </div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="relative z-10 flex flex-col items-center text-center group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                        >
                            {/* Step Number + Icon */}
                            <div className="relative mb-8">
                                <div className="w-20 h-20 bg-background border-2 border-border shadow-sm rounded-2xl flex items-center justify-center text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5 group-hover:-translate-y-1">
                                    <step.icon className="w-9 h-9" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                    {index + 1}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-xs text-sm">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
