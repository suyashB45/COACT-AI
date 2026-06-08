import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';

const FeaturesSection = () => {
    const features = [
        {
            title: "Real-time AI Roleplay",
            description: "Practice difficult conversations with an AI that responds naturally, adapting its tone and objections to your approach.",
            icon: <MessageSquare className="w-6 h-6 text-primary" />
        },
        {
            title: "Actionable Analytics",
            description: "Get immediate feedback on pacing, sentiment, confidence, and filler word usage with our comprehensive dashboards.",
            icon: <BarChart3 className="w-6 h-6 text-primary" />
        },
        {
            title: "Enterprise Security",
            description: "SOC2 compliant infrastructure with end-to-end encryption. Your conversation data is never used to train public models.",
            icon: <Shield className="w-6 h-6 text-primary" />
        },
        {
            title: "Custom Scenarios",
            description: "Build roleplay environments specific to your company's products, customer objections, and internal processes.",
            icon: <BrainCircuit className="w-6 h-6 text-primary" />
        },
        {
            title: "Instant Performance Feedback",
            description: "Receive AI-generated coaching notes within seconds of completing a session to accelerate your learning loop.",
            icon: <Zap className="w-6 h-6 text-primary" />
        },
        {
            title: "Team Management",
            description: "Track progress across your entire sales or leadership team. Identify coaching opportunities and skill gaps at a glance.",
            icon: <Users className="w-6 h-6 text-primary" />
        }
    ];

    return (
        <section id="features" className="py-24 bg-background">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Platform Capabilities</h2>
                    <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                        Everything you need to master critical conversations
                    </h3>
                    <p className="text-lg text-muted-foreground">
                        A complete suite of tools designed to accelerate skill development through realistic practice and data-driven feedback.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-card border border-border rounded-xl p-8 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
