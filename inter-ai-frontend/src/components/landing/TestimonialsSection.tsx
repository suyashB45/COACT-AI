import { BriefcaseBusiness, Handshake, MessageSquare, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

const useCases = [
    {
        title: 'Prepare for an objection',
        description: 'Practice a buyer who is skeptical about price, timing, or switching tools. Try a few approaches before the real call.',
        prompt: '“We already have a solution.”',
        icon: Handshake,
    },
    {
        title: 'Rehearse difficult feedback',
        description: 'Work through a sensitive conversation with a direct report or colleague, and find language that is clear without being cold.',
        prompt: '“I want to talk about what happened in the meeting.”',
        icon: UsersRound,
    },
    {
        title: 'Walk into an interview ready',
        description: 'Answer follow-up questions, explain your experience, and get comfortable speaking about your work without memorising a script.',
        prompt: '“Tell me about a time you changed someone’s mind.”',
        icon: BriefcaseBusiness,
    },
];

const TestimonialsSection = () => (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
                className="max-w-2xl mb-14 md:mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/80 text-[12px] font-semibold uppercase tracking-widest text-foreground/70 mb-6">
                    Put it to work
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
                    Practice the conversation,{' '}
                    <span className="text-muted-foreground">not a generic script.</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                    Start with a real situation and give the other side a point of view. CoAct gives you a low-pressure place to try, adjust, and try again.
                </p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
                {useCases.map((useCase, index) => (
                    <motion.article
                        key={useCase.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.45, delay: index * 0.08 }}
                        className="group rounded-xl border border-border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-md"
                    >
                        <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground">
                            <useCase.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">{useCase.title}</h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{useCase.description}</p>
                        <div className="mt-7 rounded-lg border border-border bg-secondary/35 px-4 py-3 text-[15px] font-medium leading-relaxed text-foreground">
                            <MessageSquare className="mr-2 inline-block h-4 w-4 -translate-y-px text-electric-blue" />
                            {useCase.prompt}
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    </section>
);

export default TestimonialsSection;
