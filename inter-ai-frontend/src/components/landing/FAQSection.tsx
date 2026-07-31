import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "How does the AI coaching work?",
        answer: "You pick a scenario, hit start, and just… talk. Our AI listens, responds naturally, throws in realistic objections, and even adjusts its tone based on yours. When you're done, you get a full breakdown — think sentiment, pacing, confidence, the works. All within seconds.",
        popular: true,
    },
    {
        question: "Is my conversation data private?",
        answer: "Completely. Everything is encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your private conversations to train our base AI models. Your data stays yours. Period.",
        popular: false,
    },
    {
        question: "Can we integrate this into our company's LMS?",
        answer: "Yes! Our Enterprise plan includes native integrations with major LMS platforms like Workday, Cornerstone, and Docebo. We also offer API access and webhooks for custom setups.",
        popular: false,
    },
    {
        question: "What scenarios can I practice?",
        answer: "Out of the box: sales objections, tough management conversations, negotiations, performance reviews, customer de-escalation, and more. Enterprise users can build fully custom scenarios tailored to their products and processes.",
        popular: false,
    },
    {
        question: "How is my data used ethically?",
        answer: "We follow strict ethical AI principles. Your conversation data only generates your personal feedback. We never sell data. Our AI is regularly audited for bias. You retain full ownership of everything.",
        popular: false,
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
                    <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        Got questions?{' '}
                        <span className="text-muted-foreground">We've got answers.</span>
                    </h2>
                    <p className="hand-note text-lg text-annotation -rotate-1">
                        (and if we don't, just email us — we reply fast)
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
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-foreground text-sm">{faq.question}</span>
                                    {/* Popular annotation */}
                                    {faq.popular && (
                                        <span className="hand-note text-xs text-annotation hidden sm:inline -rotate-2">
                                            ← everyone asks this
                                        </span>
                                    )}
                                </div>
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
                    <h4 className="font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>Still curious?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        We're real humans. Reach out and we'll get back within 24 hours.
                    </p>
                    <a
                        href="mailto:support@coact.ai"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        Say hello
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQSection;
