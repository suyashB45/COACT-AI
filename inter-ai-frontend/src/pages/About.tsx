import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { Building2, Users, Target } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-5xl mx-auto px-4 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                        About CoAct.AI
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        We're on a mission to democratize elite coaching for enterprise teams through the power of artificial intelligence.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border p-8 rounded-2xl text-center"
                    >
                        <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Our Mission</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            To empower every professional to master critical conversations before they happen in the real world.
                        </p>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border p-8 rounded-2xl text-center"
                    >
                        <Users className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Our Team</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Built by a team of AI researchers, enterprise sales leaders, and executive coaches.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border p-8 rounded-2xl text-center"
                    >
                        <Target className="w-10 h-10 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Our Vision</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            A future where continuous, personalized coaching is available to everyone, instantly.
                        </p>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
