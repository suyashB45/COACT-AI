import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQSection: React.FC = () => {
    const faqs = [
        {
            question: "How does the AI coaching work?",
            answer: "Our platform uses advanced large language models to simulate realistic conversations. The AI adapts to your responses, tracks your emotional intelligence, and provides detailed, actionable feedback instantly after each session."
        },
        {
            question: "Is my conversational data private?",
            answer: "Yes. Enterprise-grade security is built into our core. Your data is encrypted at rest and in transit. We do not use your private conversations to train our base AI models without explicit consent."
        },
        {
            question: "Can we integrate this into our company's LMS?",
            answer: "Absolutely. Our Enterprise plan includes native integrations with major Learning Management Systems like Workday, Cornerstone, and Docebo, as well as secure data export capabilities."
        },
        {
            question: "What kind of scenarios are supported?",
            answer: "We support a wide range of business scenarios out-of-the-box, including sales objections, difficult management conversations, negotiations, and customer support de-escalation. Enterprise users can also build custom scenarios."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Everything you need to know about the product and billing.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div 
                            key={index} 
                            className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200"
                        >
                            <button
                                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                aria-expanded={openIndex === index}
                                aria-controls={`faq-answer-${index}`}
                            >
                                <span className="font-semibold text-foreground">{faq.question}</span>
                                <ChevronDown 
                                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`} 
                                />
                            </button>
                            
                            <div 
                                id={`faq-answer-${index}`}
                                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                                    openIndex === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
