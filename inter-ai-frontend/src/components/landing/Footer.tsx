import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Linkedin, Twitter, Github, ArrowRight } from 'lucide-react';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleNewsletter = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 4000);
        }
    };

    return (
        <footer className="bg-background border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-6">

                {/* Newsletter + Ethical AI — side by side */}
                <div className="mb-16 grid md:grid-cols-2 gap-6">
                    {/* Newsletter */}
                    <div className="p-7 bg-primary/[0.04] border border-primary/15 rounded-2xl">
                        <h4 className="font-semibold text-foreground text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Stay in the loop
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                            Product updates, communication tips, and the occasional behind-the-scenes look. One email a month, max.
                        </p>
                        <form onSubmit={handleNewsletter} className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="newsletter-input flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 transition-all"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                {subscribed ? '✓ Subscribed!' : (
                                    <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Ethical AI */}
                    <div className="p-7 bg-muted/30 border border-border rounded-2xl">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 text-success shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-foreground text-sm mb-1">Committed to Responsible AI</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Your conversation data is never used to train public models.
                                    We regularly audit our AI for bias and maintain full transparency in data handling.
                                    Industry-standard encryption protects everything in transit and at rest.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-5">
                            <img src="/logo.png" alt="CoAct.AI Logo" className="h-9 w-auto object-contain" />
                            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                CoAct<span className="text-primary">.AI</span>
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm leading-relaxed">
                            AI roleplay and coaching for teams that take preparation seriously. Practice the conversations that actually matter.
                        </p>
                        {/* Address */}
                        <p className="text-xs text-muted-foreground/60 mb-6 leading-relaxed">
                            548 Market St, Suite 36879<br />
                            San Francisco, CA 94104
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-3">
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                            <li><Link to="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Interactive Demo</Link></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Changelog</a></li>
                            <li>
                                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot"></span>
                                    Status
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4 text-sm">Resources</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Customer Stories</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4 text-sm">Company</h4>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                            <li><Link to="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
                            <li><Link to="/contact-sales" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Sales</Link></li>
                            <li><Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
                            <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} CoAct AI, Inc. All rights reserved.
                        </p>
                        {/* Version badge */}
                        <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-full font-mono">
                            v0.2.1
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                        <span className="text-xs text-muted-foreground/50 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot"></span>
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
