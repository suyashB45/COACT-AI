import { Building2, Landmark, Globe, Briefcase, GraduationCap, HeartPulse } from 'lucide-react';

const companies = [
    { name: 'Meridian Corp', icon: Building2 },
    { name: 'Axiom Finance', icon: Landmark },
    { name: 'GlobalTech', icon: Globe },
    { name: 'Vertex Partners', icon: Briefcase },
    { name: 'EduPro Academy', icon: GraduationCap },
    { name: 'Vital Health', icon: HeartPulse },
];

const TrustLogosSection = () => {
    // Duplicate the list so the marquee loops seamlessly
    const doubled = [...companies, ...companies];

    return (
    
        <section className="py-10 border-b border-border bg-muted/20 overflow-hidden">
            <div className="container mx-auto px-6">
                <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
                    Trusted by forward-thinking teams worldwide
                </p>
            </div>

            {/* Infinite Marquee */}
            <div className="relative w-full overflow-hidden">
                <div className="animate-marquee flex items-center gap-16 md:gap-24 w-max">
                    {doubled.map((company, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 text-muted-foreground/50 hover:text-foreground transition-colors duration-300 cursor-default select-none shrink-0"
                        >
                            <company.icon className="w-7 h-7" />
                            <span className="text-lg font-semibold tracking-tight whitespace-nowrap">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustLogosSection;
