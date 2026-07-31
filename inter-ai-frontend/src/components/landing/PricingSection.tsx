import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const plans = [
    {
        name: "Starter",
        monthlyPrice: 0,
        annualPrice: 0,
        description: "Perfect for trying things out. No strings attached.",
        features: [
            "3 practice sessions / month",
            "Basic AI feedback",
            "Standard scenarios",
            "Email support"
        ],
        buttonText: "Start for free",
        buttonVariant: "outline" as const,
        popular: false,
    },
    {
        name: "Pro",
        monthlyPrice: 10,
        annualPrice: 8,
        description: "For people serious about getting better at conversations.",
        features: [
            "Unlimited practice sessions",
            "Advanced emotional intelligence analysis",
            "Custom scenarios",
            "Priority support",
            "Detailed performance reports"
        ],
        buttonText: "Start 14-day trial",
        buttonVariant: "primary" as const,
        popular: true,
    },
    {
        name: "Enterprise",
        monthlyPrice: -1, // Custom
        annualPrice: -1,
        description: "For teams who want to move the needle on revenue performance.",
        features: [
            "Everything in Pro",
            "SSO & Advanced Security",
            "Dedicated Success Manager",
            "Custom AI model fine-tuning",
            "Team performance dashboard",
            "LMS Integrations"
        ],
        buttonText: "Talk to us",
        buttonVariant: "outline" as const,
        popular: false,
    }
];

const PricingSection = () => {
    const navigate = useNavigate();
    const [annual, setAnnual] = useState(false);

    return (
        <section id="pricing" className="py-24 md:py-32 bg-background relative">
            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center max-w-2xl mx-auto mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        No surprises. <span className="text-muted-foreground">Pick a plan.</span>
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                        Start free. Upgrade when you're ready. Cancel anytime — we won't make it weird.
                    </p>
                </motion.div>

                {/* Billing Toggle */}
                <motion.div
                    className="flex items-center justify-center gap-4 mb-14"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <span className={`text-sm font-medium transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                    <button
                        onClick={() => setAnnual(!annual)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${annual ? 'bg-primary' : 'bg-border'}`}
                        aria-label="Toggle annual billing"
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Annual
                        <span className="hand-note text-xs ml-1.5 text-annotation">(save 20%)</span>
                    </span>
                </motion.div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
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
                                className={`relative bg-card border rounded-2xl p-7 md:p-8 flex flex-col transition-all duration-300 ${
                                    plan.popular
                                        ? 'border-primary shadow-xl shadow-primary/10 md:scale-[1.03] z-10'
                                        : 'border-border hover:shadow-lg hover:border-border'
                                } ${index === 0 ? 'card-tilt-3' : index === 2 ? 'card-tilt-1' : ''}`}
                            >
                                {/* Handwritten "best value" annotation */}
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                                        <span className="hand-note text-base md:text-lg bg-background border border-primary/30 text-primary px-3 py-0.5 rounded-lg shadow-sm inline-block -rotate-2">
                                            ← best value
                                        </span>
                                    </div>
                                )}

                                <div className="mb-5">
                                    <h3 className="text-lg font-semibold mb-1.5 text-foreground">{plan.name}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                                </div>

                                <div className="mb-6 flex items-baseline gap-1">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={price}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-4xl font-bold text-foreground"
                                            style={{ fontFamily: 'var(--font-display)' }}
                                        >
                                            {price}
                                        </motion.span>
                                    </AnimatePresence>
                                    {!isCustom && plan.monthlyPrice > 0 && (
                                        <span className="text-muted-foreground text-sm">/month</span>
                                    )}
                                </div>

                                {/* Annual savings note */}
                                {annual && !isCustom && plan.monthlyPrice > 0 && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-xs text-success font-medium -mt-4 mb-4"
                                    >
                                        You save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                                    </motion.p>
                                )}

                                <button
                                    onClick={() => plan.name === 'Enterprise' ? navigate('/contact-sales') : navigate('/login')}
                                    className={`w-full py-3 rounded-xl font-medium transition-all mb-8 text-sm ${
                                        plan.buttonVariant === 'primary'
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20'
                                            : 'bg-transparent border border-border text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {plan.buttonText}
                                </button>

                                <div className="flex-grow space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What's included:</p>
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                            <span className="text-sm text-muted-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Guarantee */}
                <motion.div
                    className="flex items-center justify-center gap-3 mt-14 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <ShieldCheck className="w-5 h-5 text-success" />
                    <span>30-day money-back guarantee · No credit card for Starter</span>
                </motion.div>
            </div>
        </section>
    );
};

export default PricingSection;
