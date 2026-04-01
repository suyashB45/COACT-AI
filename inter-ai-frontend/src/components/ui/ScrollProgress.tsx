import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1.5 origin-left z-[9999]"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, var(--color-primary) 0%, oklch(0.65 0.22 265) 100%)',
        boxShadow: '0 0 10px 0 rgba(var(--color-primary), 0.5)'
      }}
    />
  );
}
