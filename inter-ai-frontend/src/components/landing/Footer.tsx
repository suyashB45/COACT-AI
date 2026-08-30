import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Linkedin, Twitter, Github, ArrowRight, Zap } from 'lucide-react';

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
        <footer className="ds-section border-t border-white/[0.06] pt-16 pb-8">
            {/* Subtle grid */}
            <div className="ds-grid" style={{ opacity: 0.5 }} />

            {/* Top shimmer */}
            <div className="ds-shimmer-top" />

            {/* Bottom violet glow */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full z-0"
                style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)', filter: 'blur(30px)' }} />

            <div className="relative z-10 container mx-auto px-6">

                {/* Newsletter + Ethical AI */}
                <div className="mb-16 grid md:grid-cols-2 gap-4">
                    {/* Newsletter */}
                    <div className="ds-card p-7">
                        <h4 className="font-semibold text-white text-base mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Stay in the loop
                        </h4>
                        <p className="text-xs text-white/40 mb-4 leading-relaxed">
                            Product updates, communication tips, and the occasional behind-the-scenes look. One email a month, max.
                        </p>
                        <form onSubmit={handleNewsletter} className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/25 transition-all focus:outline-none focus:border-violet-500/40 focus:bg-violet-500/[0.04]"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-1.5 shrink-0
                                    bg-gradient-to-r from-violet-600 to-blue-600
                                    shadow-[0_0_14px_rgba(139,92,246,0.3)]
                                    hover:shadow-[0_0_22px_rgba(139,92,246,0.5)]"
                            >
                                {subscribed ? '✓ Subscribed!' : <><span>Subscribe</span> <ArrowRight className="w-3.5 h-3.5" /></>}
                            </button>
                        </form>
                    </div>

                    {/* Ethical AI */}
                    <div className="ds-card p-7">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-white text-sm mb-1">Committed to Responsible AI</h4>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Your conversation data is never used to train public models. We regularly audit our AI for bias and maintain full transparency in data handling. Industry-standard encryption protects everything in transit and at rest.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-14">
                    <div className="col-span-2 lg:col-span-2">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                                <Zap className="h-4 w-4 text-white fill-white" />
                            </div>
                            <span className="text-[15px] font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                CoAct<span className="text-violet-400">.AI</span>
                            </span>
                        </div>
                        <p className="text-sm text-white/40 mb-4 max-w-sm leading-relaxed">
                            AI roleplay and coaching for teams that take preparation seriously. Practice the conversations that actually matter.
                        </p>
                        <p className="text-xs text-white/20 mb-6 leading-relaxed">
                            548 Market St, Suite 36879<br />
                            San Francisco, CA 94104
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-2">
                            {[
                                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                            ].map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="w-9 h-9 rounded-xl border border-white/[0.07] bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/[0.08] transition-all"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white/60 mb-4 text-xs uppercase tracking-wider">Product</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Features', href: '#features' },
                                { label: 'Pricing', href: '#pricing' },
                                { label: 'Interactive Demo', href: '/practice' },
                                { label: 'Changelog', href: '#' },
                                { label: 'Status', href: '#', dot: true },
                            ].map((item) => (
                                <li key={item.label}>
                                    <a href={item.href} className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5">
                                        {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white/60 mb-4 text-xs uppercase tracking-wider">Resources</h4>
                        <ul className="space-y-3">
                            {['Documentation', 'Blog', 'Customer Stories', 'API Reference'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white/60 mb-4 text-xs uppercase tracking-wider">Company</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'About', to: '/about' },
                                { label: 'Careers', to: '/careers' },
                                { label: 'Contact Sales', to: '/contact-sales' },
                                { label: 'Security', to: '/security' },
                                { label: 'Privacy Policy', to: '/privacy' },
                                { label: 'Terms of Service', to: '/terms' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link to={item.to} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-white/25">
                            &copy; {new Date().getFullYear()} CoAct AI, Inc. All rights reserved.
                        </p>
                        <span className="text-[10px] text-white/15 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full font-mono">
                            v0.2.1
                        </span>
                    </div>
                    <div className="flex items-center gap-5">
                        <Link to="/privacy" className="text-xs text-white/25 hover:text-white/60 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-xs text-white/25 hover:text-white/60 transition-colors">Terms of Service</Link>
                        <span className="text-xs text-white/20 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
