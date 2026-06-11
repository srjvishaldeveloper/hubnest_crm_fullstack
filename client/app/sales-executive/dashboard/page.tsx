'use client';

import { motion } from 'framer-motion';
import { Target, PhoneCall, Mail, Calendar, Clock, ArrowRight } from 'lucide-react';
import { MOCK_LEADS } from '../../../store/mockData';

const myLeads = MOCK_LEADS.slice(0, 8);
const STAGES = ['New', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];
const stageColors: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Qualified': 'bg-violet-50 text-violet-700 border-violet-200',
  'Proposal': 'bg-amber-50 text-amber-700 border-amber-200',
  'Closed Won': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed Lost': 'bg-red-50 text-red-700 border-red-200',
};

const followUps = [
  { name: 'TechVista Solutions', type: 'Call', time: 'Today, 2:30 PM', icon: PhoneCall, color: 'text-blue-600 bg-blue-50' },
  { name: 'GreenEdge Corp', type: 'Email', time: 'Today, 4:00 PM', icon: Mail, color: 'text-violet-600 bg-violet-50' },
  { name: 'NovaStar Ltd', type: 'Meeting', time: 'Tomorrow, 10:00 AM', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Pinnacle Systems', type: 'Call', time: 'Tomorrow, 3:00 PM', icon: PhoneCall, color: 'text-amber-600 bg-amber-50' },
];

export default function SalesExecutiveDashboard() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-1">My Dashboard</h2><p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mb-4">Your assigned leads and follow-ups</p></div>

      {/* Pipeline mini */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map(s => {
          const count = myLeads.filter(l => l.stage === s).length;
          return (
            <motion.div key={s} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-shadow">
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{count}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* My Leads */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2"><Target className="w-4 h-4 text-[#2563EB]" /><h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">My Leads</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-100 dark:border-[#1f1f1f]">{['Company','Contact','Stage','Value','Last Activity'].map(h => <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>{myLeads.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-[#161616]/50">
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">{l.company}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{l.name}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stageColors[l.stage]}`}>{l.stage}</span></td>
                  <td className="px-5 py-3 text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB]">{l.value}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{l.lastActivity}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </motion.div>

        {/* Follow-up Reminders */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Follow-up Reminders</h3>
          <div className="space-y-3">
            {followUps.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] hover:border-slate-200 transition cursor-pointer group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}><f.icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] dark:text-[#F9FAFB] truncate">{f.name}</p>
                  <p className="text-[11px] text-slate-500">{f.type} · {f.time}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition" />
              </div>
            ))}
          </div>

          {/* Quick Log */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
            <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-3">Quick Log</p>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"><PhoneCall className="w-3.5 h-3.5" /> Call</button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition"><Mail className="w-3.5 h-3.5" /> Email</button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition"><Calendar className="w-3.5 h-3.5" /> Meet</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
