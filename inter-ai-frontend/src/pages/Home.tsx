import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
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
                    className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/20 p-12 md:p-16 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary),transparent)] opacity-[0.05] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                            Ready to transform your team's performance?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            Join 500+ teams already using CoAct AI to master critical business conversations. Start your free trial today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/practice')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                Start Free Trial
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-background text-foreground border border-border font-medium hover:bg-muted transition-all"
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
