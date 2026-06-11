'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, Globe, Smartphone, Heart, Loader2 } from 'lucide-react';
import api from '../../../../services/api';

interface Lead {
  source?: string;
  platform?: string;
  status?: string;
  quality?: number;
  quality_score?: number;
}

const DEFAULT_AGE_DATA = [
  { name: '18-24', value: 2400 },
  { name: '25-34', value: 4560 },
  { name: '35-44', value: 3120 },
  { name: '45-54', value: 1890 },
  { name: '55+',   value: 890  },
];

const DEFAULT_DEVICE_DATA = [
  { name: 'Mobile',  value: 1256, color: '#4F46E5' },
  { name: 'Desktop', value: 580,  color: '#10B981' },
  { name: 'Tablet',  value: 120,  color: '#F59E0B' },
];

const LOCATIONS = [
  { city: 'Noida',     count: '452', ctr: '5.4%' },
  { city: 'Delhi NCR', count: '310', ctr: '4.9%' },
  { city: 'Mumbai',    count: '280', ctr: '4.6%' },
  { city: 'Bengaluru', count: '220', ctr: '4.8%' },
  { city: 'Hyderabad', count: '145', ctr: '4.2%' },
];

const INTERESTS = [
  { label: 'Technology / CRM Solutions', width: 92 },
  { label: 'Business Automation',        width: 84 },
  { label: 'Digital Ads / Marketing',    width: 76 },
  { label: 'Startup Scaling',            width: 64 },
];

export default function MarketingAudiencePage() {
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [deviceData, setDeviceData] = useState(DEFAULT_DEVICE_DATA);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/marketing/leads');
        const leads: Lead[] = res.data?.data || res.data?.leads || res.data || [];
        if (Array.isArray(leads) && leads.length > 0) {
          setTotalLeads(leads.length);
          const deviceMap: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
          leads.forEach((l) => {
            const src = l.source || l.platform || '';
            if (/mobile|whatsapp|sms/i.test(src)) deviceMap.Mobile++;
            else if (/desktop|google|facebook/i.test(src)) deviceMap.Desktop++;
            else deviceMap.Tablet++;
          });
          if (deviceMap.Mobile + deviceMap.Desktop + deviceMap.Tablet > 0) {
            setDeviceData([
              { name: 'Mobile',  value: deviceMap.Mobile,  color: '#4F46E5' },
              { name: 'Desktop', value: deviceMap.Desktop, color: '#10B981' },
              { name: 'Tablet',  value: deviceMap.Tablet,  color: '#F59E0B' },
            ]);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const deviceTotal = deviceData.reduce((s, d) => s + d.value, 0) || 1956;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading audience data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Audience Demographics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze audience age groups, geolocations, top interests, and active devices across campaigns.
          </p>
        </div>
        {totalLeads > 0 && (
          <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{totalLeads.toLocaleString()} Total Leads</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age distribution */}
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Age Group Distribution
          </h3>
          <div className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEFAULT_AGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#fff',
                  }}
                />
                <Bar dataKey="value" name="Leads Count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Device Breakdown
          </h3>
          <div className="h-72 pt-4 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #E2E8F0' }}
                  />
                  <Pie
                    data={deviceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 shrink-0">
              {deviceData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: {d.value} leads ({Math.round((d.value / deviceTotal) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top locations */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#ededed] uppercase tracking-wider">Top Geolocations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-100 dark:border-[#1f1f1f]">
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">City</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Leads Count</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">CTR %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                {LOCATIONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700 dark:text-[#ededed]">{row.city}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{row.count}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{row.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top interests */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] flex items-center gap-2">
            <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Top Target Interests
          </h3>
          <div className="space-y-4 pt-2">
            {INTERESTS.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">{item.label}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">{item.width}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
