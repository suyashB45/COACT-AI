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


/* ── CTA Banner Section ────────────────────────────── */
function CTABanner() {
    const navigate = useNavigate();

    return (
        <section className="py-20 bg-background">
            <div className="container mx-auto px-6">
                <motion.div
                    className="relative overflow-hidden rounded-2xl bg-primary/[0.04] border border-primary/15 p-12 md:p-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Subtle background accent */}
                    <div className="absolute right-0 top-0 w-[300px] h-[300px] opacity-[0.06] bg-primary organic-blob blur-[80px] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl">
                        <h2
                            className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Ready to stop winging it?
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground mb-2 leading-relaxed">
                            Join hundreds of teams using CoAct to actually prepare for conversations that matter.
                        </p>
                        <p className="hand-note text-base mb-8 -rotate-1">
                            ↳ your future self will thank you
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/practice')}
                                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-[15px]"
                            >
                                Try it free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-background text-foreground border border-border font-medium hover:bg-muted transition-all text-[15px]"
                            >
                                View Pricing
                            </button>
                        </div>
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

            <Navigation />
            <main>
                <HeroSection />
                <TestimonialsSection />
                <FeaturesSection />
                <HowItWorksSection />
                <PricingSection />
                <FAQSection />
                <CTABanner />
            </main>
            <Footer />
        </div>
    );
}

export default Home;
