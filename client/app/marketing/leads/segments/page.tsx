'use client';

import { useState } from 'react';
import { Plus, X, Search, Filter, Layers } from 'lucide-react';

export default function MarketingLeadsSegmentsPage() {
  const [segments, setSegments] = useState([
    { id: 1, name: 'High Quality Noida Leads', count: 42, criteria: 'Quality = High, Location = Noida', date: '06 Jun 2026' },
    { id: 2, name: 'Facebook Ads Conversions', count: 180, criteria: 'Source = Facebook Ads, Status = Converted', date: '05 Jun 2026' },
    { id: 3, name: 'Awaiting Call Dispatch', count: 124, criteria: 'Status = Assigned, Date > 01 Jun 2026', date: '04 Jun 2026' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [criteria, setCriteria] = useState('Quality = High');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName) return;
    setSegments(prev => [
      { id: Date.now(), name: segmentName, count: Math.floor(Math.random() * 100) + 10, criteria, date: 'Today' },
      ...prev
    ]);
    setSegmentName('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leads Segments</h2>
          <p className="text-xs text-slate-500 mt-1">Group your leads based on advertising source, location, response status, or quality scoring.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Segment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {segments.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 uppercase tracking-wide">
                  {item.count} leads
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.date}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-3.5">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-mono text-[10px] bg-slate-50 dark:bg-[#161616] p-2 rounded-lg border border-slate-100 dark:border-[#1f1f1f]">
                {item.criteria}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-end">
              <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                View Leads
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f] flex justify-between items-center bg-slate-50 dark:bg-[#161616]">
              <h3 className="text-sm font-bold text-slate-900">Create Lead Segment</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Segment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noida High Value Leads"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Filter Rule</label>
                <select
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                >
                  <option value="Quality = High">Quality Score is High</option>
                  <option value="Source = Facebook Ads">Source is Facebook Ads</option>
                  <option value="Status = Converted">Status is Converted</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm mt-2">
                Save Segment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
