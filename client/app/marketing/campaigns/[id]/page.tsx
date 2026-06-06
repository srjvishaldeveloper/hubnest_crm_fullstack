'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sliders, Activity, Target, Share2, Sparkles } from 'lucide-react';

const MOCK_GRAPH = [
  { date: 'Mon', clicks: 120, conversions: 12 },
  { date: 'Tue', clicks: 240, conversions: 24 },
  { date: 'Wed', clicks: 180, conversions: 18 },
  { date: 'Thu', clicks: 310, conversions: 35 },
  { date: 'Fri', clicks: 280, conversions: 28 },
];

export default function MarketingCampaignDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Performance' | 'Leads' | 'Creative' | 'Settings'>('Overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Summer Sale 2026</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Campaign ID: {id} • Platform: Facebook Ads</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          <Share2 className="w-3.5 h-3.5" /> Share Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['Overview', 'Performance', 'Leads', 'Creative', 'Settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              activeTab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Daily Budget', value: '₹1,500', desc: '₹7,500 total spent' },
              { label: 'Impressions', value: '82,450', desc: '5.2% click rate' },
              { label: 'Leads Generated', value: '1,256', desc: '45% conversion' },
              { label: 'CPL', value: '₹120', desc: 'Average cost per lead' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Clicks vs Conversions trend</h3>
            <div className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_GRAPH}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Performance' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Day</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Impressions</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Clicks</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Leads</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { day: '06 Jun 2026', imp: '12,500', clicks: '640', leads: '45', roi: '214%' },
                  { day: '05 Jun 2026', imp: '14,200', clicks: '710', leads: '52', roi: '198%' },
                  { day: '04 Jun 2026', imp: '11,800', clicks: '590', leads: '38', roi: '232%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{row.day}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.imp}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.clicks}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.leads}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-600 font-mono">{row.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Leads' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Email</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Quality Score</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Rohan Sharma', email: 'rohan.s@gmail.com', score: 'High', status: 'Assigned' },
                  { name: 'Deepika Sen', email: 'deepika.sen@gmail.com', score: 'Medium', status: 'New' },
                  { name: 'Kunal Verma', email: 'kunal.v@gmail.com', score: 'Low', status: 'Contacted' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{row.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{row.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                        row.score === 'High' ? 'bg-emerald-50 text-emerald-600' :
                        row.score === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {row.score}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-medium">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Creative' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 max-w-lg">
          <h3 className="text-sm font-bold text-slate-900">Creative Preview</h3>
          <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Master CRM automation with our comprehensive new tools. Scale your operations today!</p>
            <div className="bg-slate-200 h-48 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
              [ Ad Creative Image ]
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Call To Action</span>
              <button className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 max-w-md">
          <h3 className="text-sm font-bold text-slate-900">Campaign Settings</h3>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Budget Allocation Type</label>
              <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold">
                <option>Daily budget limit</option>
                <option>Total lifetime limit</option>
              </select>
            </div>
            <button className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
