import { motion } from 'framer-motion';

const practiceAreas = [
    'Sales Calls', 'Negotiations', 'Job Interviews', 'Difficult Feedback',
    'Leadership Conversations', 'Client Escalations', 'Performance Reviews',
    'Salary Discussions', 'Conflict Resolution', 'Executive Presence',
    'Cold Outreach', 'Team Alignment',
];

// Duplicate for seamless infinite scroll
const items = [...practiceAreas, ...practiceAreas];

const TrustLogosSection = () => (
    <section className="ds-section py-10 border-b border-white/[0.06] overflow-hidden">
        <div className="ds-shimmer-top" />

        {/* Label */}
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/25 mb-6 px-4">
            Built for every conversation that deserves a little rehearsal
        </p>

        {/* Scrolling strip */}
        <div className="relative">
            {/* Fade masks */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10"
                style={{ background: 'linear-gradient(90deg, #03050D, transparent)' }} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10"
                style={{ background: 'linear-gradient(-90deg, #03050D, transparent)' }} />

            <motion.div
                className="flex gap-3 w-max"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
                {items.map((area, i) => (
                    <span
                        key={i}
                        className="flex-shrink-0 rounded-full border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/55 whitespace-nowrap"
                    >
                        {area}
                    </span>
                ))}
            </motion.div>
        </div>

        <div className="ds-shimmer-bottom" />
    </section>
);

export default TrustLogosSection;
