import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from 'framer-motion';

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    magneticPull?: number; // How strong the pull is
}

export const MagneticButton = ({ children, magneticPull = 15, className, ...props }: MagneticButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        
        // Calculate center of button
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Distance from center
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        // Move button slightly towards the cursor
        x.set(distanceX * (magneticPull / 100));
        y.set(distanceY * (magneticPull / 100));
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: xSpring, y: ySpring }}
            className={`relative ${className}`}
            {...props}
        >
            {/* The inner content counter-animates slightly for a parallax feel */}
            <motion.div
                style={{
                    x: useTransform(xSpring, (val) => val * 0.5),
                    y: useTransform(ySpring, (val) => val * 0.5)
                }}
                className="flex items-center justify-center w-full h-full gap-2.5"
            >
                {children}
            </motion.div>
        </motion.button>
    );
};
