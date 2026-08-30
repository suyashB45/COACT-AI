import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TiltCard } from '../ui/TiltCard';

const plans = [
    {
        name: "Starter",
        monthlyPrice: 0,
        annualPrice: 0,
        description: "Good for kicking the tires. No credit card needed.",
        features: [
            "3 practice sessions / month",
            "Basic AI feedback",
            "5 standard scenarios",
            "Community support"
        ],
        buttonText: "Start for free",
        buttonVariant: "outline" as const,
        popular: false,
        socialProof: "1,200+ free users",
    },
    {
        name: "Pro",
        monthlyPrice: 10,
        annualPrice: 8,
        description: "For individuals who are serious about getting better.",
        features: [
            "Unlimited practice sessions",
            "Advanced emotional intelligence analysis",
            "Custom scenarios",
            "Priority email support",
            "Detailed performance reports",
            "Export session transcripts"
        ],
        buttonText: "Start 14-day free trial",
        buttonVariant: "primary" as const,
        popular: true,
        socialProof: "47 teams signed up this week",
    },
    {
        name: "Enterprise",
        monthlyPrice: -1, // Custom
        annualPrice: -1,
        description: "For teams that want to move the needle on revenue performance.",
        features: [
            "Everything in Pro",
            "SSO & advanced security",
            "Dedicated success manager",
            "Custom AI model fine-tuning",
            "Team performance dashboard",
            "LMS integrations (Workday, Cornerstone)"
        ],
        buttonText: "Talk to sales",
        buttonVariant: "outline" as const,
        popular: false,
        socialProof: "Used by 12 enterprise teams",
    }
];

const PricingSection = () => {
    const navigate = useNavigate();
    const [annual, setAnnual] = useState(false);

    return (
        <section id="pricing" className="ds-section py-24 md:py-32 border-b border-white/[0.05]">
            <div className="container mx-auto px-6 max-w-6xl">
                {/* Header */}
                <motion.div
                    className="text-center max-w-2xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full ds-badge mb-6 mx-auto">
                        Pricing
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        Simple pricing. <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">No gotchas.</span>
                    </h2>
                    <p className="text-lg text-white/45 leading-relaxed">
                        Start free, upgrade when you're ready. All plans include a 14-day trial. Cancel anytime — we won't make it weird.
                    </p>
                </motion.div>

                {/* Billing Toggle */}
                <motion.div
                    className="flex items-center justify-center gap-4 mb-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-white/35'}`}>Monthly</span>
                    <button
                        onClick={() => setAnnual(!annual)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${annual ? 'bg-violet-500' : 'bg-white/10 border border-white/10'}`}
                        aria-label="Toggle annual billing"
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? 'text-white' : 'text-white/35'}`}>
                        Annual
                        <span className="text-[10px] uppercase tracking-widest font-bold bg-violet-500/20 border border-violet-500/25 px-1.5 py-0.5 rounded text-violet-300">Save 20%</span>
                    </span>
                </motion.div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-6 items-stretch">
                    {plans.map((plan, index) => {
                        const price = plan.monthlyPrice === -1
                            ? 'Custom'
                            : `$${annual ? plan.annualPrice : plan.monthlyPrice}`;
                        const isCustom = plan.monthlyPrice === -1;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={plan.popular ? 'z-10' : ''}
                            >
                                <TiltCard 
                                    maxTilt={2} 
                                    glareEnable={!plan.popular}
                                    className={`relative rounded-xl p-8 flex flex-col h-full transition-all duration-300 ${
                                        plan.popular
                                            ? 'bg-gradient-to-br from-violet-600 to-blue-700 text-white shadow-[0_0_40px_rgba(139,92,246,0.35)] scale-[1.02]'
                                            : 'bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30'
                                    }`}
                                >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="bg-[#03050D] text-violet-300 border border-violet-500/30 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-white'}`}>{plan.name}</h3>
                                    <p className={`text-sm leading-relaxed ${plan.popular ? 'text-white/80' : 'text-white/45'}`}>{plan.description}</p>
                                </div>

                                <div className="mb-2 flex items-baseline gap-1">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={price}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-4xl font-bold tracking-tight"
                                            style={{ fontFamily: 'var(--font-display)' }}
                                        >
                                            {price}
                                        </motion.span>
                                    </AnimatePresence>
                                    {!isCustom && plan.monthlyPrice > 0 && (
                                        <span className={`text-sm font-medium ${plan.popular ? 'text-white/70' : 'text-white/45'}`}>/month</span>
                                    )}
                                </div>

                                {/* Fine print */}
                                {!isCustom && plan.monthlyPrice > 0 && (
                                    <p className={`text-xs mb-6 font-medium ${plan.popular ? 'text-white/80' : 'text-white/45'}`}>
                                        {annual ? 'Billed annually' : 'Billed monthly'} · Cancel anytime
                                    </p>
                                )}
                                {!isCustom && plan.monthlyPrice === 0 && (
                                    <p className={`text-xs mb-6 font-medium ${plan.popular ? 'text-white/80' : 'text-white/45'}`}>
                                        Free forever · No credit card
                                    </p>
                                )}
                                {isCustom && (
                                    <p className={`text-xs mb-6 font-medium ${plan.popular ? 'text-white/80' : 'text-white/45'}`}>
                                        Based on team size and needs
                                    </p>
                                )}

                                <button
                                    onClick={() => plan.name === 'Enterprise' ? navigate('/contact-sales') : navigate('/login')}
                                    className={`w-full py-3 rounded-lg font-medium transition-all mb-8 text-sm ${
                                        plan.popular
                                            ? 'bg-background text-foreground hover:bg-background/90 shadow-sm'
                                            : 'bg-background border border-border text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    {plan.buttonText}
                                </button>

                                <div className="flex-grow space-y-4 pt-2">
                                    <p className={`text-xs font-bold uppercase tracking-[.12em] ${plan.popular ? 'text-white/70' : 'text-white/35'}`}>What's included</p>
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-white/80' : 'text-white/70'}`} />
                                            <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-white/35'}`}>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Social proof */}
                                <div className={`mt-8 pt-4 border-t text-[12px] font-medium text-center ${
                                    plan.popular 
                                        ? 'border-background/20 text-background/80'
                                        : 'border-border text-muted-foreground'
                                }`}>
                                    {plan.socialProof}
                                </div>
                                </TiltCard>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Guarantee */}
                <motion.div
                    className="flex items-center justify-center gap-2 mt-16 text-sm text-muted-foreground font-medium"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <ShieldCheck className="w-4 h-4 text-foreground/70" />
                    <span>30-day money-back guarantee · No questions asked</span>
                </motion.div>
            </div>
        </section>
    );
};

export default PricingSection;
