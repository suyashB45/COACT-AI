import { useEffect, useRef } from 'react';

/**
 * Custom dot cursor with trailing glow — desktop only.
 * Gives the page a hand-crafted, boutique feel.
 */
const CustomCursor = () => {
    const dotRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 0, y: 0 });
    const glowPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Only on devices with a fine pointer (mouse)
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        if (!mq.matches) return;

        const onMove = (e: MouseEvent) => {
            pos.current = { x: e.clientX, y: e.clientY };
        };

        let raf: number;
        const animate = () => {
            // Dot follows instantly
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${pos.current.x - 5}px, ${pos.current.y - 5}px)`;
            }
            // Glow trails behind with lerp
            glowPos.current.x += (pos.current.x - glowPos.current.x) * 0.15;
            glowPos.current.y += (pos.current.y - glowPos.current.y) * 0.15;
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${glowPos.current.x - 18}px, ${glowPos.current.y - 18}px)`;
            }
            raf = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMove);
        raf = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf);
        };
    }, []);

    // Don't render on touch devices
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return null;
    }

    return (
        <>
            {/* Dot */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 z-[100000] pointer-events-none mix-blend-difference"
                style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'white', willChange: 'transform' }}
            />
            {/* Trailing glow */}
            <div
                ref={glowRef}
                className="fixed top-0 left-0 z-[99999] pointer-events-none"
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                    willChange: 'transform',
                }}
            />
        </>
    );
};

export default CustomCursor;
