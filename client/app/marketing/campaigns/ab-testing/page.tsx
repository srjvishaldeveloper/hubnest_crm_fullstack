'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, X, Sparkles, CheckCircle2, Split } from 'lucide-react';

const CHART_DATA = [
  { name: 'Variant A (Headline A)', conv: 42, ctr: 4.8 },
  { name: 'Variant B (Headline B)', conv: 68, ctr: 7.2 },
];

export default function MarketingABTestingPage() {
  const [tests, setTests] = useState([
    { id: 1, name: 'Summer Campaign Headline test', variantA: 'Headline A (Short)', variantB: 'Headline B (Witty)', status: 'Running', winner: 'Pending' },
    { id: 2, name: 'Google Ads Description Test', variantA: 'Desc A (Benefit-led)', variantB: 'Desc B (Feature-led)', status: 'Completed', winner: 'Variant B' },
    { id: 3, name: 'Instagram Image Test', variantA: 'Image A (Team Photo)', variantB: 'Image B (Abstract)', status: 'Completed', winner: 'Variant A' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName) return;
    setTests(prev => [
      {
        id: Date.now(),
        name: testName,
        variantA: variantA || 'Default A',
        variantB: variantB || 'Default B',
        status: 'Running',
        winner: 'Pending',
      },
      ...prev
    ]);
    setTestName('');
    setVariantA('');
    setVariantB('');
    setShowModal(false);
  };

  const activeCount = tests.filter(t => t.status === 'Running').length;
  const winRate = '67%';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">A/B Testing</h2>
          <p className="text-xs text-slate-500 mt-1">Compare ad creatives, landing pages, or copy variants side-by-side to maximize conversion rates.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Active Tests', value: activeCount, icon: Split, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Win Rate of Variant B', value: winRate, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">A/B Experiments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Test Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Variant A</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Variant B</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{t.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{t.variantA}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{t.variantB}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        t.status === 'Running' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{t.winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Chart Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">CTR Comparison</h3>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Bar dataKey="ctr" name="CTR %" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Create A/B Test</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Header Text Split Test"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Variant A Creative</label>
                <input
                  type="text"
                  placeholder="Headline A copy..."
                  value={variantA}
                  onChange={(e) => setVariantA(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Variant B Creative</label>
                <input
                  type="text"
                  placeholder="Headline B copy..."
                  value={variantB}
                  onChange={(e) => setVariantB(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm mt-2">
                Launch Experiment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
