import { motion } from 'framer-motion';

/* ── Orbiting Node ── */
interface OrbitNodeProps {
    orbitRadius: number;
    angle: number;
    duration: number;
    delay?: number;
    size?: number;
    color?: string;
}

function OrbitNode({ orbitRadius, angle, duration, delay = 0, size = 6, color = '#a78bfa' }: OrbitNodeProps) {
    return (
        <motion.div
            className="absolute"
            style={{
                width: orbitRadius * 2,
                height: orbitRadius * 2,
                top: '50%',
                left: '50%',
                marginTop: -orbitRadius,
                marginLeft: -orbitRadius,
                borderRadius: '50%',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
        >
            <div
                style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 ${size * 2}px ${color}`,
                    top: '50%',
                    left: '100%',
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    marginLeft: -size / 2,
                }}
            />
        </motion.div>
    );
}

/* ── Waveform bars ── */
function Waveform() {
    const bars = [3, 6, 9, 12, 9, 13, 7, 11, 5, 8, 12, 6, 10, 4, 7];
    return (
        <div className="flex items-center justify-center gap-[2.5px]">
            {bars.map((h, i) => (
                <motion.div
                    key={i}
                    className="w-[2px] rounded-full"
                    style={{
                        height: h,
                        background: 'linear-gradient(180deg, #a78bfa, #60a5fa)',
                        boxShadow: '0 0 4px rgba(167,139,250,0.6)',
                    }}
                    animate={{ scaleY: [1, 0.35, 1.4, 0.6, 1] }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.09,
                    }}
                />
            ))}
        </div>
    );
}

/* ── Main Component ── */
export default function AIVisualization() {
    const size = 320; // total canvas size
    const cx = size / 2;

    return (
        <div
            className="relative select-none"
            style={{ width: size, height: size }}
            aria-hidden="true"
        >
            {/* ── Outer ambient glow ── */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, rgba(96,165,250,0.08) 45%, transparent 70%)',
                    filter: 'blur(18px)',
                }}
            />

            {/* ── SVG concentric circles ── */}
            <svg
                className="absolute inset-0"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                fill="none"
            >
                {/* outermost ring – slowest rotate */}
                <motion.circle
                    cx={cx} cy={cx} r={148}
                    stroke="rgba(139,92,246,0.12)"
                    strokeWidth="1"
                    strokeDasharray="6 8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: `${cx}px ${cx}px` }}
                />
                {/* second ring */}
                <motion.circle
                    cx={cx} cy={cx} r={122}
                    stroke="rgba(139,92,246,0.18)"
                    strokeWidth="0.75"
                    strokeDasharray="4 6"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: `${cx}px ${cx}px` }}
                />
                {/* third ring – solid purple neon */}
                <motion.circle
                    cx={cx} cy={cx} r={96}
                    stroke="rgba(139,92,246,0.3)"
                    strokeWidth="1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: `${cx}px ${cx}px` }}
                />
                {/* fourth ring */}
                <motion.circle
                    cx={cx} cy={cx} r={70}
                    stroke="rgba(96,165,250,0.25)"
                    strokeWidth="0.75"
                    strokeDasharray="3 5"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: `${cx}px ${cx}px` }}
                />
                {/* inner ring */}
                <circle
                    cx={cx} cy={cx} r={50}
                    stroke="rgba(139,92,246,0.4)"
                    strokeWidth="1"
                />
            </svg>

            {/* ── Orbiting nodes ── */}
            {/* outer orbit nodes */}
            <OrbitNode orbitRadius={148} angle={0}   duration={28} delay={0}   size={5} color="#a78bfa" />
            <OrbitNode orbitRadius={148} angle={180} duration={28} delay={0}   size={4} color="#60a5fa" />
            <OrbitNode orbitRadius={148} angle={90}  duration={28} delay={4}   size={3} color="#c4b5fd" />
            {/* middle orbit nodes */}
            <OrbitNode orbitRadius={96}  angle={60}  duration={18} delay={0}   size={5.5} color="#818cf8" />
            <OrbitNode orbitRadius={96}  angle={240} duration={18} delay={2}   size={4}   color="#38bdf8" />
            {/* inner orbit nodes */}
            <OrbitNode orbitRadius={70}  angle={30}  duration={12} delay={1}   size={4} color="#c084fc" />
            <OrbitNode orbitRadius={70}  angle={210} duration={12} delay={0}   size={3} color="#7dd3fc" />

            {/* ── Center circle + waveform ── */}
            <div
                className="absolute"
                style={{
                    width: 88,
                    height: 88,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                {/* pulsing glow behind center */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
                    }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* circle border */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border: '1.5px solid rgba(139,92,246,0.55)',
                        background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.15) 0%, rgba(3,5,13,0.85) 60%)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 20px rgba(139,92,246,0.25), inset 0 0 16px rgba(139,92,246,0.1)',
                    }}
                />
                {/* waveform content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Waveform />
                </div>
            </div>

            {/* ── Subtle scanline overlay ── */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.015) 2px, rgba(139,92,246,0.015) 4px)',
                }}
            />
        </div>
    );
}
