'use client';

import { useState } from 'react';
import { Activity, Clock, ShieldAlert, Monitor, Globe } from 'lucide-react';

export default function AdminUserActivityPage() {
  const [logs, setLogs] = useState([
    { id: 1, user: 'Varun Malhotra', role: 'Sales Manager', action: 'Exported 150 Leads to CSV', ip: '192.168.1.45', time: '2 mins ago', status: 'Success' },
    { id: 2, user: 'Amit Patel', role: 'Support Agent', action: 'Resolved ticket #1024', ip: '103.45.67.12', time: '12 mins ago', status: 'Success' },
    { id: 3, user: 'Priya Sharma', role: 'Marketing Head', action: 'Failed login attempt (Wrong OTP)', ip: '202.89.102.4', time: '1 hour ago', status: 'Failed' },
    { id: 4, user: 'Rajeev Kumar', role: 'Admin', action: 'Created new tenant schema', ip: '127.0.0.1', time: '2 hours ago', status: 'Success' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">User Activity Logs</h2>
        <p className="text-xs text-slate-500 mt-1">Real-time audit log of actions, configuration changes, and login attempts across your workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Operations', value: '1,420', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Security Alerts', value: '3', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Sessions', value: '18', icon: Monitor, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">Live</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">User</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Action</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">IP Address</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Time</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-700">{l.user}</p>
                    <span className="text-[10px] text-slate-400">{l.role}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{l.action}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{l.ip}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{l.time}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      l.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
