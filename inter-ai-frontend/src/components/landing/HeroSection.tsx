import { ArrowRight, Check, Mic, Sparkles, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection = () => {
    const navigate = useNavigate();
    const startPractice = () => navigate(localStorage.getItem('user') ? '/practice' : '/login');

    return (
        <section className="hero-editorial relative overflow-hidden border-b border-border pt-28 md:pt-36">
            <div className="hero-orb hero-orb-one" />
            <div className="hero-orb hero-orb-two" />
            <div className="container relative z-10 mx-auto grid min-h-[720px] max-w-6xl items-center gap-14 px-6 pb-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:pb-24">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease }} className="max-w-xl lg:pb-8">
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8dfd6] bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#476050] shadow-[0_4px_16px_rgba(20,38,27,.05)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#5f9d76]" />
                        YOUR PRIVATE PRACTICE ROOM
                    </div>
                    <h1 className="max-w-2xl text-[3.15rem] font-bold leading-[.98] tracking-[-.06em] text-foreground sm:text-6xl lg:text-[4.5rem]" style={{ fontFamily: 'var(--font-display)' }}>
                        The hard conversation, <em className="font-serif font-normal tracking-[-.04em] text-[#47785b]">before</em> it counts.
                    </h1>
                    <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
                        Practice the moment that matters with an AI partner who listens, pushes back, and helps you find the words you mean.
                    </p>
                    <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <button onClick={startPractice} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#193c2a] px-6 text-[15px] font-semibold text-white shadow-[0_12px_24px_rgba(25,60,42,.20)] transition-all hover:-translate-y-0.5 hover:bg-[#245338] hover:shadow-[0_16px_30px_rgba(25,60,42,.25)]">
                            Start a practice session <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="min-h-12 rounded-full px-4 text-[15px] font-semibold text-foreground transition-colors hover:text-[#47785b]">
                            See it in action <span className="ml-1 text-[#5f9d76]">↓</span>
                        </button>
                    </div>
                    <div className="mt-10 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex -space-x-2"><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#dbb996] text-[10px] font-bold text-[#55351b]">M</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#829db6] text-[10px] font-bold text-[#17334f]">J</span><span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#c8a1a1] text-[10px] font-bold text-[#512a2a]">A</span></div>
                        <span>Made for the conversations people avoid.</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 28, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .8, delay: .12, ease }} className="relative mx-auto w-full max-w-[510px]">
                    <div className="hero-note absolute -right-5 -top-7 hidden rotate-[5deg] rounded-xl bg-[#f8e9a8] px-4 py-3 text-sm text-[#5d4b12] shadow-lg lg:block">Keep it curious,<br />not defensive.</div>
                    <div className="overflow-hidden rounded-[1.6rem] border border-[#dce3da] bg-[#fffefa] shadow-[0_28px_70px_rgba(35,59,42,.16)]">
                        <div className="flex items-center justify-between border-b border-[#e8ece4] px-5 py-4">
                            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f0e7] text-[#376249]"><Mic className="h-4 w-4" /></span><div><p className="text-sm font-bold text-foreground">Practice room</p><p className="text-[11px] text-muted-foreground">Difficult feedback · 08:42</p></div></div>
                            <span className="rounded-full bg-[#eaf5eb] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#3c7a4d]">LIVE</span>
                        </div>
                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="flex items-end gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8b797] text-xs font-bold text-[#50331b]">M</span><div><p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Maya · Your teammate</p><p className="max-w-sm rounded-2xl rounded-bl-md bg-[#f0f3ed] px-4 py-3 text-sm leading-relaxed text-foreground">I didn't realize the presentation landed that way. I thought it was fine.</p></div></div>
                            <div className="ml-12 rounded-xl border border-[#dce9dc] bg-[#f5faf4] p-3.5"><p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#47785b]"><Sparkles className="h-3.5 w-3.5" /> A good opening</p><p className="text-sm leading-relaxed text-[#355040]">“I can see why it felt that way. Can I share what I noticed?”</p></div>
                            <div className="flex justify-end"><div className="max-w-sm rounded-2xl rounded-br-md bg-[#193c2a] px-4 py-3 text-sm leading-relaxed text-white">I can see why it felt that way. Can I share what I noticed?</div></div>
                            <div className="flex items-center gap-3 pt-1"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#193c2a] text-white"><Volume2 className="h-4 w-4" /></div><div className="flex h-9 flex-1 items-center gap-1 rounded-full bg-[#f0f3ed] px-4"><i className="voice-bar h-2" /><i className="voice-bar h-4" /><i className="voice-bar h-6" /><i className="voice-bar h-3" /><i className="voice-bar h-5" /><span className="ml-2 text-xs text-muted-foreground">Maya is responding…</span></div></div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-[#e8ece4] bg-[#fbfcf8] px-5 py-3.5 text-xs text-[#47785b]"><Check className="h-4 w-4" /> You stayed specific and gave them room to respond.</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
