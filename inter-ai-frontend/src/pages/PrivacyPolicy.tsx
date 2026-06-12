import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-8">Privacy Policy</h1>
                    <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                        <p className="lead text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
                        
                        <div className="p-6 bg-card border border-border rounded-xl mt-8">
                                <h3 className="text-xl font-semibold text-foreground mb-4">A Note on Privacy</h3>
                                <p className="mb-4">
                                    <strong>About CoAct.AI:</strong> CoAct.AI is an enterprise-grade AI roleplay and coaching platform. 
                                    We provide an interactive environment for ambitious teams to practice and master critical conversations 
                                    through AI-driven simulations.
                                </p>
                                <p className="mb-4">
                                    This is a placeholder for your official Privacy Policy. To ensure full GDPR and CCPA compliance, 
                                    you should generate a legally binding privacy policy using a service like Termly.io or FreePrivacyPolicy.com 
                                    and paste the HTML or Markdown here.
                                </p>
                            <p>
                                Your policy should cover:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>What data you collect (emails, practice transcripts, etc.)</li>
                                <li>How you use the data (improving AI models, providing the service)</li>
                                <li>Who you share data with (e.g., OpenAI via API, MongoDB for storage)</li>
                                <li>User rights (Right to be forgotten, which you already support!)</li>
                                <li>Use of Cookies</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
