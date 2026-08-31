import { BriefcaseBusiness, Handshake, MessageSquare, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

const useCases = [
    {
        title: 'Prepare for an objection',
        description: 'Practice a buyer who is skeptical about price, timing, or switching tools. Try a few approaches before the real call.',
        prompt: '"We already have a solution."',
        icon: Handshake,
        color: 'violet',
    },
    {
        title: 'Rehearse difficult feedback',
        description: 'Work through a sensitive conversation with a direct report or colleague, and find language that is clear without being cold.',
        prompt: '"I want to talk about what happened in the meeting."',
        icon: UsersRound,
        color: 'blue',
    },
    {
        title: 'Walk into an interview ready',
        description: 'Answer follow-up questions, explain your experience, and get comfortable speaking about your work without memorising a script.',
        prompt: '"Tell me about a time you changed someone\'s mind."',
        icon: BriefcaseBusiness,
        color: 'cyan',
    },
];

const colorMap: Record<string, { icon: string; prompt: string; glow: string; ring: string }> = {
    violet: {
        icon: 'text-violet-500 dark:text-violet-400',
        prompt: 'border-violet-500/30 dark:border-violet-500/20 bg-violet-500/[0.07] text-violet-700 dark:text-violet-200',
        glow: 'rgba(139,92,246,0.12)',
        ring: 'rgba(139,92,246,0.25)',
    },
    blue: {
        icon: 'text-blue-500 dark:text-blue-400',
        prompt: 'border-blue-500/30 dark:border-blue-500/20 bg-blue-500/[0.07] text-blue-700 dark:text-blue-200',
        glow: 'rgba(96,165,250,0.1)',
        ring: 'rgba(96,165,250,0.2)',
    },
    cyan: {
        icon: 'text-cyan-500 dark:text-cyan-400',
        prompt: 'border-cyan-500/30 dark:border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-700 dark:text-cyan-200',
        glow: 'rgba(34,211,238,0.08)',
        ring: 'rgba(34,211,238,0.18)',
    },
};

const TestimonialsSection = () => (
    <section className="ds-section py-20 md:py-28 border-b border-slate-200 dark:border-white/[0.05]">
        <div className="ds-grid" />
        <div className="ds-shimmer-top" />

        {/* Left violet glow */}
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-20 w-[400px] h-[400px] rounded-full z-0"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 container mx-auto px-6 max-w-6xl">
            {/* Header */}
            <motion.div
                className="max-w-2xl mb-14"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
            >
                <div className="ds-badge mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                    Put It To Work
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-foreground dark:text-white tracking-tight leading-[1.08]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Practice the conversation,{' '}
                    <span className="bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                        not a generic script.
                    </span>
                </h2>
                <p className="mt-5 text-lg ds-muted leading-relaxed">
                    Start with a real situation and give the other side a point of view. CoAct gives you a low-pressure place to try, adjust, and try again.
                </p>
            </motion.div>

            {/* Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {useCases.map((uc, i) => {
                    const c = colorMap[uc.color];
                    return (
                        <motion.article
                            key={uc.title}
                            className="group relative ds-card p-7 flex flex-col overflow-hidden"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            style={{ '--glow': c.glow, '--ring': c.ring } as any}
                        >
                            {/* Hover glow overlay */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ background: `radial-gradient(circle at 30% 30%, ${c.glow}, transparent 70%)` }} />

                            {/* Icon */}
                            <div className={`ds-icon-box w-11 h-11 mb-6`}>
                                <uc.icon className={`w-5 h-5 ${c.icon}`} />
                            </div>

                            <h3 className="text-lg font-bold text-foreground dark:text-white tracking-tight mb-3">
                                {uc.title}
                            </h3>
                            <p className="text-[14px] ds-muted leading-relaxed flex-1">
                                {uc.description}
                            </p>

                            {/* Prompt chip */}
                            <div className={`mt-6 rounded-xl border px-4 py-3 text-[13px] font-medium leading-relaxed flex items-start gap-2 ${c.prompt}`}>
                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                                <span className="italic opacity-80">{uc.prompt}</span>
                            </div>
                        </motion.article>
                    );
                })}
            </div>
        </div>
        <div className="ds-shimmer-bottom" />
    </section>
);

export default TestimonialsSection;
