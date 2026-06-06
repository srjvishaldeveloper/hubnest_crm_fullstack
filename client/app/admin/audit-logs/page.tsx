'use client';

import { useState } from 'react';
import { ScrollText, Search, Download } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'SCHEMA_UPDATE', details: 'Added column `department` to team records', user: 'srjchudamanideveloper@gmail.com', date: '06 Jun 2026, 12:45 PM' },
    { id: 2, type: 'USER_DELETE', details: 'Deleted tenant admin ADM-1011', user: 'srjchudamanideveloper@gmail.com', date: '06 Jun 2026, 12:32 PM' },
    { id: 3, type: 'EXPORT_CSV', details: 'Exported leads database (3,540 rows)', user: 'sandipsharm4321@gmail.com', date: '05 Jun 2026, 08:14 PM' },
    { id: 4, type: 'PASSWORD_RESET', details: 'Reset password of sandipsharm4321@gmail.com', user: 'srjchudamanideveloper@gmail.com', date: '05 Jun 2026, 04:30 PM' },
  ]);

  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1">Immutable system configuration changes, user deletions, database migrations, and bulk exports.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition">
          <Download className="w-3.5 h-3.5" /> Export Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs outline-none w-full text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase w-48">Log Type</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Operation Details</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Triggered By</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs
                .filter((l) => l.type.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()))
                .map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        l.type.startsWith('USER') ? 'bg-red-50 text-red-600' :
                        l.type.startsWith('SCHEMA') ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{l.details}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">{l.user}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{l.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
