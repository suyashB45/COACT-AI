import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { registerUser } from '../lib/api';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [reenterPassword, setReenterPassword] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !email.trim() || !password.trim() || !reenterPassword.trim()) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (password !== reenterPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        
        setLoading(true);
        try {
            await registerUser({
                name: name.trim(),
                company: company.trim() || undefined,
                email: email.trim(),
                password: password
            });
            
            toast.success(`Account created successfully! You can now sign in.`);
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex flex-col items-start">
                        <Link to="/" className="flex items-center gap-2 mb-12 cursor-pointer">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">CA</span>
                            </div>
                            <span className="text-lg font-bold text-foreground tracking-tight">CoAct<span className="text-primary">.AI</span></span>
                        </Link>
                        
                        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                            Create your account
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Join us and start mastering your communication skills.
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Company Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Company Name <span className="text-muted-foreground font-normal">(Optional)</span></label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Acme Corp"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-10 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Re-enter Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <input
                                        type={showReenterPassword ? "text" : "password"}
                                        value={reenterPassword}
                                        onChange={(e) => setReenterPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-10 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowReenterPassword(!showReenterPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showReenterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mt-4"
                        >
                            {loading ? (
                                <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"></span>
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </form>
                    
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side: Image/Abstract */}
            <div className="hidden lg:flex w-1/2 bg-muted/30 border-l border-border p-12 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_100%)] opacity-5"></div>
                
                <div className="relative z-10 max-w-md">
                    <div className="bg-card border border-border rounded-xl shadow-xl p-8">
                        <div className="flex gap-4 mb-6 border-b border-border pb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">AI</div>
                            <div>
                                <h3 className="font-semibold text-foreground">CoAct Intelligence</h3>
                                <p className="text-sm text-muted-foreground">Active Analysis</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-2 bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-muted rounded w-full"></div>
                            <div className="h-2 bg-muted rounded w-5/6"></div>
                        </div>
                    </div>
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground font-medium">
                            "The platform has fundamentally changed how our team prepares for critical negotiations."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
