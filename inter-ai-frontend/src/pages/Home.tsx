import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import TrustLogosSection from '../components/landing/TrustLogosSection';
import CustomCursor from '../components/landing/CustomCursor';
import PracticePreview from '../components/landing/PracticePreview';

/* ── CTA Banner Section ────────────────────────────── */
function CTABanner() {
    const navigate = useNavigate();

    return (
        <section className="py-20 md:py-28 bg-background relative border-b border-border">
            {/* Minimal Grid Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

            <div className="landing-readable container mx-auto px-6 relative z-10">
                <motion.div
                    className="relative overflow-hidden rounded-2xl border border-[#2a5c3f]/60 p-12 md:p-16 flex flex-col items-center text-center max-w-5xl mx-auto shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #0d2318 0%, #193c2a 40%, #1e4a33 60%, #152e22 100%)',
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Top shimmer line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5f9d76]/60 to-transparent" />
                    {/* Central green glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(95,157,118,0.18)_0%,transparent_65%)] blur-2xl rounded-full pointer-events-none" />
                    {/* Gold accent glow bottom-right */}
                    <div className="absolute bottom-0 right-0 w-[350px] h-[200px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(219,185,106,0.12)_0%,transparent_70%)] blur-xl rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto text-white">
                        <h2
                            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Your next conversation is coming.
                        </h2>
                        <p className="text-lg md:text-xl text-white/75 mb-10 leading-relaxed font-medium">
                            Whether it's a sales call, a tough negotiation, or a performance review — you'll walk in having already done it once. That makes all the difference.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    navigate(user ? '/practice' : '/login');
                                }}
                                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-white text-[#193c2a] font-semibold hover:bg-white/90 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-[15px]"
                            >
                                Start practicing — free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-transparent text-white border border-white/25 font-medium hover:bg-white/10 transition-all text-[15px]"
                            >
                                View pricing
                            </button>
                        </div>
                        <p className="text-white/50 text-sm mt-6 font-medium">
                            No credit card required · Set up in under 2 minutes
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ── Home Page ─────────────────────────────────────── */
function Home() {
    return (
        <div className="landing-readable min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <CustomCursor />
            <Navigation />
            <main>
                <HeroSection />
                <TrustLogosSection />
                <PracticePreview />
                <FeaturesSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <PricingSection />
                <FAQSection />
                <CTABanner />
            </main>
            <Footer />
        </div>
    );
}

export default Home;
