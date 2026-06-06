'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const STATS = [
  { end: 3754, label: 'Leads Managed', prefix: '' },
  { end: 1264, label: 'Tickets Resolved', prefix: '' },
  { end: 38, label: 'Active Campaigns', prefix: '' },
  { end: 2458, label: 'Revenue Tracked', prefix: '₹', suffix: 'L' },
];

function Counter({ end, prefix = '', suffix = '', isActive }: {
  end: number; prefix?: string; suffix?: string; isActive: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isActive, end]);

  if (suffix === 'L') {
    const val = ((count / end) * 24.58).toFixed(2);
    return <span>{prefix}{val}{suffix}</span>;
  }

  return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="stats" className="border-y border-slate-100 bg-blue-50/70 py-12">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mx-auto grid w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] grid-cols-2 gap-8 px-4 sm:px-8 lg:px-16 text-center md:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <p className="font-serif text-4xl tracking-tight text-slate-900 sm:text-5xl">
              {s.suffix === 'L' ? (
                <span>₹24.58L</span>
              ) : (
                <Counter end={s.end} prefix={s.prefix} suffix={s.suffix} isActive={isInView} />
              )}
            </p>
            <p className="mt-2 text-sm text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
