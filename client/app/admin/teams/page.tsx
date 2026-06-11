'use client';

import { useState } from 'react';
import { Users, Plus, Shield, Search, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([
    { id: 1, name: 'Sales Core', lead: 'Varun Malhotra', membersCount: 12, dept: 'Sales', description: 'Core sales executive team responsible for inbound leads.' },
    { id: 2, name: 'Growth Marketing', lead: 'Priya Sharma', membersCount: 6, dept: 'Marketing', description: 'Paid ads, UTM tracking and performance marketing.' },
    { id: 3, name: 'Level 1 Support', lead: 'Amit Patel', membersCount: 15, dept: 'Support', description: 'Frontline support agents handling tickets and chats.' },
  ]);

  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Teams Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage departmental teams, assign leads, and define team leads.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl px-3 py-1.5 w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs outline-none w-full text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams
          .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
          .map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 uppercase tracking-wide">
                    {t.dept}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Users className="w-3.5 h-3.5" /> {t.membersCount} members
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{t.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Team Lead</span>
                  <span className="text-xs font-bold text-slate-700">{t.lead}</span>
                </div>
                <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
