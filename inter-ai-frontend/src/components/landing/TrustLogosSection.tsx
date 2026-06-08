import React from 'react';
import { Brain } from 'lucide-react';

const TrustLogosSection: React.FC = () => {
    return (
        <section className="py-12 border-b border-border bg-muted/30">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                    Trusted by companys are
                </p>
                <div className="flex flex-wrap justify-center gap-12 md:gap-20 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-3 text-slate-400 hover:text-foreground transition-colors group cursor-pointer">
                        <Brain className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-2xl font-bold tracking-tight">Maestrominds</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustLogosSection;
