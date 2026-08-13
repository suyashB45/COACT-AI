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

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="relative overflow-hidden rounded-2xl bg-foreground text-background border border-border p-12 md:p-16 flex flex-col items-center text-center max-w-5xl mx-auto shadow-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Subtle glow inside the banner */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-background/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2
                            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Your next conversation is coming.
                        </h2>
                        <p className="text-lg md:text-xl text-background/80 mb-10 leading-relaxed font-medium">
                            Whether it's a sales call, a tough negotiation, or a performance review — you'll walk in having already done it once. That makes all the difference.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => {
                                    const user = localStorage.getItem('user');
                                    navigate(user ? '/practice' : '/login');
                                }}
                                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-background text-foreground font-semibold hover:bg-background/90 transition-all shadow-sm text-[15px]"
                            >
                                Start practicing — free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-transparent text-background border border-background/20 font-medium hover:bg-background/10 transition-all text-[15px]"
                            >
                                View pricing
                            </button>
                        </div>
                        <p className="text-background/40 text-xs mt-6">
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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
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
