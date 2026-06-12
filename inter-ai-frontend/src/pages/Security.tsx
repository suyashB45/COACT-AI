import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Server, EyeOff, CheckCircle2 } from 'lucide-react';

const SecurityPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navigation />
            <main className="flex-1 max-w-5xl mx-auto px-4 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
                        <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                        Security & Trust Center
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        At CoAct.AI, enterprise-grade security isn't an afterthought—it's built into our core architecture. 
                        Your conversational data and intellectual property are fully protected.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-8 bg-card border border-border rounded-2xl"
                    >
                        <Lock className="w-8 h-8 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Data Encryption</h3>
                        <p className="text-muted-foreground mb-4">
                            All data is encrypted in transit and at rest using industry-standard protocols.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> AES-256 Encryption at rest</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> TLS 1.3 Encryption in transit</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Secure JWT token authentication</li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 bg-card border border-border rounded-2xl"
                    >
                        <Server className="w-8 h-8 text-purple-500 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Cloud Infrastructure</h3>
                        <p className="text-muted-foreground mb-4">
                            We host our platform on secure, modern cloud infrastructure that complies with global standards.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Isolated database environments</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Regular security patching</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> DDOS protection</li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-8 bg-card border border-border rounded-2xl"
                    >
                        <EyeOff className="w-8 h-8 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Privacy & Control</h3>
                        <p className="text-muted-foreground mb-4">
                            You own your data. We give you full control over your privacy and historical records.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Right to be forgotten (Delete Account)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No data sold to third-parties</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> GDPR ready principles</li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 bg-card border border-border rounded-2xl"
                    >
                        <ShieldCheck className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-3">Compliance Roadmap</h3>
                        <p className="text-muted-foreground mb-4">
                            We are actively committed to achieving formal enterprise compliance certifications.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Preparing for CSA STAR Level 1</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Building towards SOC 2 Type II</li>
                        </ul>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default SecurityPage;
