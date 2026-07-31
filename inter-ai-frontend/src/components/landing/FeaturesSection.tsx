import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: "Real-time AI Roleplay",
        description: "Practice difficult conversations with an AI that responds naturally — adapting its tone, objections, and emotional cues to your approach. It's like having a sparring partner available whenever you need one.",
        icon: MessageSquare,
        size: 'hero' as const,
        badge: null,
    },
    {
        title: "Analytics That Actually Help",
        description: "Pacing, sentiment, confidence, filler words — all broken down so you know exactly what to work on next.",
        icon: BarChart3,
        size: 'normal' as const,
        badge: '✦ New',
    },
    {
        title: "Enterprise Security",
        description: "SOC2 compliant. End-to-end encrypted. Your conversations never train public models.",
        icon: Shield,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Your Scenarios, Your Rules",
        description: "Build roleplay environments specific to your company's products, customer objections, and internal processes.",
        icon: BrainCircuit,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Coaching Notes in Seconds",
        description: "AI-generated insights within seconds of finishing a session. No waiting. No scheduling.",
        icon: Zap,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Team-wide Visibility",
        description: "Track progress across your entire team. Spot coaching opportunities and skill gaps at a glance.",
        icon: Users,
        size: 'normal' as const,
        badge: null,
    }
];

const tiltClasses = ['', 'card-tilt-1', 'card-tilt-2', '', 'card-tilt-3', ''];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 md:py-32 bg-background relative">
            {/* Background accent */}
            <div className="absolute right-0 top-1/3 w-[300px] h-[300px] opacity-[0.04] bg-primary organic-blob-2 blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6">
                <motion.div
                    className="max-w-2xl mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Left-aligned, editorial header — not centered template-style */}
                    <p className="hand-note text-xl md:text-2xl mb-3 -rotate-1">Six things we obsessed over →</p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Built for people who practice,{' '}
                        <span className="text-muted-foreground">not for people who just talk about it.</span>
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                        Every feature exists because someone on our team said "I wish I had this when I was prepping for that call."
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="bento-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                            className={`
                                group relative bg-card border border-border rounded-2xl p-7 md:p-8
                                transition-all duration-300 hover:shadow-xl hover:border-primary/25 
                                ${feature.size === 'hero' ? 'bento-hero' : ''}
                                ${tiltClasses[index]}
                            `}
                        >
                            {/* Hover accent line — organic, not perfect */}
                            <div className="absolute top-0 left-3 right-3 h-[2px] bg-primary/0 group-hover:bg-primary rounded-full transition-all duration-500" />

                            {/* Badge if present */}
                            {feature.badge && (
                                <span className="absolute top-4 right-4 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                                    {feature.badge}
                                </span>
                            )}

                            <div className={`flex ${feature.size === 'hero' ? 'flex-col md:flex-row md:items-start gap-6' : 'flex-col gap-4'}`}>
                                {/* Icon */}
                                <div className={`
                                    ${feature.size === 'hero' ? 'w-14 h-14' : 'w-11 h-11'}
                                    rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0
                                    group-hover:bg-primary/[0.12] transition-colors duration-300
                                `}>
                                    <feature.icon className={`${feature.size === 'hero' ? 'w-7 h-7' : 'w-5 h-5'} text-primary`} />
                                </div>

                                <div className="flex-1">
                                    <h3 className={`${feature.size === 'hero' ? 'text-xl md:text-2xl' : 'text-lg'} font-semibold mb-2 text-foreground`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-muted-foreground ${feature.size === 'hero' ? 'text-base' : 'text-sm'} leading-relaxed`}>
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
