'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'We migrated from three separate tools — a CRM, Mailchimp, and a manual invoicing sheet — to HubNest in two weeks. The unified dashboard alone saves our team four hours every week.',
    name: 'Anika Sharma',
    role: 'VP of Sales',
    company: 'Northwind Labs',
    location: 'Mumbai, India',
    initials: 'AS',
    color: '#F97316',
    bg: 'from-orange-500 to-amber-500',
    metric: '4 hrs/week saved',
  },
  {
    stars: 5,
    quote: 'The automation builder is genuinely impressive — we built a full lead nurture sequence with WhatsApp, email, and condition branches in 30 minutes. It used to take days across multiple platforms.',
    name: 'Rahul Mehta',
    role: 'Co-Founder & CEO',
    company: 'Brightline Fintech',
    location: 'Bengaluru, India',
    initials: 'RM',
    color: '#10B981',
    bg: 'from-emerald-500 to-teal-500',
    metric: '3× faster setup',
  },
  {
    stars: 5,
    quote: 'Role-based access was the deal-breaker for us. We operate across five regions with strict data boundaries. HubNest let us roll out company-wide without a single data-leak incident.',
    name: 'Priya Singh',
    role: 'Head of Operations',
    company: 'Helix Group',
    location: 'Hyderabad, India',
    initials: 'PS',
    color: '#8B5CF6',
    bg: 'from-violet-500 to-purple-600',
    metric: '5 regions, 0 leaks',
  },
  {
    stars: 5,
    quote: 'As a performance marketing agency managing 12 clients, HubNest\'s multi-tenant workspace means each client sees only their data while I have a god-view across all accounts.',
    name: 'Karan Desai',
    role: 'Founder',
    company: 'PixelPulse Agency',
    location: 'Pune, India',
    initials: 'KD',
    color: '#3B82F6',
    bg: 'from-blue-500 to-cyan-500',
    metric: '12 clients managed',
  },
  {
    stars: 5,
    quote: 'AI Studio showed us 60% of our best leads came from one campaign type we were under-investing in. We reallocated budget in a day and saw a 40% jump in qualified pipeline within a month.',
    name: 'Sneha Iyer',
    role: 'Marketing Director',
    company: 'Zestify Commerce',
    location: 'Chennai, India',
    initials: 'SI',
    color: '#EC4899',
    bg: 'from-pink-500 to-rose-500',
    metric: '+40% pipeline',
  },
  {
    stars: 5,
    quote: 'Invoicing used to mean chasing approvals over email for a week. Now everything is created, tracked, and paid inside HubNest with GST auto-calculated. Cycle time dropped to under 24 hours.',
    name: 'Arjun Nair',
    role: 'Finance Manager',
    company: 'TechBridge Solutions',
    location: 'Kochi, India',
    initials: 'AN',
    color: '#F59E0B',
    bg: 'from-amber-500 to-yellow-500',
    metric: '7 days → 24 hrs',
  },
  {
    stars: 5,
    quote: 'Our support team finally has a single inbox for WhatsApp, email, and form submissions. Ticket assignment, SLA tracking, and escalations all work out of the box without any setup pain.',
    name: 'Divya Menon',
    role: 'Customer Success Lead',
    company: 'Orbis Software',
    location: 'Noida, India',
    initials: 'DM',
    color: '#06B6D4',
    bg: 'from-cyan-500 to-sky-500',
    metric: '60% faster resolution',
  },
  {
    stars: 5,
    quote: 'We ran our first WhatsApp broadcast to 8,000 contacts straight from HubNest. The delivery reports, reply tracking, and opt-out handling were all automatic. Zero engineers involved.',
    name: 'Rohan Kapoor',
    role: 'Growth Lead',
    company: 'FastCart India',
    location: 'Delhi, India',
    initials: 'RK',
    color: '#22C55E',
    bg: 'from-green-500 to-emerald-600',
    metric: '8K contacts, 1 click',
  },
  {
    stars: 5,
    quote: 'The AI-generated lead score changed how our SDRs prioritise their day. Instead of guessing, they work the highest-intent contacts first. Our connect rate went up by 28% in the first month.',
    name: 'Meera Krishnan',
    role: 'Sales Manager',
    company: 'Axiom Realty',
    location: 'Coimbatore, India',
    initials: 'MK',
    color: '#A855F7',
    bg: 'from-purple-500 to-indigo-600',
    metric: '+28% connect rate',
  },
  {
    stars: 5,
    quote: 'HubNest replaced our entire martech stack — email tool, landing page builder, form builder, analytics — with a single subscription that costs less than any one of those tools did alone.',
    name: 'Vikram Joshi',
    role: 'CMO',
    company: 'IndiaCraft Exports',
    location: 'Surat, India',
    initials: 'VJ',
    color: '#EF4444',
    bg: 'from-red-500 to-rose-600',
    metric: '4 tools → 1 platform',
  },
  {
    stars: 5,
    quote: 'Setting up the Meta Ads integration took five minutes. Now our Facebook leads flow directly into HubNest, get scored, and trigger a WhatsApp sequence automatically. The pipeline practically fills itself.',
    name: 'Tanvi Bhatia',
    role: 'Digital Marketing Head',
    company: 'EduReach Academy',
    location: 'Jaipur, India',
    initials: 'TB',
    color: '#0EA5E9',
    bg: 'from-sky-500 to-blue-600',
    metric: 'Leads auto-qualified',
  },
  {
    stars: 5,
    quote: 'The OTP login and audit logs were the first things our compliance team asked about. HubNest had both, plus granular role permissions, which made our ISO audit sign-off completely painless.',
    name: 'Suresh Pandey',
    role: 'IT & Compliance Head',
    company: 'Meridian Healthcare',
    location: 'Ahmedabad, India',
    initials: 'SP',
    color: '#14B8A6',
    bg: 'from-teal-500 to-cyan-600',
    metric: 'ISO audit passed',
  },
];

