'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, TicketCheck, Megaphone, DollarSign } from 'lucide-react';

const STATS = [
  { end: 3754, label: 'Leads Managed', prefix: '', icon: Users, color: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  { end: 1264, label: 'Tickets Resolved', prefix: '', icon: TicketCheck, color: 'text-green-400', iconBg: 'bg-green-500/10' },
  { end: 38, label: 'Active Campaigns', prefix: '', icon: Megaphone, color: 'text-orange-400', iconBg: 'bg-orange-500/10' },
  { end: 2458, label: 'Revenue Tracked', prefix: '₹', suffix: 'L', icon: DollarSign, color: 'text-green-400', iconBg: 'bg-green-500/10' },
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
    <section id="stats" className="border-y border-slate-200 dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#080808] py-14 transition-colors duration-200">
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
            className="flex flex-col items-center"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} mb-4`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-4xl font-black tracking-tight sm:text-5xl ${s.color}`}>
              {s.suffix === 'L' ? (
                <span>₹24.58L</span>
              ) : (
                <Counter end={s.end} prefix={s.prefix} suffix={s.suffix} isActive={isInView} />
              )}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-[#555]">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
