import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: 'Real-time AI Roleplay',
        description: "You talk, it listens, and it pushes back — just like a real person would. Picks up on your tone, adjusts its responses, and doesn't let you off easy.",
        icon: MessageSquare,
        span: 'col-span-1 md:col-span-2',
        accent: 'from-violet-500/20 to-blue-500/10',
        iconColor: 'text-violet-400',
        badge: null,
    },
    {
        title: 'Actionable Analytics',
        description: 'See exactly where you hesitated and how many filler words slipped through. Numbers don\'t lie.',
        icon: BarChart3,
        span: 'col-span-1',
        accent: 'from-blue-500/15 to-cyan-500/10',
        iconColor: 'text-blue-400',
        badge: 'New',
    },
    {
        title: 'Privacy-Conscious',
        description: 'Authenticated sessions, clear data controls. Your practice space should feel safe.',
        icon: Shield,
        span: 'col-span-1',
        accent: 'from-emerald-500/15 to-teal-500/10',
        iconColor: 'text-emerald-400',
        badge: null,
    },
    {
        title: 'Custom Scenarios',
        description: 'Upload your real product docs and objection sheets. The AI roleplay uses your actual context.',
        icon: BrainCircuit,
        span: 'col-span-1',
        accent: 'from-pink-500/15 to-violet-500/10',
        iconColor: 'text-pink-400',
        badge: null,
    },
    {
        title: 'Instant Feedback',
        description: 'Session ends, report lands. Coaching notes, key moments, specific suggestions — in under 10 seconds.',
        icon: Zap,
        span: 'col-span-1',
        accent: 'from-amber-500/15 to-orange-500/10',
        iconColor: 'text-amber-400',
        badge: null,
    },
    {
        title: 'Team Dashboards',
        description: 'Track who\'s practicing, who\'s improving, and where your team needs help most.',
        icon: Users,
        span: 'col-span-1 md:col-span-2',
        accent: 'from-violet-500/15 to-blue-500/10',
        iconColor: 'text-violet-400',
        badge: 'Beta',
    },
];

const FeaturesSection = () => (
    <section id="features" className="ds-section py-20 md:py-28 border-b border-white/[0.05]">
        <div className="ds-grid" />
        <div className="ds-shimmer-top" />

        {/* Purple radial glow top-center */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full z-0"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 65%)', filter: 'blur(30px)' }} />

        <div className="relative z-10 container mx-auto px-6 max-w-6xl">
            {/* Header */}
            <motion.div
                className="max-w-2xl mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
            >
                <div className="ds-badge mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    Features
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.08]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Everything you need to get{' '}
                    <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                        genuinely better.
                    </span>
                </h2>
                <p className="mt-5 text-lg ds-muted leading-relaxed">
                    We built what we wished existed when prepping for our own high-stakes conversations. No fluff, no dashboards-for-the-sake-of-dashboards.
                </p>
            </motion.div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        className={`group relative ${f.span}`}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="ds-card h-full p-7 flex flex-col gap-5 relative overflow-hidden">
                            {/* Gradient shimmer on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl pointer-events-none`} />

                            {/* Top-right glow spot */}
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl"
                                style={{ background: 'rgba(139,92,246,0.3)' }} />

                            {/* Badge */}
                            {f.badge && (
                                <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20">
                                    {f.badge}
                                </span>
                            )}

                            <div className="relative z-10 flex items-start gap-5">
                                {/* Icon */}
                                <div className="ds-icon-box shrink-0 w-11 h-11">
                                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                                        {f.title}
                                    </h3>
                                    <p className="text-[14px] ds-muted leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom shimmer line */}
                            <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
        <div className="ds-shimmer-bottom" />
    </section>
);

export default FeaturesSection;
