'use client';

import { useState } from 'react';
import { Plug, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    { id: 1, name: 'Google Workspace', desc: 'Sync corporate email inbox, calendar, and workspace logs.', status: 'Connected', category: 'Email & Calendar' },
    { id: 2, name: 'Twilio Cloud', desc: 'Make inbound and outbound calls directly from lead cards.', status: 'Disconnected', category: 'VoIP & Calling' },
    { id: 3, name: 'Meta Ad Manager', desc: 'Sync facebook ad leads directly into your lead manager.', status: 'Connected', category: 'Advertising' },
    { id: 4, name: 'Slack Alerts', desc: 'Push notification alerts to team Slack channels.', status: 'Disconnected', category: 'Team Communications' },
  ]);

  const toggleConnection = (id: number) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Connected' ? 'Disconnected' : 'Connected';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Third-Party Integrations</h2>
          <p className="text-xs text-slate-500 mt-1">Connect corporate tools to automate workflows, sync lead registers, and configure alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 uppercase tracking-wide">
                  {item.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                  item.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 dark:bg-[#161616] text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-3.5">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {item.status === 'Connected' ? 'Active' : 'Offline'}
              </span>
              <button
                onClick={() => toggleConnection(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  item.status === 'Connected'
                    ? 'bg-red-50 hover:bg-red-100 text-red-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {item.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
