import { ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Scene3D from './Scene3D';

/* ── Stagger Variants ──────────────────────────────── */
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen pt-20 pb-10 lg:pt-24 lg:pb-16 overflow-hidden bg-background flex items-center">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            
            {/* Subtle Gradient Glows */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[350px] opacity-20 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute right-0 bottom-0 w-[300px] h-[300px] opacity-10 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="container relative mx-auto px-6 z-10">
                
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center max-w-7xl mx-auto">
                    {/* Left Text Content */}
                    <motion.div
                        className="flex flex-col items-center lg:items-start text-center lg:text-left z-10"
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        {/* Enterprise Badge */}
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border text-xs font-medium mb-4">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Enterprise-Ready AI Coaching Platform
                        </motion.div>

                        {/* Headline */}
                        <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
                            Master conversations that <br className="hidden md:block" />
                            <span className="text-primary">drive business results.</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl leading-relaxed">
                            Deploy scalable, AI-powered roleplay to train your revenue and leadership teams. Get real-time feedback, actionable analytics, and measurable ROI.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-6">
                            <button
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    if (user) {
                                        navigate('/practice');
                                    } else {
                                        navigate('/login');
                                    }
                                }}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                            >
                                Start Practicing
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-background text-foreground border border-border font-medium hover:bg-muted transition-all"
                            >
                                <Play className="w-4 h-4" />
                                Watch Demo
                            </button>
                        </motion.div>

                        {/* Trust Compliance Strip */}
                        <motion.div variants={fadeUp} className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span>Enterprise-Grade Security</span>
                            </div>
                            <span className="text-border">•</span>
                            <span>GDPR Ready</span>
                            <span className="text-border">•</span>
                            <span>256-bit Encryption</span>
                        </motion.div>

                        {/* Core Features */}
                        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-border w-full max-w-lg">
                            <div className="text-center lg:text-left">
                                <span className="text-2xl md:text-3xl font-bold stat-shimmer">24/7</span>
                                <p className="text-xs text-muted-foreground mt-1">Availability</p>
                            </div>
                            <div className="text-center lg:text-left">
                                <span className="text-2xl md:text-3xl font-bold stat-shimmer">&lt; 1s</span>
                                <p className="text-xs text-muted-foreground mt-1">Response Time</p>
                            </div>
                            <div className="text-center lg:text-left">
                                <span className="text-2xl md:text-3xl font-bold stat-shimmer">100%</span>
                                <p className="text-xs text-muted-foreground mt-1">Private</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right 3D Scene */}
                    <motion.div
                        className="hidden lg:flex items-center justify-center relative min-h-[340px] transform scale-100"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <Scene3D />
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
