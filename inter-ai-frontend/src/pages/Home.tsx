import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Lock, Eye, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';

/* ── Security & Compliance Section ─────────────────── */
const securityFeatures = [
    {
        icon: ShieldCheck,
        title: "Secure Infrastructure",
        description: "Built with industry-standard security controls that prioritize your data protection and operational integrity."
    },
    {
        icon: Lock,
        title: "End-to-End Encryption",
        description: "All conversation data is encrypted with AES-256 at rest and TLS 1.3 in transit. Your data never leaves our secure infrastructure."
    },
    {
        icon: Eye,
        title: "Privacy by Design",
        description: "We never use your conversations to train public AI models. You retain full ownership of your data with complete deletion rights."
    },
    {
        icon: Server,
        title: "99.9% Uptime SLA",
        description: "Enterprise-grade reliability with redundant infrastructure, real-time monitoring, and guaranteed uptime for business-critical training."
    }
];

function SecuritySection() {
    return (
        <section className="py-28 bg-background border-t border-border">
            <div className="container mx-auto px-6">
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-sm font-semibold text-green-500 uppercase tracking-wider mb-3">Security & Compliance</h2>
                    <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                        Enterprise-grade security you can trust
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Your data security is our top priority. We meet the most stringent compliance requirements so you can focus on what matters — growth.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {securityFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="flex gap-5 p-6 bg-card border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:border-green-500/20"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08, duration: 0.5 }}
                        >
                            <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                <feature.icon className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1.5 text-sm">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

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
                <SecuritySection />
                <FAQSection />
                <CTABanner />
            </main>
            <Footer />
        </div>
    );
}

export default Home;