// Split into two rows for the marquee
const ROW_A = TESTIMONIALS.slice(0, 6);
const ROW_B = TESTIMONIALS.slice(6, 12);

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function MarqueeCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div
      className="flex-shrink-0 w-[320px] rounded-2xl border border-slate-200 dark:border-[#1e1e1e] bg-white dark:bg-[#0d0d0d] p-5 mx-3 select-none"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <Quote className="w-5 h-5 text-slate-100 dark:text-[#1a1a1a]" strokeWidth={2} />
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0"
          style={{ color: t.color, borderColor: `${t.color}35`, background: `${t.color}12` }}
        >
          {t.metric}
        </span>
      </div>
      <StarRow count={t.stars} />
      <p className="mt-3 mb-4 text-[13px] leading-relaxed text-slate-600 dark:text-[#888] line-clamp-4">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-[#181818]">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.bg} text-xs font-bold text-white`}
          style={{ boxShadow: `0 4px 12px ${t.color}40` }}
        >
          {t.initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-[#e5e5e5] text-xs">{t.name}</p>
          <p className="text-[10px] text-slate-400 dark:text-[#555] mt-0.5 truncate">
            {t.role} · {t.company}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfiniteMarquee({ items, speed = 0.4, reverse = false }: {
  items: (typeof TESTIMONIALS);
  speed?: number;
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const pausedRef = useRef(false);

  // Each card is 320px wide + 24px (mx-3 = 12px each side)
  const CARD_W = 344;
  const totalW = items.length * CARD_W;

  useAnimationFrame((_, delta) => {
    if (pausedRef.current || !trackRef.current) return;
    const step = (delta / 1000) * speed * 60;
    xRef.current = reverse
      ? (xRef.current + step) % totalW
      : (xRef.current - step + totalW) % totalW;
    trackRef.current.style.transform = `translateX(${-xRef.current}px)`;
  });

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div ref={trackRef} className="flex will-change-transform">
        {/* Triple the items so there's always content visible during loop */}
        {[...items, ...items, ...items].map((t, i) => (
          <MarqueeCard key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

function FeaturedSlider() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function go(next: number, direction: number) {
    setDir(direction);
    setCurrent(next);
  }

  function prev() {
    const next = current === 0 ? TESTIMONIALS.length - 1 : current - 1;
    go(next, -1);
    resetTimer();
  }

  function next() {
    const next = current === TESTIMONIALS.length - 1 ? 0 : current + 1;
    go(next, 1);
    resetTimer();
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c === TESTIMONIALS.length - 1 ? 0 : c + 1));
      setDir(1);
    }, 4500);
  }

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const t = TESTIMONIALS[current];

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0e0e0e] shadow-xl" style={{ minHeight: 280 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="p-8 sm:p-10"
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, ${t.color}, ${t.color}55)` }}
            />

            <div className="flex items-start justify-between mb-5">
              <Quote className="w-7 h-7 text-slate-100 dark:text-[#1c1c1c]" strokeWidth={1.5} />
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{ color: t.color, borderColor: `${t.color}35`, background: `${t.color}12` }}
              >
                {t.metric}
              </span>
            </div>

            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.stars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-[#aaa] mb-6">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="flex items-center gap-3.5 pt-5 border-t border-slate-100 dark:border-[#191919]">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.bg} font-bold text-white`}
                style={{ boxShadow: `0 6px 18px ${t.color}45`, fontSize: 14 }}
              >
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-[#ededed] text-sm">{t.name}</p>
                <p className="text-xs text-slate-500 dark:text-[#555] mt-0.5">
                  {t.role} · {t.company}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-[#444] mt-0.5">{t.location}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center shadow-md hover:border-orange-500/50 hover:text-orange-500 transition-all text-slate-400 dark:text-[#555] z-10"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center shadow-md hover:border-orange-500/50 hover:text-orange-500 transition-all text-slate-400 dark:text-[#555] z-10"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => { go(i, i > current ? 1 : -1); resetTimer(); }}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              background: i === current ? t.color : '#CBD5E1',
              opacity: i === current ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-slate-50 dark:bg-[#050505] py-24 border-y border-slate-200 dark:border-[#141414] overflow-hidden transition-colors duration-200">
      <div className="mx-auto w-full max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] px-4 sm:px-8 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-green-500" />
            Customer Stories
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-[#ededed] tracking-tight mb-4">
            Trusted by teams that mean business
          </h2>
          <p className="text-base text-slate-500 dark:text-[#666] max-w-lg mx-auto leading-relaxed">
            Real results from real teams — no cherry-picked metrics, just what happened after they switched.
          </p>
        </motion.div>

        {/* Featured slider — all screen sizes */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16 px-6"
        >
          <FeaturedSlider />
        </motion.div>

        {/* Auto-scrolling marquee rows */}
        <div className="space-y-4 -mx-4 sm:-mx-8 lg:-mx-16">
          <InfiniteMarquee items={ROW_A} speed={0.35} reverse={false} />
          <InfiniteMarquee items={ROW_B} speed={0.3} reverse={true} />
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-10"
        >
          {[
            { label: 'Active Teams', value: '1,200+' },
            { label: 'Avg. Rating', value: '4.9 / 5' },
            { label: 'Leads Managed', value: '2.4M+' },
            { label: 'Campaigns Sent', value: '18M+' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-[#555] mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
