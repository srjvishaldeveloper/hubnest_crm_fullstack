'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

const PERFORMERS = [
  { name: 'Sarah Johnson', role: 'Sales Manager', leads: 142, tickets: 28, revenue: '₹12.84L', performance: 96, avatar: 'SJ' },
  { name: 'Mike Chen', role: 'Sales Agent', leads: 118, tickets: 22, revenue: '₹9.62L', performance: 89, avatar: 'MC' },
  { name: 'Emily Davis', role: 'Support Lead', leads: 94, tickets: 68, revenue: '₹7.85L', performance: 84, avatar: 'ED' },
  { name: 'James Wilson', role: 'Sales Agent', leads: 82, tickets: 15, revenue: '₹6.41L', performance: 78, avatar: 'JW' },
  { name: 'Lisa Park', role: 'Marketing Lead', leads: 76, tickets: 12, revenue: '₹5.28L', performance: 74, avatar: 'LP' },
];

const RANK_COLORS = ['from-amber-400 to-amber-600', 'from-slate-300 to-slate-500', 'from-amber-600 to-amber-800'];
const RANK_ICONS = [Trophy, Medal, Award];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function TopPerformers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Performers
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Best performers this month</p>
        </div>
        <button className="text-xs text-[#2563EB] font-semibold hover:underline">View All</button>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">#</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Name</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Role</th>
              <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Leads</th>
              <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Tickets</th>
              <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Revenue</th>
              <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide w-32">Performance</th>
            </tr>
          </thead>
          <motion.tbody variants={container} initial="hidden" animate="show">
            {PERFORMERS.map((p, i) => {
              const RankIcon = i < 3 ? RANK_ICONS[i] : null;
              return (
                <motion.tr
                  key={p.name}
                  variants={item}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-3 px-3">
                    {RankIcon ? (
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${RANK_COLORS[i]} flex items-center justify-center`}>
                        <RankIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#94A3B8] pl-1.5">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{p.avatar}</span>
                      </div>
                      <span className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">{p.role}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-[#0F172A]">{p.leads}</td>
                  <td className="py-3 px-3 text-center font-medium text-[#0F172A]">{p.tickets}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#0F172A]">{p.revenue}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.performance}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: p.performance >= 90 ? '#10B981' : p.performance >= 75 ? '#2563EB' : '#F59E0B',
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0F172A] w-8 text-right">{p.performance}%</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
}
