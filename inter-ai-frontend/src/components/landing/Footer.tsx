import { Link } from 'react-router-dom';
import { ShieldCheck, Linkedin, Twitter, Github } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-background border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-6">

                {/* Ethical AI & Compliance Strip */}
                <div className="mb-16 p-6 bg-muted/30 border border-border rounded-xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-3 max-w-xl">
                            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-foreground text-sm mb-1">Committed to Responsible AI & Security</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    We are committed to ethical AI practices. Your conversation data is never used to train public models. 
                                    We regularly audit our AI systems for bias and maintain full transparency in our data handling practices.
                                    <br/><br/>
                                    We use industry-standard encryption and security controls to protect customer data both in transit and at rest.
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
                            <span className="text-lg font-bold text-foreground tracking-tight">CoAct<span className="text-primary">.AI</span></span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                            Enterprise-grade AI roleplay and coaching platform for ambitious teams. Master the conversations that matter most.
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-3">
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
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
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} CoAct AI, Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
