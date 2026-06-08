import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../lib/api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Please enter your email and password.');
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({ email: email.trim(), password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');
            
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                access_token: data.access_token
            }));

            toast.success(`Welcome back, ${data.user.email}!`);
            navigate('/practice');
        } catch (error: any) {
            toast.error(error.message || 'Invalid email or password.');
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
                            Sign in to your account
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    id="email"
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <Link to="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-10 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                    required
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
                        >
                            {loading ? (
                                <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"></span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
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

export default Login;
