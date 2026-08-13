const practiceAreas = ['Sales calls', 'Negotiations', 'Interviews', 'Difficult feedback', 'Leadership', 'Client conversations'];

const TrustLogosSection = () => {
    return (
        <section className="py-10 border-b border-border bg-muted/20 overflow-hidden">
            <div className="container mx-auto px-6">
                <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
                    Built for the conversations that deserve a little rehearsal
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
                    {practiceAreas.map((area) => (
                        <span key={area} className="rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                            {area}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustLogosSection;
