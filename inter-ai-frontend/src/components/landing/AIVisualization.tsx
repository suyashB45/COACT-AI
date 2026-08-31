import { motion } from "framer-motion";
import { useMemo } from "react";

/* Deterministic pseudo-random nodes at specific orbit radii */
const orbits = [
    { radius: 98, count: 5, size: 6, duration: 26, clockwise: true },
    { radius: 66, count: 4, size: 5, duration: 18, clockwise: false },
    { radius: 40, count: 3, size: 4, duration: 12, clockwise: true },
];

/* Animated voice equalizer bars inside the core */
const BARS = [12, 20, 16, 28, 22, 34, 18, 26, 14, 30, 20, 16, 24, 12, 28, 18];

function Waveform() {
    return (
        <div className="flex items-end justify-center gap-[3px] h-9" aria-hidden="true">
            {BARS.map((h, i) => (
                <motion.span
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{ height: h, background: "rgba(196,181,253,0.95)", boxShadow: "0 0 8px rgba(139,92,246,0.7)" }}
                    animate={{ scaleY: [0.45, 1, 0.5, 0.9, 0.45] }}
                    transition={{
                        duration: 1.6 + (i % 5) * 0.15,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.06,
                    }}
                />
            ))}
        </div>
    );
}

export default function AIVisualization() {
    const size = 320;

    /* Pre-compute node positions around each orbit (stable across renders) */
    const orbitNodes = useMemo(
        () =>
            orbits.map((o) =>
                Array.from({ length: o.count }, (_, i) => {
                    const angle = (i / o.count) * Math.PI * 2;
                    return {
                        x: Math.cos(angle) * o.radius,
                        y: Math.sin(angle) * o.radius,
                    };
                })
            ),
        []
    );

    return (
        <div
            className="relative select-none mx-auto"
            style={{ width: size, height: size }}
            aria-label="AI voice assistant visualization"
            role="img"
        >
            {/* Ambient glow */}
            <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.28) 0%, rgba(96,165,250,0.12) 45%, transparent 70%)",
                    filter: "blur(28px)",
                }}
            />

            {/* Concentric ring decorations */}
            <div className="absolute inset-0 rounded-full border border-white/[0.04]" />

            {/* ── Orbiting rings + nodes ── */}
            {orbits.map((o, oi) => (
                <motion.div
                    key={`ring-${oi}`}
                    className="absolute left-1/2 top-1/2 pointer-events-none"
                    style={{ width: 1, height: 1 }}
                    animate={{ rotate: o.clockwise ? 360 : -360 }}
                    transition={{ duration: o.duration, repeat: Infinity, ease: "linear" }}
                >
                    {/* ring line */}
                    <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
                        style={{
                            width: o.radius * 2,
                            height: o.radius * 2,
                            left: 0,
                            top: 0,
                            borderColor: "rgba(139,92,246,0.22)",
                            borderStyle: "dashed",
                        }}
                    />
                    {/* nodes on this orbit (they inherit the rotation) */}
                    {orbitNodes[oi].map((n, ni) => (
                        <span
                            key={`node-${oi}-${ni}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                left: n.x,
                                top: n.y,
                                width: o.size,
                                height: o.size,
                                background: ni % 2 === 0 ? "#a78bfa" : "#60a5fa",
                                boxShadow: "0 0 10px rgba(139,92,246,0.8), 0 0 2px #fff",
                            }}
                        />
                    ))}
                </motion.div>
            ))}

            {/* ── Inner spinning counter-ring ── */}
            <motion.div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{ width: 1, height: 1 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        width: 88,
                        height: 88,
                        left: 0,
                        top: 0,
                        border: "1px solid rgba(139,92,246,0.28)",
                        boxShadow: "0 0 30px rgba(139,92,246,0.15), inset 0 0 30px rgba(139,92,246,0.12)",
                    }}
                />
                {/* small marker on counter-ring */}
                <span
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        left: 44,
                        top: 0,
                        width: 5,
                        height: 5,
                        background: "#c4b5fd",
                        boxShadow: "0 0 12px #a78bfa",
                    }}
                />
            </motion.div>

            {/* ── Core (center) ── */}
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle at 35% 30%, rgba(139,92,246,0.45), rgba(96,165,250,0.2) 60%, rgba(3,5,13,0.9) 100%)",
                    border: "1px solid rgba(167,139,250,0.5)",
                    boxShadow:
                        "0 0 40px rgba(139,92,246,0.45), 0 0 80px rgba(96,165,250,0.25), inset 0 0 24px rgba(139,92,246,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.18), transparent 70%)" }} />
                <motion.div
                    animate={{ opacity: [0.65, 1, 0.65] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                >
                    {/* Voice waveform */}
                    <Waveform />
                </motion.div>
            </div>

            {/* Custom cursor spot glow persists */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{ width: 120, height: 120, background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)" }}
            />
        </div>
    );
}
