'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Globe, Smartphone, Heart } from 'lucide-react';

const AGE_DATA = [
  { name: '18-24', value: 2400 },
  { name: '25-34', value: 4560 },
  { name: '35-44', value: 3120 },
  { name: '45-54', value: 1890 },
  { name: '55+', value: 890 },
];

const DEVICE_DATA = [
  { name: 'Mobile', value: 1256, color: '#3B82F6' },
  { name: 'Desktop', value: 580, color: '#10B981' },
  { name: 'Tablet', value: 120, color: '#F59E0B' },
];

export default function MarketingAudiencePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audience Demographics</h2>
          <p className="text-xs text-slate-500 mt-1">Analyze audience age groups, geolocations, top interests, and active devices across campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Age Group Distribution
          </h3>
          <div className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" name="Leads Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" /> Device Breakdown
          </h3>
          <div className="h-72 pt-4 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={DEVICE_DATA}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {DEVICE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 shrink-0">
              {DEVICE_DATA.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: {d.value} leads ({Math.round((d.value / 1956) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top locations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Geolocations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">City</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Leads Count</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">CTR %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { city: 'Noida', count: '452', ctr: '5.4%' },
                  { city: 'Delhi NCR', count: '310', ctr: '4.9%' },
                  { city: 'Mumbai', count: '280', ctr: '4.6%' },
                  { city: 'Bengaluru', count: '220', ctr: '4.8%' },
                  { city: 'Hyderabad', count: '145', ctr: '4.2%' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{row.city}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono font-medium">{row.count}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-600 font-mono">{row.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top interests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-blue-600" /> Top Target Interests
          </h3>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Technology / CRM Solutions', width: '92%' },
              { label: 'Business Automation', width: '84%' },
              { label: 'Digital Ads / Marketing', width: '76%' },
              { label: 'Startup Scaling', width: '64%' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold">{item.label}</span>
                  <span className="text-slate-400 font-medium">{item.width}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
