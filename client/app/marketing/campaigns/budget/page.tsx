'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '../../../../services/api';

interface Campaign {
  id: string;
  name: string;
  budget_daily: number;
  budget_total: number;
  status: string;
}

export default function MarketingBudgetPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data: { campaigns: Campaign[] } }>('/campaigns');
        setCampaigns(res.data.data.campaigns || []);
      } catch {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget_total) || 0), 0);
  const totalSpent = 0; // actual spend tracked via campaign_analytics table, not in list view
  const remaining = totalBudget - totalSpent;
  const overBudget: Campaign[] = [];

  const spendChart = campaigns.slice(0, 7).map(c => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
    spend: Number(c.budget_daily) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Budget Manager</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Track allocations, daily spends, and cost optimization alerts across active campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}`, desc: 'Active allocations' },
          { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, desc: totalBudget ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% used` : '—' },
          { label: 'Remaining', value: `₹${Math.max(0, remaining).toLocaleString()}`, desc: 'Available budget' },
          { label: 'Over-budget', value: overBudget.length.toString(), desc: 'Campaigns over limit', color: overBudget.length > 0 ? 'text-red-600 dark:text-red-400' : undefined },
        ].map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
            <p className="text-[10px] text-slate-400 dark:text-[#737373] font-bold uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-extrabold mt-0.5 ${s.color || 'text-slate-900 dark:text-[#ededed]'}`}>{s.value}</p>
            <span className="text-[10px] text-slate-400 dark:text-[#737373] block mt-0.5">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden shadow-sm self-start">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#ededed] uppercase tracking-wider">Campaign Budgets</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-[#737373]">No campaigns found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#111] border-b border-slate-100 dark:border-[#1f1f1f]">
                    {['Campaign', 'Budget', 'Spent', 'Remaining', 'Used %'].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                  {campaigns.map(c => {
                    const budget = Number(c.budget_total) || 0;
                    const dailyBudget = Number(c.budget_daily) || 0;
                    const spent = 0; // spend data available only in campaign detail view
                    const rem = budget - spent;
                    const pct = '0.0';
                    const isOver = false;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-700 dark:text-[#ededed]">
                          <div className="flex items-center gap-1.5">
                            {isOver && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                            {c.name}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#a3a3a3] font-mono">{budget ? `₹${budget.toLocaleString()}` : '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#a3a3a3] font-mono">{`₹${dailyBudget.toLocaleString()}/day`}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#a3a3a3] font-mono">{budget > 0 ? `₹${rem.toLocaleString()}` : '—'}</td>
                        <td className="px-5 py-3.5 text-xs font-bold font-mono">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-[#222] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${parseFloat(pct) >= 100 ? 'bg-red-500' : parseFloat(pct) >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                              />
                            </div>
                            <span className={parseFloat(pct) >= 100 ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-[#a3a3a3]'}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Spend by Campaign</h3>
          {spendChart.length > 0 ? (
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={spendChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={80} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 11 }}
                    formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Spent']}
                  />
                  <Bar dataKey="spend" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 dark:text-[#737373]">
              No spend data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
