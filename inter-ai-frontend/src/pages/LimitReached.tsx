import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LimitReached() {
    const navigate = useNavigate()
    const location = useLocation()
    
    // Fallback message if one isn't provided by the backend
    const defaultMessage = "You've experienced all the sessions available in your current plan. Upgrade to unlock unlimited scenarios, advanced coaching analytics, and Custom Scenario Builders."
    const customMessage = location.state?.message || defaultMessage

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background/80 backdrop-blur-3xl rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 max-w-lg w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-12 shadow-2xl text-center"
            >
                <div className="mx-auto w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                    Demo Limit Reached
                </h1>
                
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                    {customMessage}
                </p>
                
                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = "mailto:team@coact-ai.com?subject=Upgrade%20Inquiry"}
                        className="w-full relative group overflow-hidden bg-primary text-primary-foreground font-bold py-4 px-8 rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all"
                    >
                        <span className="relative z-10 flex items-center gap-2 text-base">
                            Contact Sales to Upgrade <Sparkles className="w-5 h-5" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-card hover:bg-muted border border-border/50 text-foreground font-semibold py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-colors text-base"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}
