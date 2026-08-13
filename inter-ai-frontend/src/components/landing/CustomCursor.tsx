import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Custom pointer aura using Framer Motion springs.
 * Enhances the premium feel without replacing the native cursor.
 */
const CustomCursor = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHoveringClickable, setIsHoveringClickable] = useState(false);
    
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    
    // Spring physics for smooth following
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        // Only enable on devices with a fine pointer (mouse)
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        if (!mq.matches) return;

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 16); // Center the 32px aura
            cursorY.set(e.clientY - 16);
            if (!isVisible) setIsVisible(true);
            
            // Check if hovering over a clickable element
            const target = e.target as HTMLElement;
            const isClickable = !!target.closest('a, button, [role="button"], input, select, textarea');
            setIsHoveringClickable(isClickable);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', moveCursor);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [cursorX, cursorY, isVisible]);

    // Don't render on touch devices
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return null;
    }

    return (
        <motion.div
            className="fixed top-0 left-0 z-[99999] pointer-events-none rounded-full mix-blend-difference"
            animate={{
                scale: isHoveringClickable ? 1.8 : 1,
                opacity: isVisible ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
                x: cursorXSpring,
                y: cursorYSpring,
                width: 32,
                height: 32,
                backgroundColor: isHoveringClickable ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.4)',
            }}
        />
    );
};

export default CustomCursor;
