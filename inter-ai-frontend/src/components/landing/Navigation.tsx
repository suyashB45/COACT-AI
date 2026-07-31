import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ModeToggle } from '../mode-toggle';

const Navigation = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    // Track scroll for nav styling
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
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

    const handleNavClick = (item: { name: string, href: string, page: string }) => {
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
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    navigate(item.href, { replace: true });
                }
            }, 100);
        }
    };

    useEffect(() => {
        if (location.pathname === '/' && location.state && (location.state as any).scrollTo) {
            const id = (location.state as any).scrollTo;
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState({}, document.title);
            }, 100);
        }
    }, [location]);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
                ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-sm'
                : 'bg-background/70 backdrop-blur-sm border-b border-transparent'
        }`}>
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                <div className="flex items-center gap-8">
                    {/* Logo with Easter egg bounce */}
                    <Link
                        to="/"
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                    >
                        <img
                            src="/logo.png"
                            alt="CoAct.AI Logo"
                            className="h-9 w-auto object-contain group-hover:scale-110 group-active:scale-90 transition-transform duration-200"
                        />
                        <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                            CoAct<span className="text-primary">.AI</span>
                        </span>
                    </Link>

                    {/* Nav Items with squiggle underlines */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className="squiggle-underline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                            >
                                {item.name}
                            </button>
                        ))}
                        {user && appItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className={`squiggle-underline text-sm font-medium transition-colors px-3 py-2 ${
                                    location.pathname === item.page
                                        ? 'text-primary active'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <ModeToggle />
                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-4 border-l border-border pl-4">
                                <button
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                                    onClick={() => navigate('/profile')}
                                >
                                    <User className="w-4 h-4" /> Profile
                                </button>
                                <button
                                    className="flex items-center gap-2 text-muted-foreground hover:text-destructive font-medium text-sm transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </button>
                                <button
                                    className="text-sm font-medium bg-foreground text-background px-5 py-2 rounded-full hover:bg-foreground/90 hover:rotate-[-1deg] transition-all duration-200"
                                    onClick={() => navigate('/login')}
                                >
                                    Get Started
                                </button>
                            </div>
                        )
                    )}
                </div>

                <div className="flex md:hidden items-center gap-2">
                    <ModeToggle />
                    <button
                        className="p-2 text-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background px-4 py-6 shadow-xl absolute w-full">
                    <div className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className="text-left font-medium text-foreground"
                            >
                                {item.name}
                            </button>
                        ))}
                        {user && appItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className="text-left font-medium text-foreground"
                            >
                                {item.name}
                            </button>
                        ))}
                        <hr className="border-border my-2" />
                        {user ? (
                            <>
                                <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="text-left font-medium flex items-center gap-2"><User className="w-4 h-4"/> Profile</button>
                                <button onClick={handleLogout} className="text-left font-medium text-destructive flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
                            </>
                        ) : (
                            <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-center font-medium bg-foreground text-background py-3 rounded-xl">
                                Sign In / Get Started
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
