import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-background border-t border-border pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/logo.png" alt="CoAct.AI Logo" className="h-10 w-auto object-contain" />
                            <span className="text-xl font-bold text-foreground tracking-tight">CoAct<span className="text-primary">.AI</span></span>
                        </div>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Enterprise-grade AI roleplay and coaching platform for ambitious teams. Master the conversations that matter most.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                            <li><Link to="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Interactive Demo</Link></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Changelog</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Resources</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Customer Stories</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Sales</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy & Terms</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} CoAct AI, Inc. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        {/* Placeholder Social Icons */}
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                            <span className="text-xs">in</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                            <span className="text-xs">tw</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
