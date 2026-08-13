import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
    value: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export const AnimatedCounter = ({ value, className = "", prefix = "", suffix = "" }: AnimatedCounterProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        mass: 1
    });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [motionValue, isInView, value]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = `${prefix}${Intl.NumberFormat('en-US').format(Math.floor(latest))}${suffix}`;
            }
        });
    }, [springValue, prefix, suffix]);

    return <motion.span ref={ref} className={className} />;
};
