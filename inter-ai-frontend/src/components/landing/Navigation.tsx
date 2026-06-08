import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ModeToggle } from '../mode-toggle';

const Navigation = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-3 cursor-pointer">
                        <img src="/logo.png" alt="CoAct.AI Logo" className="h-10 w-auto object-contain" />
                        <span className="text-xl font-bold text-foreground tracking-tight">CoAct<span className="text-primary">.AI</span></span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {item.name}
                            </button>
                        ))}
                        {user && appItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavClick(item)}
                                className={`text-sm font-medium transition-colors ${location.pathname === item.page ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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
                                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </button>
                                <button
                                    className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors"
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
                            <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-center font-medium bg-foreground text-background py-3 rounded-md">
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
