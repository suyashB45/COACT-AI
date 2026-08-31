import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: 'Real-time AI Roleplay',
        description: "You talk, it listens, and it pushes back — just like a real person would. Picks up on your tone, adjusts its responses, and doesn't let you off easy.",
        icon: MessageSquare,
        span: 'col-span-1 md:col-span-2',
        badge: null,
    },
    {
        title: 'Actionable Analytics',
        description: 'See exactly where you hesitated and how many filler words slipped through. Numbers don\'t lie.',
        icon: BarChart3,
        span: 'col-span-1',
        badge: 'New',
    },
    {
        title: 'Privacy-Conscious',
        description: 'Authenticated sessions, clear data controls. Your practice space should feel safe.',
        icon: Shield,
        span: 'col-span-1',
        badge: null,
    },
    {
        title: 'Custom Scenarios',
        description: 'Upload your real product docs and objection sheets. The AI roleplay uses your actual context.',
        icon: BrainCircuit,
        span: 'col-span-1',
        badge: null,
    },
    {
        title: 'Instant Feedback',
        description: 'Session ends, report lands. Coaching notes, key moments, specific suggestions — in under 10 seconds.',
        icon: Zap,
        span: 'col-span-1',
        badge: null,
    },
    {
        title: 'Team Dashboards',
        description: 'Track who\'s practicing, who\'s improving, and where your team needs help most.',
        icon: Users,
        span: 'col-span-1 md:col-span-2',
        badge: 'Beta',
    },
];

const FeaturesSection = () => (
    <section id="features" className="ds-section py-20 md:py-28 border-b border-slate-200 dark:border-white/[0.05]">
        <div className="ds-grid" />
        <div className="ds-shimmer-top" />

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
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                    Features
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Everything you need to get{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
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
                        <div className="ds-card h-full p-7 flex flex-col gap-5 relative overflow-hidden transition-all duration-300">
                            {/* Badge */}
                            {f.badge && (
                                <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white border border-black/10 dark:border-white/10">
                                    {f.badge}
                                </span>
                            )}

                            <div className="relative z-10 flex items-start gap-5">
                                {/* Icon */}
                                <div className="ds-icon-box shrink-0 w-11 h-11">
                                    <f.icon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                                        {f.title}
                                    </h3>
                                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
        <div className="ds-shimmer-bottom" />
    </section>
);

export default FeaturesSection;
