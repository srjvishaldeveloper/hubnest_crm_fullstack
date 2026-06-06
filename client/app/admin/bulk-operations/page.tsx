'use client';

import { useState } from 'react';
import { Layers, FileUp, ShieldAlert, ArrowRight, Play } from 'lucide-react';

export default function AdminBulkOperationsPage() {
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Lead Import - May Ads Campaign', type: 'CSV Import', count: 1540, status: 'Completed', date: '04 May 2026' },
    { id: 2, name: 'Reassign Leads - Sales Agent Switch', type: 'Bulk Reassignment', count: 180, status: 'Running', date: 'Just now' },
    { id: 3, name: 'Purge Spam Leads (Quality Score < 20)', type: 'Bulk Deletion', count: 42, status: 'Queued', date: 'Scheduled for tonight' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Bulk Operations</h2>
        <p className="text-xs text-slate-500 mt-1">Import large data batches, perform bulk status updates, reassignments, or purging.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <FileUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bulk Data Import</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Upload CSV/XLSX spreadsheets to populate Leads, Contacts, or CRM campaigns instantly.</p>
          </div>
          <button className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
            Launch Import Wizard
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bulk Reassignment</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Transfer ownership of multiple leads, contacts, or accounts from one user/team to another.</p>
          </div>
          <button className="w-full mt-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
            Start Mass Transfer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Operation Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Operation Name</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Type</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Records Affected</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{t.name}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{t.type}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 font-mono font-medium">{t.count}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      t.status === 'Running' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
