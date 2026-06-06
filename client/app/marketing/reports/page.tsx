'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Download, Calendar } from 'lucide-react';

function MarketingReportsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'campaigns';

  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads' | 'roi'>(tabParam as any);
  const [dateRange, setDateRange] = useState('This Month');
  const [scheduled, setScheduled] = useState([
    { id: 1, name: 'Weekly Campaign Performance', type: 'Email PDF', frequency: 'Every Monday', active: true },
    { id: 2, name: 'Monthly ROI & Leads Summary', type: 'CSV Export', frequency: '1st of Month', active: true },
  ]);

  const toggleSchedule = (id: number) => {
    setScheduled(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleExport = (format: string) => {
    alert(`Exporting ${activeTab} report as ${format}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports Dispatch</h2>
          <p className="text-xs text-slate-500 mt-1">Generate immediate marketing performance exports or configure automated email reports.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex gap-2">
          {(['campaigns', 'leads', 'roi'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === t
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t} Report
            </button>
          ))}
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
        >
          <option>This Week</option>
          <option>This Month</option>
          <option>Last 3 Months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export action card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Export Options
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate a detailed summary report for {activeTab} matching the filters selected above.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {['PDF', 'Excel', 'CSV'].map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition text-slate-600 font-bold"
              >
                <Download className="w-5 h-5 text-slate-400 mb-2" />
                <span className="text-xs">Export {format}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled reports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" /> Scheduled Reports
          </h3>
          <div className="space-y-3 pt-2">
            {scheduled.map(s => (
              <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">{s.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.frequency} • {s.type}</p>
                </div>
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={() => toggleSchedule(s.id)}
                  className="w-8 h-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Reports...</div>}>
      <MarketingReportsContent />
    </Suspense>
  );
}
