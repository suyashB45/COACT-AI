import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    glareEnable?: boolean;
}

export const TiltCard = ({ children, className = "", maxTilt = 10, glareEnable = true }: TiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for X and Y coordinates (normalized from -1 to 1)
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs for fluid movement
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    // Transform raw values into degrees of rotation
    const rotateX = useTransform(ySpring, [-1, 1], [maxTilt, -maxTilt]);
    const rotateY = useTransform(xSpring, [-1, 1], [-maxTilt, maxTilt]);

    // Calculate glare opacity and position
    const glareOpacity = useTransform(ySpring, [-1, 1], [0, 0.5]);
    const glareX = useTransform(xSpring, [-1, 1], ['0%', '100%']);
    const glareY = useTransform(ySpring, [-1, 1], ['0%', '100%']);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        
        const rect = ref.current.getBoundingClientRect();
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Normalize coordinates between -1 and 1
        const normalizedX = (e.clientX - centerX) / (rect.width / 2);
        const normalizedY = (e.clientY - centerY) / (rect.height / 2);
        
        x.set(normalizedX);
        y.set(normalizedY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 1000,
            }}
            className={`relative overflow-hidden ${className}`}
        >
            {/* The actual content */}
            {children}

            {/* Premium Glare Effect */}
            {glareEnable && (
                <motion.div
                    className="pointer-events-none absolute inset-0 z-50 rounded-inherit mix-blend-soft-light"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%)',
                        opacity: isHovered ? glareOpacity : 0,
                        left: `calc(${glareX} - 50%)`,
                        top: `calc(${glareY} - 50%)`,
                        width: '200%',
                        height: '200%',
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}
        </motion.div>
    );
};
