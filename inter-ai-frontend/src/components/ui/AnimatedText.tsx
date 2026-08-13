import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTextProps {
    words: string[];
    interval?: number;
    className?: string;
}

export const AnimatedText = ({ words, interval = 3000, className = "" }: AnimatedTextProps) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, interval);
        return () => clearInterval(timer);
    }, [words.length, interval]);

    return (
        <span className={`inline-grid ${className}`}>
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="col-start-1 row-start-1"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};
