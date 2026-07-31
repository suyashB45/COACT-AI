import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
    quote: string;
    name: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    featured?: boolean;
}

const testimonials: Testimonial[] = [
    {
        quote: "I used to dread client objection calls. After two weeks with CoAct, I actually started looking forward to them. The AI catches things about my tone that I'd never notice myself.",
        name: "Sarah Chen",
        role: "Senior Account Executive",
        company: "Meridian Corp",
        avatar: "/sarah.png",
        rating: 5,
        featured: true,
    },
    {
        quote: "We rolled this out to our entire sales floor. Average close rate went up 18% in the first quarter. That's not a typo.",
        name: "Alex Rivera",
        role: "VP of Revenue",
        company: "Vertex Partners",
        avatar: "/alex.png",
        rating: 5,
        featured: false,
    },
    {
        quote: "The feedback is surprisingly honest. It told me I use 'um' 47 times in a 10-minute call. Painful, but exactly what I needed to hear.",
        name: "Jordan Park",
        role: "Team Lead",
        company: "GlobalTech",
        avatar: "",
        rating: 5,
        featured: false,
    },
    {
        quote: "Finally, a coaching tool that doesn't feel like a corporate training video from 2003. My team actually uses this voluntarily.",
        name: "Priya Sharma",
        role: "L&D Director",
        company: "EduPro Academy",
        avatar: "",
        rating: 5,
        featured: true,
    },
];

const tiltClasses = ['', 'card-tilt-2', 'card-tilt-1', 'card-tilt-3'];

const TestimonialsSection = () => {
    return (
        <section className="py-24 md:py-32 bg-background relative overflow-hidden">
            {/* Subtle background accent */}
            <div className="absolute left-0 top-1/4 w-[350px] h-[350px] opacity-[0.04] bg-annotation organic-blob blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="max-w-2xl mb-14"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="hand-note text-xl md:text-2xl mb-3 -rotate-1">Don't take our word for it →</p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
                        People who use CoAct{' '}
                        <span className="text-muted-foreground">have things to say about it.</span>
                    </h2>
                </motion.div>

                {/* Testimonial Wall — varied sizes */}
                <div className="grid md:grid-cols-2 gap-5">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`
                                relative bg-card border border-border rounded-2xl transition-all duration-300
                                hover:shadow-lg hover:border-primary/20
                                ${t.featured ? 'p-8 md:p-10' : 'p-7'}
                                ${tiltClasses[index]}
                            `}
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Quote — with hand-drawn style quote mark */}
                            <div className="relative mb-6">
                                <span className="hand-note text-5xl md:text-6xl text-primary/15 absolute -top-6 -left-2 select-none">"</span>
                                <p className={`text-foreground leading-relaxed relative z-10 ${t.featured ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
                                    {t.quote}
                                </p>
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                {t.avatar ? (
                                    <img
                                        src={t.avatar}
                                        alt={t.name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-border"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
