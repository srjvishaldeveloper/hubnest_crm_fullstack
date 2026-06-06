'use client';

import { useState } from 'react';
import { Sparkles, Users, Split, ShieldCheck, Check } from 'lucide-react';

export default function MarketingLeadAssignmentPage() {
  const [assignmentMode, setAssignmentMode] = useState<'Auto' | 'Manual' | 'Round Robin'>('Round Robin');
  const [salesReps, setSalesReps] = useState([
    { id: 1, name: 'Varun Malhotra', activeLeads: 12, conversionRate: '88%' },
    { id: 2, name: 'Sneha Gupta', activeLeads: 18, conversionRate: '94%' },
    { id: 3, name: 'Amit Patel', activeLeads: 5, conversionRate: '75%' },
  ]);

  const [history, setHistory] = useState([
    { id: 1, lead: 'Rohan Sharma', assignedTo: 'Sneha Gupta', time: '5 mins ago', mode: 'Round Robin' },
    { id: 2, lead: 'Deepika Sen', assignedTo: 'Varun Malhotra', time: '1 hour ago', mode: 'Manual' },
  ]);

  const assignLead = (repId: number, repName: string) => {
    alert(`Unassigned lead successfully dispatched to ${repName}!`);
    setHistory(prev => [
      { id: Date.now(), lead: 'New Incoming Lead', assignedTo: repName, time: 'Just now', mode: assignmentMode },
      ...prev
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lead Assignment Rules</h2>
          <p className="text-xs text-slate-500 mt-1">Distribute incoming leads automatically or manually assign them to Sales Executives.</p>
        </div>
      </div>

      {/* Top count card & mode selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unassigned Leads</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">156</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Distribution Mode</span>
            <span className="text-xs font-bold text-slate-700">Currently: {assignmentMode}</span>
          </div>
          <div className="flex gap-2">
            {(['Auto', 'Manual', 'Round Robin'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAssignmentMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  assignmentMode === mode
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Reps Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sales Executives</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Sales Executive</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Active Leads</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Conversion Rate</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{rep.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{rep.activeLeads}</td>
                    <td className="px-5 py-3.5 text-xs text-emerald-600 font-mono font-bold">{rep.conversionRate}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => assignLead(rep.id, rep.name)}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition"
                      >
                        Assign Lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* History log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Assignment History</h3>
          <div className="space-y-3 pt-2">
            {history.map(item => (
              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="text-xs text-slate-700 font-bold">{item.lead}</p>
                <p className="text-[10px] text-slate-500 font-medium">Assigned to: {item.assignedTo} ({item.mode})</p>
                <span className="text-[9px] text-slate-400 block font-medium">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
