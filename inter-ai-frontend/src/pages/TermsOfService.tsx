import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-8">Terms of Service</h1>
                    <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                        <p className="lead text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
                        
                        <div className="p-6 bg-card border border-border rounded-xl mt-8">
                            <h3 className="text-xl font-semibold text-foreground mb-4">A Note on Terms of Service</h3>
                            <p className="mb-4">
                                This is a placeholder for your official Terms of Service. It outlines the rules and guidelines 
                                for using the CoAct.AI platform. You should generate a legally binding Terms of Service agreement 
                                using a service like Termly.io or FreePrivacyPolicy.com and paste the HTML or Markdown here.
                            </p>
                            <p>
                                Your terms should cover:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Acceptable use of the AI coaching platform</li>
                                <li>Account creation and security responsibilities</li>
                                <li>Intellectual property (who owns the AI generated feedback)</li>
                                <li>Limitation of liability (e.g., "AI feedback is not professional legal/medical advice")</li>
                                <li>Termination clauses</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
