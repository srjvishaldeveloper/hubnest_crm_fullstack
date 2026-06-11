'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../services/api';
import { FileText, Download, Calendar, Loader2, Megaphone, Users, TrendingUp, DollarSign } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface Campaign {
  id: number;
  name: string;
  platform: string;
  budget: number;
  leads_count?: number;
  cost_per_lead?: number;
  roi?: number;
  status: string;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  source?: string;
  status: string;
  quality?: number;
  quality_score?: number;
  created_at?: string;
}

interface ROIData {
  date?: string;
  week?: string;
  cost: number;
  profit: number;
  roi: number;
}

function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${val.toLocaleString('en-IN')}`;
  return `₹${val}`;
}

function MarketingReportsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'campaigns';

  const [activeTab, setActiveTab] = useState<'campaigns' | 'leads' | 'roi'>(tabParam as any);
  const [dateRange, setDateRange] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [roiData, setRoiData] = useState<ROIData[]>([]);

  const [scheduled, setScheduled] = useState([
    { id: 1, name: 'Weekly Campaign Performance', type: 'Email PDF', frequency: 'Every Monday', active: true },
    { id: 2, name: 'Monthly ROI & Leads Summary', type: 'CSV Export', frequency: '1st of Month', active: true },
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [campRes, leadsRes, roiRes] = await Promise.allSettled([
          api.get('/campaigns'),
          api.get('/marketing/leads'),
          api.get('/marketing/roi'),
        ]);

        if (campRes.status === 'fulfilled') {
          const d = campRes.value.data?.data || campRes.value.data?.campaigns || campRes.value.data || [];
          setCampaigns(Array.isArray(d) ? d : []);
        }
        if (leadsRes.status === 'fulfilled') {
          const d = leadsRes.value.data?.data || leadsRes.value.data?.leads || leadsRes.value.data || [];
          setLeads(Array.isArray(d) ? d : []);
        }
        if (roiRes.status === 'fulfilled') {
          const d = roiRes.value.data?.data || roiRes.value.data || [];
          setRoiData(Array.isArray(d) ? d : []);
        }
      } catch (err: any) {
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleSchedule = (id: number) => {
    setScheduled(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleExport = (format: string) => {
    alert(`Exporting ${activeTab} report as ${format}...`);
  };

  // Computed summaries
  const totalSpent = campaigns.reduce((s, c) => s + (c.budget ?? 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_count ?? 0), 0);
  const avgRoi = campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => s + (c.roi ?? 0), 0) / campaigns.length) : 0;

  const converted = leads.filter(l => l.status?.toLowerCase() === 'converted').length;
  const avgQuality = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.quality ?? l.quality_score ?? 0), 0) / leads.length) : 0;

  const roiTotalCost = roiData.reduce((s, r) => s + (r.cost || 0), 0);
  const roiTotalProfit = roiData.reduce((s, r) => s + (r.profit || 0), 0);
  const roiAvg = roiData.length > 0 ? Math.round(roiData.reduce((s, r) => s + (r.roi || 0), 0) / roiData.length) : avgRoi;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports Dispatch</h2>
          <p className="text-xs text-slate-500 mt-1">Generate immediate marketing performance exports or configure automated email reports.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
      )}

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
                  : 'bg-slate-50 dark:bg-[#161616] text-slate-600 hover:bg-slate-100'
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading report data...</span>
        </div>
      ) : (
        <>
          {/* Report Summary Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              {activeTab === 'campaigns' ? 'Campaign Report Summary' : activeTab === 'leads' ? 'Lead Report Summary' : 'ROI Report Summary'}
            </h3>

            {activeTab === 'campaigns' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-violet-50 rounded-xl text-center">
                  <Megaphone className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{campaigns.length}</p>
                  <p className="text-[10px] text-slate-500">Total Campaigns</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{totalLeads.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">Total Leads</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(totalSpent)}</p>
                  <p className="text-[10px] text-slate-500">Total Spent</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{avgRoi}%</p>
                  <p className="text-[10px] text-slate-500">Avg ROI</p>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{leads.length.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">Total Leads</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{converted}</p>
                  <p className="text-[10px] text-slate-500">Converted</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-slate-900">{leads.length > 0 ? ((converted / leads.length) * 100).toFixed(1) : 0}%</p>
                  <p className="text-[10px] text-slate-500">Conversion Rate</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-slate-900">{avgQuality}%</p>
                  <p className="text-[10px] text-slate-500">Avg Quality</p>
                </div>
              </div>
            )}

            {activeTab === 'roi' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{roiAvg}%</p>
                  <p className="text-[10px] text-slate-500">Avg ROI</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(roiTotalCost)}</p>
                  <p className="text-[10px] text-slate-500">Total Cost</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-green-600">{formatCurrency(roiTotalProfit)}</p>
                  <p className="text-[10px] text-slate-500">Total Profit</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-lg font-extrabold text-blue-600">{roiData.length}</p>
                  <p className="text-[10px] text-slate-500">Data Points</p>
                </div>
              </div>
            )}
          </div>

          {/* Data Table Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Report Data Preview
            </h3>

            {activeTab === 'campaigns' && (
              campaigns.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No campaign data to display</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#161616]">
                    <tr>
                      {['Campaign', 'Platform', 'Budget', 'Leads', 'CPL', 'ROI', 'Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-slate-400 font-semibold text-[10px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {campaigns.slice(0, 10).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:bg-[#161616]/50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-3 py-2 text-slate-600">{c.platform || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{formatCurrency(c.budget || 0)}</td>
                        <td className="px-3 py-2 font-bold">{c.leads_count ?? 0}</td>
                        <td className="px-3 py-2 text-slate-600">{c.cost_per_lead ? formatCurrency(c.cost_per_lead) : '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`font-bold ${(c.roi ?? 0) >= 200 ? 'text-green-600' : (c.roi ?? 0) >= 150 ? 'text-blue-600' : 'text-amber-600'}`}>{c.roi ?? 0}%</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${c.status === 'active' || c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'leads' && (
              leads.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No leads data to display</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#161616]">
                    <tr>
                      {['Name', 'Email', 'Source', 'Status', 'Quality', 'Date'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-slate-400 font-semibold text-[10px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.slice(0, 10).map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:bg-[#161616]/50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{l.name}</td>
                        <td className="px-3 py-2 text-slate-600">{l.email}</td>
                        <td className="px-3 py-2 text-slate-600">{l.source || '—'}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-blue-100 text-blue-700">{l.status}</span>
                        </td>
                        <td className="px-3 py-2 font-bold">{l.quality ?? l.quality_score ?? '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'roi' && (
              roiData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No ROI data to display</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-[#161616]">
                    <tr>
                      {['Period', 'Cost', 'Profit', 'ROI'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-slate-400 font-semibold text-[10px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {roiData.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:bg-[#161616]/50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{r.date || r.week || `Period ${i + 1}`}</td>
                        <td className="px-3 py-2 text-slate-600">{formatCurrency(r.cost)}</td>
                        <td className="px-3 py-2 text-green-600 font-bold">{formatCurrency(r.profit)}</td>
                        <td className="px-3 py-2">
                          <span className={`font-bold ${r.roi >= 200 ? 'text-green-600' : r.roi >= 150 ? 'text-blue-600' : 'text-amber-600'}`}>{r.roi}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </>
      )}

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
                className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] hover:border-slate-300 transition text-slate-600 font-bold"
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
              <div key={s.id} className="p-3 bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f] rounded-xl flex items-center justify-between gap-2">
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
