import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingSection: React.FC = () => {
    const navigate = useNavigate();

    const plans = [
        {
            name: "Starter",
            price: "$0",
            description: "Perfect for individuals looking to improve communication skills.",
            features: [
                "5 practice sessions per month",
                "Basic AI feedback",
                "Standard scenarios",
                "Email support"
            ],
            buttonText: "Get Started Free",
            buttonVariant: "outline"
        },
        {
            name: "Pro",
            price: "$29",
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
            buttonVariant: "primary",
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
            buttonVariant: "outline"
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-background">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Choose the plan that fits your needs. Scale as you grow.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div 
                            key={index} 
                            className={`relative bg-card border rounded-2xl p-8 flex flex-col ${
                                plan.popular 
                                ? 'border-primary shadow-lg scale-105 z-10' 
                                : 'border-border shadow-sm'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                    Most Popular
                                </div>
                            )}
                            
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                            </div>
                            
                            <div className="mb-6 flex items-baseline">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                            </div>
                            
                            <button 
                                onClick={() => navigate('/login')}
                                className={`w-full py-3 rounded-lg font-medium transition-colors mb-8 ${
                                    plan.buttonVariant === 'primary' 
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                    : 'bg-transparent border border-border text-foreground hover:bg-muted'
                                }`}
                            >
                                {plan.buttonText}
                            </button>
                            
                            <div className="flex-grow space-y-4">
                                <p className="text-sm font-medium text-foreground uppercase tracking-wider">Includes:</p>
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start">
                                        <Check className="w-5 h-5 text-primary shrink-0 mr-3" />
                                        <span className="text-sm text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
