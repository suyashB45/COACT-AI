import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Scene3D from './Scene3D';

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-32 overflow-hidden bg-background">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            {/* Subtle Gradient Glows */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] opacity-30 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="container relative mx-auto px-6 z-10">
                
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
                    {/* Left Text Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border text-sm font-medium mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                            Introducing Enterprise Coaching AI
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8">
                            Master conversations that <br className="hidden md:block" />
                            <span className="text-primary">drive business results.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                            Deploy scalable, AI-powered roleplay to train your revenue and leadership teams. Get real-time feedback and actionable analytics.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/practice')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                Start Practicing
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-background text-foreground border border-border font-medium hover:bg-muted transition-colors shadow-sm"
                            >
                                <Play className="w-4 h-4" />
                                Watch Demo
                            </button>
                        </div>
                    </div>

                    {/* Right 3D Scene */}
                    <div className="hidden lg:flex items-center justify-center relative min-h-[500px] transform scale-[1.3] translate-y-8">
                        <Scene3D />
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
