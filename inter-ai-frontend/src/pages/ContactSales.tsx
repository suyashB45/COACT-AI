import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';

const ContactSales: React.FC = () => {
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
                        Contact Sales
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Ready to level up your team's communication? Talk to our enterprise experts to set up a custom pilot.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl mx-auto"
                >
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">First Name</label>
                                <input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" placeholder="Jane" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Last Name</label>
                                <input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Work Email</label>
                            <input type="email" className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" placeholder="jane@company.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Company Size</label>
                            <select className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none">
                                <option>1-50 employees</option>
                                <option>51-200 employees</option>
                                <option>201-1000 employees</option>
                                <option>1000+ employees</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">How can we help?</label>
                            <textarea rows={4} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none" placeholder="Tell us about your team's coaching needs..."></textarea>
                        </div>

                        <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4">
                            Submit Request
                        </button>
                    </form>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default ContactSales;
