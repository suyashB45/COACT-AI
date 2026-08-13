import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "How does the AI coaching actually work?",
        answer: "You pick a scenario (or describe your own), hit start, and just talk. The AI listens, responds naturally, throws realistic objections at you, and adjusts based on how you're doing. When you finish, you get a full breakdown — confidence score, pacing analysis, filler words, key moments — usually within 10 seconds.",
    },
    {
        question: "Is my conversation data private?",
        answer: "Yes, completely. Everything is encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your conversations to train our models. Your data stays yours. We're SOC 2 Type II compliant, and we publish our security practices publicly.",
    },
    {
        question: "Can we integrate this with our company's LMS?",
        answer: "Yep — our Enterprise plan includes integrations with Workday, Cornerstone, and Docebo out of the box. We also have a REST API and webhooks if you want to build something custom. Most teams get set up in under a week.",
    },
    {
        question: "What kinds of scenarios can I practice?",
        answer: "We have 50+ pre-built scenarios: cold calls, discovery calls, salary negotiations, performance reviews, customer escalations, investor pitches, and more. Enterprise customers can also build custom scenarios using their own product docs and objection sheets.",
    },
    {
        question: "Does it actually help? Or is it just a fancy chatbot?",
        answer: "Fair question. The short answer: our average user sees a 23% improvement in their coaching scores after 5 sessions. The longer answer: we process tone, pacing, and word choice in real time — not just what you say, but how you say it. That's the part most chatbots miss.",
    },
    {
        question: "What does the free plan include?",
        answer: "3 sessions per month, 5 standard scenarios, and basic feedback. It's enough to get a feel for how CoAct works. No credit card required, no sneaky auto-upgrades. When you're ready for more, Pro is $10/month.",
    }
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 md:py-32 bg-muted/20 border-t border-border">
            <div className="container mx-auto px-6 max-w-3xl">
                <motion.div
                    className="mb-14"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/80 text-[12px] font-semibold uppercase tracking-widest text-foreground/70 mb-6">
                        FAQ
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        Questions we get a lot.
                    </h2>
                    <p className="text-muted-foreground text-base">
                        If yours isn't here, just email us — we usually reply within a few hours.
                    </p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-border"
                        >
                            <button
                                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none gap-4"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                aria-expanded={openIndex === index}
                                aria-controls={`faq-answer-${index}`}
                            >
                                <span className="font-semibold text-foreground text-sm">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {openIndex === index && (
                                    <motion.div
                                        id={`faq-answer-${index}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                                            opacity: { duration: 0.25 },
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5">
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    className="mt-14 text-center p-8 bg-card border border-border rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>Still have questions?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        We're real people, not a help desk bot. Email us and you'll hear back within a few hours.
                    </p>
                    <a
                        href="mailto:support@coact.ai"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        support@coact.ai
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQSection;
