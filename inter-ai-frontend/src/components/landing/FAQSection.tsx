import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "How does the AI coaching work?",
        answer: "Our platform uses advanced large language models to simulate realistic conversations. The AI adapts to your responses, tracks your emotional intelligence, and provides detailed, actionable feedback instantly after each session."
    },
    {
        question: "Is my conversational data private and secure?",
        answer: "Yes. Enterprise-grade security is built into our core. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We do not use your private conversations to train our base AI models without explicit consent."
    },
    {
        question: "Can we integrate this into our company's LMS?",
        answer: "Absolutely. Our Enterprise plan includes native integrations with major Learning Management Systems like Workday, Cornerstone, and Docebo, as well as secure data export via API and webhooks."
    },
    {
        question: "What kind of scenarios are supported?",
        answer: "We support a wide range of business scenarios out-of-the-box, including sales objections, difficult management conversations, negotiations, performance reviews, and customer support de-escalation. Enterprise users can also build fully custom scenarios."
    },
    {
        question: "How is my data used ethically?",
        answer: "We follow strict ethical AI principles. Your conversation data is only used to generate your personal feedback reports. We never sell your data, and our AI models are regularly audited for bias. You retain full ownership of your data at all times."
    }
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-28 bg-muted/20 border-t border-border">
            <div className="container mx-auto px-6 max-w-3xl">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</h2>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
                        Frequently Asked Questions
                    </h3>
                    <p className="text-lg text-muted-foreground">
                        Everything you need to know about the product and billing.
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
                                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    className="mt-12 text-center p-8 bg-card border border-border rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-foreground mb-2">Still have questions?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Our team is here to help. Reach out and we'll get back to you within 24 hours.
                    </p>
                    <a
                        href="mailto:support@coact.ai"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        Contact Support
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQSection;
