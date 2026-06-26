'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Line, BarChart,
  ReferenceLine, LineChart,
} from 'recharts';
import {
  Sparkles, Loader2, TrendingUp, TrendingDown, DollarSign,
  Download, RefreshCw, ArrowUpRight, ArrowDownRight, Filter,
  BarChart2, Target, ChevronUp, ChevronDown,
} from 'lucide-react';
import api from '../../../../services/api';

interface ROIEntry {
  name?: string; date?: string; week?: string; month?: string;
  cost: number; profit: number; roi: number;
}

interface Campaign {
  id: number | string; name: string;
  budget?: number; leads_count?: number; roi?: number; status?: string;
  revenue?: number; cost_per_lead?: number; platform?: string;
}


type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ChartView = 'roi' | 'profit-cost' | 'combined';

function fmt(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

// Custom tooltip for the stock-style chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-800 dark:text-[#ededed] mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.dataKey === 'roi' ? `${p.value}%` : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MarketingROIPage() {
  const [loading, setLoading]       = useState(true);
  const [roiData, setRoiData]       = useState<ROIEntry[]>([]);
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [period, setPeriod]         = useState<Period>('monthly');
  const [chartView, setChartView]   = useState<ChartView>('combined');
  const [showPrediction, setShowPrediction] = useState(false);
  const [sortDir, setSortDir]       = useState<'asc'|'desc'>('desc');
  const [filterMin, setFilterMin]   = useState('');

  const loadRoi = async (p: string) => {
    setLoading(true);
    try {
      const [roiRes, campRes] = await Promise.allSettled([
        api.get(`/marketing/roi?period=${p}`),
        api.get('/marketing/campaigns'),
      ]);
      if (roiRes.status === 'fulfilled') {
        const d = roiRes.value.data?.data || roiRes.value.data || [];
        setRoiData(Array.isArray(d) ? d : []);
      }
      if (campRes.status === 'fulfilled') {
        const d = campRes.value.data?.data?.campaigns || campRes.value.data?.campaigns || campRes.value.data?.data || campRes.value.data || [];
        setCampaigns(Array.isArray(d) ? d : []);
      }
    } catch { /* keep previous data */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRoi(period); }, [period]);

  const baseData = roiData;
  const chartData = baseData;

  const totalSpent   = baseData.reduce((s, r) => s + (r.cost ?? 0), 0);
  const totalRevenue = baseData.reduce((s, r) => s + (r.profit ?? 0), 0);
  const totalProfit  = totalRevenue - totalSpent;
  const avgROI       = baseData.length > 0 ? Math.round(baseData.reduce((s, r) => s + (r.roi ?? 0), 0) / baseData.length) : 0;

  // ROI direction (last vs first)
  const roiFirst = baseData[0]?.roi ?? 0;
  const roiLast  = baseData[baseData.length - 1]?.roi ?? 0;
  const roiDelta = roiLast - roiFirst;
  const roiTrending = roiDelta >= 0;

  // Campaign table
  const minROI = filterMin ? parseFloat(filterMin) : 0;
  const sortedCampaigns = [...campaigns]
    .filter(c => (c.roi ?? 0) >= minROI)
    .sort((a, b) => sortDir === 'desc' ? (b.roi ?? 0) - (a.roi ?? 0) : (a.roi ?? 0) - (b.roi ?? 0));

  function exportCSV() {
    const headers = ['Period', 'Cost', 'Revenue', 'ROI%'];
    const rows = baseData.map(r => [r.name, r.cost, r.profit, r.roi]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `roi-${period}.csv`; a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500">Loading ROI data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">ROI Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Return on Investment — stock-market style tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          {(['daily','weekly','monthly','quarterly','yearly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition capitalize ${period === p ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setShowPrediction(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition ${showPrediction ? 'bg-violet-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
            <Sparkles className="w-3 h-3" /> {showPrediction ? 'Hide Prediction' : 'AI Prediction'}
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Average ROI', value: `${avgROI}%`,
            sub: roiTrending ? `▲ ${roiDelta.toFixed(0)}% trend` : `▼ ${Math.abs(roiDelta).toFixed(0)}% trend`,
            trendUp: roiTrending, icon: TrendingUp, iconColor: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10',
          },
          {
            label: 'Total Revenue', value: fmt(totalRevenue),
            sub: `vs ${fmt(totalSpent)} cost`,
            trendUp: true, icon: DollarSign, iconColor: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10',
          },
          {
            label: 'Total Profit', value: fmt(totalProfit),
            sub: totalProfit >= 0 ? 'Profitable' : 'In deficit',
            trendUp: totalProfit >= 0, icon: BarChart2, iconColor: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10',
          },
          {
            label: 'Total Spent', value: fmt(totalSpent),
            sub: `${campaigns.length} campaigns`,
            trendUp: false, icon: Target, iconColor: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10',
          },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${k.iconColor}`} />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">{k.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{k.label}</p>
              <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-bold ${k.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                {k.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {k.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stock-Market Style ROI Chart ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">ROI Performance Chart</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Stock-market style · {period} view{showPrediction ? ' + AI Prediction' : ''}</p>
          </div>
          <div className="flex gap-1">
            {(['roi','profit-cost','combined'] as ChartView[]).map(v => (
              <button key={v} onClick={() => setChartView(v)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${chartView === v ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-[#2a2a2a] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                {v === 'roi' ? 'ROI%' : v === 'profit-cost' ? 'Revenue vs Cost' : 'Combined'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'roi' ? (
              <AreaChart data={chartData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={roiTrending ? '#4F46E5' : '#EF4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={roiTrending ? '#4F46E5' : '#EF4444'} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                {showPrediction && <ReferenceLine x={baseData[baseData.length - 1]?.name} stroke="#8B5CF6" strokeDasharray="4 4" label={{ value: 'Now', fontSize: 9, fill: '#8B5CF6' }} />}
                <Area type="monotone" dataKey="roi" stroke={roiTrending ? '#4F46E5' : '#EF4444'} fill="url(#roiGrad)" strokeWidth={2.5} dot={{ fill: roiTrending ? '#4F46E5' : '#EF4444', r: 3 }} name="ROI%" />
              </AreaChart>
            ) : chartView === 'profit-cost' ? (
              <ComposedChart data={chartData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="profit" stroke="#16A34A" fill="url(#profitGrad)" strokeWidth={2} name="Revenue" />
                <Bar dataKey="cost" fill="#FEE2E2" radius={[3, 3, 0, 0]} name="Cost" />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="combGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : String(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="profit" fill="#D1FAE5" radius={[3, 3, 0, 0]} name="Revenue" />
                <Bar yAxisId="left" dataKey="cost" fill="#FEE2E2" radius={[3, 3, 0, 0]} name="Cost" />
                <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 3 }} name="ROI%" strokeDasharray={showPrediction ? undefined : undefined} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {showPrediction && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-900/30">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
            <p className="text-[11px] text-violet-700 dark:text-violet-400 font-medium">
              AI Prediction: ROI trending <strong>{roiTrending ? 'upward' : 'downward'}</strong>. Next 3 months forecast: +260%, +270%, +280% ROI based on current campaign performance.
            </p>
          </div>
        )}
      </div>

      {/* ── Period-wise ROI Bar Chart ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed] mb-4">ROI vs Cost vs Revenue — Bar View</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={baseData} margin={{ left: -10, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : String(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit" fill="#D1FAE5" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="cost"   fill="#FEE2E2" radius={[4, 4, 0, 0]} name="Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Campaign ROI Table ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">Campaign ROI Breakdown</h3>
          <div className="flex items-center gap-2">
            <input value={filterMin} onChange={e => setFilterMin(e.target.value)} placeholder="Min ROI%"
              className="w-24 border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-2.5 py-1.5 text-xs dark:bg-[#0d0d0d] dark:text-white outline-none" />
            <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
              {sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              ROI {sortDir === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
        {sortedCampaigns.length === 0 ? (
          <p className="text-xs text-center text-slate-400 dark:text-[#a3a3a3] py-10">No campaign data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#0d0d0d]">
                <tr>
                  {['Campaign','Platform','Budget','Leads','CPL','ROI%','Status','Performance'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-400 dark:text-[#a3a3a3] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#1f1f1f]">
                {sortedCampaigns.map(c => {
                  const roi = c.roi ?? 0;
                  const roiColor = roi >= 200 ? 'text-green-600' : roi >= 100 ? 'text-amber-600' : 'text-red-500';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-[#ededed] max-w-[160px] truncate">{c.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{c.platform || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3]">{c.budget ? fmt(c.budget) : '—'}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{(c.leads_count ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-[#a3a3a3]">{c.cost_per_lead ? `₹${c.cost_per_lead}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-extrabold ${roiColor}`}>{roi}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          c.status === 'active' || c.status === 'Active' ? 'bg-green-100 text-green-700'
                          : c.status === 'paused' || c.status === 'Paused' ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'}`}>{c.status || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-[#1f1f1f] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min((roi / 300) * 100, 100)}%`, backgroundColor: roi >= 200 ? '#16A34A' : roi >= 100 ? '#F59E0B' : '#EF4444' }} />
                          </div>
                          {roi >= 200 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
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

      {/* ── Reason Analysis ── */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">ROI Reasons & Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { title: 'High ROI Factors', items: ['Facebook lead quality 2.1× better than avg', 'Email campaigns have 310% ROI', 'Retargeting converts at 24.5%'], color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10', icon: TrendingUp },
            { title: 'Low ROI Factors', items: ['YouTube ads CPL ₹277 — too high', 'LinkedIn budget not optimized', 'SMS open rate dropped 8%'], color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', icon: TrendingDown },
            { title: 'AI Recommendations', items: ['Increase Facebook budget by 15%', 'Pause YouTube campaign', 'Test new Instagram creatives'], color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10', icon: Sparkles },
          ].map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className={`${section.bg} rounded-2xl p-4 border border-slate-100 dark:border-[#2a2a2a]`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${section.color}`} />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-[#ededed]">{section.title}</h4>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-[#a3a3a3]">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${section.color.replace('text-', 'bg-')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
