import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { TiltCard } from '../ui/TiltCard';

const features = [
    {
        title: "Real-time AI Roleplay",
        description: "You talk, it listens, and it pushes back — just like a real person would. It picks up on your tone, adjusts its responses, and doesn't let you off easy.",
        icon: MessageSquare,
        size: 'hero' as const,
        badge: null,
    },
    {
        title: "Actionable Analytics",
        description: "See exactly where you hesitated, where your confidence dipped, and how many filler words slipped through. Numbers don't lie.",
        icon: BarChart3,
        size: 'normal' as const,
        badge: 'New',
    },
    {
        title: "Privacy-conscious by design",
        description: "Your practice space should feel safe. We use authenticated sessions and give you clear control over the conversations you create.",
        icon: Shield,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Custom Scenarios",
        description: "Upload your actual product docs and objection sheets. The AI will roleplay using your real-world context, not generic templates.",
        icon: BrainCircuit,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Instant Feedback",
        description: "Session ends, report lands. No waiting around. Coaching notes, key moments, and specific suggestions — in under 10 seconds.",
        icon: Zap,
        size: 'normal' as const,
        badge: null,
    },
    {
        title: "Team Dashboards",
        description: "Track who's practicing, who's improving, and where your team needs help. Managers love this one.",
        icon: Users,
        size: 'normal' as const,
        badge: 'Beta',
    }
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-20 md:py-28 bg-background relative border-b border-border">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(95,157,118,0.07)_0%,transparent_70%)] blur-3xl" />
            <div className="container mx-auto px-6 max-w-6xl">
                <motion.div
                    className="max-w-2xl mb-16 md:mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/80 text-[12px] font-semibold uppercase tracking-widest text-foreground/70 mb-6">
                        Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                        Everything you need to get{' '}
                        <span className="text-muted-foreground">genuinely better at talking to people.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        We built what we wished existed when we were prepping for our own high-stakes conversations. No fluff, no dashboards-for-the-sake-of-dashboards.
                    </p>
                </motion.div>

                {/* Bento Grid with visual variety */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            className={feature.size === 'hero' ? 'md:col-span-2' : ''}
                        >
                            <TiltCard maxTilt={5} className={`group relative border border-border rounded-xl p-8 transition-all duration-300 hover:border-[#5f9d76]/40 hover:shadow-[0_8px_32px_rgba(25,60,42,0.10)] h-full flex flex-col ${
                                index === 0 ? 'bg-gradient-to-br from-[#f5faf5] to-background' : 'bg-background'
                            }`}>
                            {/* Subtle hover gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#5f9d76]/[0.07] via-[#dbb96a]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />

                            {/* Spotlight glow on hover */}
                            <div className="absolute -inset-px bg-gradient-to-br from-[#5f9d76]/20 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500 blur-sm pointer-events-none -z-10" />
                            {feature.badge && (
                                <span className={`absolute top-6 right-6 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${
                                    feature.badge === 'Beta'
                                        ? 'bg-secondary text-foreground/70 border border-border'
                                        : 'bg-foreground text-background'
                                }`}>
                                    {feature.badge}
                                </span>
                            )}

                            <div className={`relative z-10 flex ${feature.size === 'hero' ? 'flex-col md:flex-row md:items-start gap-8' : 'flex-col gap-6'}`}>
                                <div className={`
                                    ${feature.size === 'hero' ? 'w-12 h-12' : 'w-10 h-10'}
                                    rounded-lg border border-border/50 bg-secondary/30 flex items-center justify-center shrink-0
                                    group-hover:bg-[#193c2a] group-hover:border-[#193c2a] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(25,60,42,0.35)] relative overflow-hidden
                                `}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5f9d76]/30 to-transparent translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                                    <feature.icon className={`
                                        ${feature.size === 'hero' ? 'w-6 h-6' : 'w-5 h-5'}
                                        text-foreground/80 group-hover:text-white transition-all duration-300 group-hover:scale-110 relative z-10
                                    `} />
                                </div>

                                <div className="flex-1">
                                    <h3 className={`font-semibold mb-2.5 text-foreground tracking-tight ${feature.size === 'hero' ? 'text-2xl' : 'text-lg'}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-muted-foreground leading-relaxed ${feature.size === 'hero' ? 'text-lg' : 'text-[15px]'}`}>
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                            </TiltCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
