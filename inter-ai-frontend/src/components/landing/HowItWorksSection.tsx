import { Mic, MessageSquare, BarChart3 } from 'lucide-react';

const HowItWorksSection = () => {
    const steps = [
        {
            icon: Mic,
            title: "Simulate Real Scenarios",
            description: "Engage in voice-based roleplay using custom or pre-built enterprise scenarios tailored to your organizational goals."
        },
        {
            title: "Adaptive AI Responses",
            description: "Our LLM dynamically adjusts to your conversation style, providing realistic objections, tone shifts, and negotiation tactics.",
            icon: MessageSquare
        },
        {
            title: "Actionable Insights",
            description: "Instantly receive a comprehensive breakdown of your performance, including sentiment analysis, talk-track adherence, and filler words.",
            icon: BarChart3
        }
    ];

    return (
        <section className="py-24 bg-muted/20 border-y border-border" id="how-it-works">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        Built for professional growth
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        A streamlined process designed to maximize learning efficiency without unnecessary friction.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-8 left-16 right-16 h-px bg-border z-0" />

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-background border border-border shadow-sm rounded-2xl flex items-center justify-center mb-6 text-primary transition-transform group-hover:scale-105">
                                <step.icon className="w-8 h-8" />
                            </div>
                            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Step 0{index + 1}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-sm">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
