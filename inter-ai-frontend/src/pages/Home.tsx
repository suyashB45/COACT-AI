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
        <section className="ds-section py-20 md:py-28 border-b border-white/[0.05]">
            <div className="ds-grid" />
            <div className="ds-shimmer-top" />

            {/* Violet radial center */}
            <div className="pointer-events-none absolute inset-0 z-0"
                style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.14) 0%, transparent 65%)' }} />

            <div className="relative z-10 container mx-auto px-6 max-w-5xl">
                <motion.div
                    className="relative overflow-hidden rounded-2xl p-12 md:p-16 flex flex-col items-center text-center border border-white/[0.07] shadow-[0_0_80px_rgba(139,92,246,0.15)]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(3,5,13,0.9) 40%, rgba(3,5,13,0.95) 60%, rgba(96,165,250,0.08) 100%)',
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Shimmer top */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                    {/* Corner glows */}
                    <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="ds-badge mx-auto mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                            Start Free Today
                        </div>
                        <h2
                            className="text-4xl md:text-5xl font-black mb-5 tracking-tight text-white leading-[1.05]"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Your next conversation{' '}
                            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                                is coming.
                            </span>
                        </h2>
                        <p className="text-lg text-white/55 mb-10 leading-relaxed">
                            Whether it's a sales call, a tough negotiation, or a performance review — you'll walk in having already done it once. That makes all the difference.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    navigate(user ? '/practice' : '/login');
                                }}
                                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white transition-all text-[15px]
                                    bg-gradient-to-r from-violet-600 to-blue-600
                                    shadow-[0_0_24px_rgba(139,92,246,0.45)]
                                    hover:shadow-[0_0_36px_rgba(139,92,246,0.65)]
                                    hover:-translate-y-0.5"
                            >
                                Start practicing — free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl border border-white/[0.12] text-white/70 font-medium hover:bg-white/[0.07] hover:text-white hover:border-white/20 transition-all text-[15px]"
                            >
                                View pricing
                            </button>
                        </div>
                        <p className="text-white/30 text-sm mt-6">
                            No credit card required · Set up in under 2 minutes
                        </p>
                    </div>
                </motion.div>
            </div>
            <div className="ds-shimmer-bottom" />
        </section>
    );
}

/* ── Home Page ─────────────────────────────────────── */
function Home() {
    return (
        <div className="landing-readable min-h-screen font-sans selection:bg-violet-500/20" style={{ background: '#03050D' }}>
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
