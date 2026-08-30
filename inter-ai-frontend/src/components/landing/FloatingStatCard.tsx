import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingStatCardProps {
    value: string;
    label: string;
    badge?: string;
    icon?: ReactNode;
    className?: string;
    floatDelay?: number;
    floatDuration?: number;
    floatDistance?: number;
}

export default function FloatingStatCard({
    value,
    label,
    badge,
    icon,
    className = '',
    floatDelay = 0,
    floatDuration = 3.5,
    floatDistance = 8,
}: FloatingStatCardProps) {
    return (
        <motion.div
            className={`relative w-fit rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3.5 ${className}`}
            style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18), 0 1px 0 rgba(255,255,255,0.8) inset',
                border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{
                opacity: 1,
                y: [0, -floatDistance, 0],
            }}
            transition={{
                opacity: { duration: 0.5, delay: floatDelay },
                y: {
                    duration: floatDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: floatDelay,
                },
            }}
        >
            {badge && (
                <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-violet-700 whitespace-nowrap">
                    ★ {badge}
                </span>
            )}
            {icon && <div className="mb-1">{icon}</div>}
            {value && (
                <p className="text-xl sm:text-2xl font-black leading-none tracking-tight text-gray-900">
                    {value}
                </p>
            )}
            {label && (
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 leading-tight whitespace-nowrap">
                    {label}
                </p>
            )}
        </motion.div>
    );
}
