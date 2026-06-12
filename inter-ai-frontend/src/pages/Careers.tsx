import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';

const Careers: React.FC = () => {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                        Careers at CoAct
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Join us in building the future of enterprise coaching. We're looking for passionate builders, designers, and thinkers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border p-12 rounded-2xl text-center"
                >
                    <div className="mb-6">
                        <span className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                            <span className="text-2xl">🚀</span>
                        </span>
                        <h3 className="text-2xl font-bold text-foreground mb-2">No open positions right now</h3>
                        <p className="text-muted-foreground">
                            We are currently fully staffed, but we're always on the lookout for incredible talent. 
                            Check back soon or drop us your resume.
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                        Send Open Application
                    </button>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default Careers;
