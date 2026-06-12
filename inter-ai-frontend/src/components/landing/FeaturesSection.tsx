import { BarChart3, MessageSquare, Shield, Zap, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: "Real-time AI Roleplay",
        description: "Practice difficult conversations with an AI that responds naturally, adapting its tone and objections to your approach in real time.",
        icon: MessageSquare
    },
    {
        title: "Actionable Analytics",
        description: "Get immediate feedback on pacing, sentiment, confidence, and filler word usage with our comprehensive performance dashboards.",
        icon: BarChart3
    },
    {
        title: "Enterprise Security",
        description: "SOC2 compliant infrastructure with end-to-end encryption. Your conversation data is never used to train public models.",
        icon: Shield
    },
    {
        title: "Custom Scenarios",
        description: "Build roleplay environments specific to your company's products, customer objections, and internal processes.",
        icon: BrainCircuit
    },
    {
        title: "Instant Coaching Notes",
        description: "Receive AI-generated coaching insights within seconds of completing a session to accelerate your learning loop.",
        icon: Zap
    },
    {
        title: "Team Management",
        description: "Track progress across your entire team. Identify coaching opportunities and skill gaps at a glance with manager dashboards.",
        icon: Users
    }
];

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const FeaturesSection = () => {
    return (
        <section id="features" className="py-28 bg-background">
            <div className="container mx-auto px-6">
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Platform Capabilities</h2>
                    <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                        Everything you need to master critical conversations
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        A complete suite of tools designed to accelerate skill development through realistic practice and data-driven feedback.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-40px" }}
                            className="group relative bg-card border border-border rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
                        >
                            {/* Hover top accent */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/0 group-hover:bg-primary rounded-t-xl transition-all duration-300" />

                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">0{index + 1}</span>
                                    </div>
                                    <h4 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
