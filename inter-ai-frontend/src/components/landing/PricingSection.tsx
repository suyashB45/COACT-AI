import { Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const plans = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for individuals looking to improve communication skills.",
        features: [
            "3 practice sessions per month",
            "Basic AI feedback",
            "Standard scenarios",
            "Email support"
        ],
        buttonText: "Get Started Free",
        buttonVariant: "outline" as const
    },
    {
        name: "Pro",
        price: "$10",
        period: "/month",
        description: "For professionals wanting advanced analytics and unlimited practice.",
        features: [
            "Unlimited practice sessions",
            "Advanced emotional intelligence analysis",
            "Custom scenarios",
            "Priority email & chat support",
            "Detailed performance reports"
        ],
        buttonText: "Start 14-Day Trial",
        buttonVariant: "primary" as const,
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Dedicated solutions for large organizations and teams.",
        features: [
            "Everything in Pro",
            "SSO & Advanced Security",
            "Dedicated Success Manager",
            "Custom AI model fine-tuning",
            "Team performance dashboard",
            "LMS Integrations"
        ],
        buttonText: "Contact Sales",
        buttonVariant: "outline" as const
    }
];

const PricingSection = () => {
    const navigate = useNavigate();

    return (
        <section id="pricing" className="py-28 bg-background">
            <div className="container mx-auto px-6">
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</h2>
                    <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                        Simple, transparent pricing
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Choose the plan that fits your needs. No hidden fees. Scale as you grow.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`relative bg-card border rounded-xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                                plan.popular 
                                ? 'border-primary shadow-lg shadow-primary/10 md:scale-105 z-10' 
                                : 'border-border hover:shadow-md hover:border-border'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                                    Most Popular
                                </div>
                            )}
                            
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-1.5 text-foreground">{plan.name}</h3>
                                <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                            </div>
                            
                            <div className="mb-6 flex items-baseline">
                                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                {plan.period && <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>}
                            </div>
                            
                            <button 
                                onClick={() => navigate('/login')}
                                className={`w-full py-3 rounded-lg font-medium transition-all mb-8 text-sm ${
                                    plan.buttonVariant === 'primary' 
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20' 
                                    : 'bg-transparent border border-border text-foreground hover:bg-muted'
                                }`}
                            >
                                {plan.buttonText}
                            </button>
                            
                            <div className="flex-grow space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Includes:</p>
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-sm text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Money-back Guarantee */}
                <motion.div
                    className="flex items-center justify-center gap-3 mt-12 text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span>30-day money-back guarantee · No credit card required for Starter plan</span>
                </motion.div>
            </div>
        </section>
    );
};

export default PricingSection;
