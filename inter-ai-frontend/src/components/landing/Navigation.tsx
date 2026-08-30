import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Zap } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ModeToggle } from '../mode-toggle';
import { motion, AnimatePresence } from 'framer-motion';

const Navigation = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        setUser(userStr ? JSON.parse(userStr) : null);
        setLoading(false);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    const navItems = [
        { name: 'Features', href: '#features', page: '/' },
        { name: 'How It Works', href: '#how-it-works', page: '/' },
        { name: 'Pricing', href: '#pricing', page: '/' },
    ];

    const appItems = [
        { name: 'Practice', href: '/practice', page: '/practice' },
        { name: 'Dashboard', href: '/dashboard', page: '/dashboard' },
        { name: 'History', href: '/history', page: '/history' },
    ];

    const handleNavClick = (item: { name: string; href: string; page: string }) => {
        setIsMobileMenuOpen(false);
        if (item.href.startsWith('/')) {
            navigate(item.href);
            return;
        }
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: item.href.substring(1) } });
        } else {
            setTimeout(() => {
                const id = item.href.startsWith('#') ? item.href.substring(1) : item.href;
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    useEffect(() => {
        if (location.pathname === '/' && location.state && (location.state as any).scrollTo) {
            const id = (location.state as any).scrollTo;
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState({}, document.title);
            }, 100);
        }
    }, [location]);

    const isLanding = location.pathname === '/';

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6"
                style={{ paddingTop: scrolled ? '0.75rem' : '1rem' }}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <nav
                    className={`w-full max-w-6xl flex items-center justify-between h-14 px-5 sm:px-6 rounded-2xl transition-all duration-500 ${
                        isLanding
                            ? scrolled
                                ? 'bg-[#03050D]/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                                : 'bg-[#03050D]/70 backdrop-blur-md border border-white/[0.06]'
                            : 'bg-background/90 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
                    }`}
                >
                    {/* ── Logo ── */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 shrink-0 group"
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_12px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.7)] transition-shadow duration-300">
                            <Zap className="h-4 w-4 text-white fill-white" />
                        </div>
                        <span className={`text-[15px] font-bold tracking-tight ${isLanding ? 'text-white' : 'text-foreground'}`}>
                            CoAct<span className="text-violet-400">.AI</span>
                        </span>
                    </Link>

                    {/* ── Desktop Nav Items ── */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.name}
                                label={item.name}
                                isLanding={isLanding}
                                isActive={false}
                                onClick={() => handleNavClick(item)}
                            />
                        ))}
                        {user &&
                            appItems.map((item) => (
                                <NavItem
                                    key={item.name}
                                    label={item.name}
                                    isLanding={isLanding}
                                    isActive={location.pathname === item.page}
                                    onClick={() => handleNavClick(item)}
                                />
                            ))}
                        {!user && (
                            <NavItem
                                label="Contact Sales"
                                isLanding={isLanding}
                                isActive={false}
                                onClick={() => navigate('/contact-sales')}
                            />
                        )}
                    </div>

                    {/* ── Right Actions ── */}
                    <div className="hidden md:flex items-center gap-2">
                        <ModeToggle />
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                                            isLanding
                                                ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                                        }`}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        Profile
                                    </button>
                                    {/* Thin visual separator before destructive action */}
                                    <span className="w-px h-4 bg-white/10 mx-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all text-red-400 hover:text-red-300 hover:bg-red-500/[0.1]"
                                        title="Sign out of your account"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                                            isLanding
                                                ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-[0_0_14px_rgba(139,92,246,0.4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:-translate-y-px transition-all duration-200"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )
                        )}
                    </div>

                    {/* ── Mobile Toggle ── */}
                    <div className="flex md:hidden items-center gap-2">
                        <ModeToggle />
                        <button
                            className={`p-2 rounded-lg transition-colors ${isLanding ? 'text-white/70 hover:text-white hover:bg-white/[0.07]' : 'text-foreground'}`}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </nav>
            </motion.div>

            {/* ── Mobile Menu ── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed top-[4.5rem] left-4 right-4 z-40 rounded-2xl border p-4 shadow-2xl md:hidden ${
                            isLanding
                                ? 'bg-[#03050D]/95 backdrop-blur-xl border-white/[0.08]'
                                : 'bg-card backdrop-blur-xl border-border'
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavClick(item)}
                                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        isLanding ? 'text-white/70 hover:text-white hover:bg-white/[0.07]' : 'text-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                            {user &&
                                appItems.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavClick(item)}
                                        className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            isLanding ? 'text-white/70 hover:text-white hover:bg-white/[0.07]' : 'text-foreground hover:bg-muted/30'
                                        }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            <div className={`my-2 h-px ${isLanding ? 'bg-white/[0.06]' : 'bg-border'}`} />
                            {user ? (
                                <>
                                    <button
                                        onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            isLanding ? 'text-white/70 hover:text-white hover:bg-white/[0.07]' : 'text-foreground hover:bg-muted/30'
                                        }`}
                                    >
                                        <User className="w-4 h-4" /> Profile
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                                    className="mx-1 mt-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white text-center"
                                >
                                    Sign In / Get Started
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

/* ── NavItem ── */
interface NavItemProps {
    label: string;
    isLanding: boolean;
    isActive: boolean;
    onClick: () => void;
}

function NavItem({ label, isLanding, isActive, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`relative px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 group ${
                isActive
                    ? isLanding
                        ? 'text-violet-300'
                        : 'text-primary'
                    : isLanding
                    ? 'text-white/55 hover:text-white'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <span className="relative z-10">{label}</span>
            {/* hover pill background */}
            <span
                className={`absolute inset-0 rounded-lg transition-all duration-200 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 ${
                    isActive
                        ? isLanding ? 'bg-violet-500/10 scale-100 opacity-100' : 'bg-primary/10 scale-100 opacity-100'
                        : isLanding ? 'bg-white/[0.06]' : 'bg-muted/30'
                }`}
            />
            {/* active dot */}
            {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
            )}
        </button>
    );
}

export default Navigation;
