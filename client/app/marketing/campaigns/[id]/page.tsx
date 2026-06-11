'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Share2, Loader2, AlertCircle, Pencil, Trash2, CheckCircle, X } from 'lucide-react';
import api from '../../../../services/api';

interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string;
  campaign_type: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  target_audience?: { age_range?: string; interests?: string };
  content?: { headline?: string; cta?: string };
  analytics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    daily?: { date: string; clicks: number; conversions: number }[];
  };
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  Paused: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  Completed: 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
  Draft: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
};

export default function MarketingCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Performance' | 'Leads' | 'Creative' | 'Settings'>('Overview');
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ data: { campaign: Campaign } }>(`/campaigns/${id}`);
      const c = res.data.data.campaign;
      setCampaign(c);
      setNameVal(c.name);
    } catch {
      setError('Campaign not found or failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const saveName = async () => {
    if (!nameVal.trim() || !campaign) return;
    setSaving(true);
    try {
      const res = await api.patch<{ data: { campaign: Campaign } }>(`/campaigns/${id}`, { name: nameVal });
      setCampaign(res.data.data.campaign);
      setEditName(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const toggleStatus = async (newStatus: string) => {
    if (!campaign) return;
    try {
      const res = await api.patch<{ data: { campaign: Campaign } }>(`/campaigns/${id}`, { status: newStatus });
      setCampaign(res.data.data.campaign);
    } catch { /* silent */ }
  };

  const deleteCampaign = async () => {
    try {
      await api.delete(`/campaigns/${id}`);
      router.push('/marketing/campaigns');
    } catch { /* silent */ }
  };

  const graphData = campaign?.analytics?.daily?.length
    ? campaign.analytics.daily
    : [
        { date: 'Mon', clicks: 0, conversions: 0 },
        { date: 'Tue', clicks: 0, conversions: 0 },
        { date: 'Wed', clicks: 0, conversions: 0 },
        { date: 'Thu', clicks: 0, conversions: 0 },
        { date: 'Fri', clicks: 0, conversions: 0 },
      ];

  const cpl = campaign?.analytics?.conversions && campaign.analytics.spend
    ? Math.round(campaign.analytics.spend / campaign.analytics.conversions)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  if (error || !campaign) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">{error || 'Campaign not found.'}</p>
      <button onClick={() => router.push('/marketing/campaigns')} className="text-xs text-blue-600 font-bold hover:underline">
        Back to Campaigns
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  className="text-lg font-bold px-2 py-0.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-[#111] text-slate-900 dark:text-[#ededed] outline-none"
                  autoFocus
                />
                <button onClick={saveName} disabled={saving} className="p-1 text-emerald-600 hover:text-emerald-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditName(false); setNameVal(campaign.name); }} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">{campaign.name}</h2>
                <button onClick={() => setEditName(true)} className="p-1 text-slate-300 dark:text-[#555] hover:text-slate-600 dark:hover:text-[#a3a3a3] transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${STATUS_COLORS[campaign.status] || STATUS_COLORS.Draft}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">
            ID: {id} &bull; Platform: {campaign.platform} &bull; Type: {campaign.campaign_type}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campaign.status === 'Active' ? (
            <button onClick={() => toggleStatus('Paused')} className="px-3 py-1.5 text-xs font-bold border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition">
              Pause
            </button>
          ) : campaign.status === 'Paused' ? (
            <button onClick={() => toggleStatus('Active')} className="px-3 py-1.5 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition">
              Resume
            </button>
          ) : null}
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-[#333] rounded-xl text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} className="p-1.5 text-slate-300 dark:text-[#555] hover:text-red-500 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-red-500 font-bold">Delete?</span>
              <button onClick={deleteCampaign} className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Yes</button>
              <button onClick={() => setDeleteConfirm(false)} className="px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-[#333] rounded-lg text-slate-500 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">No</button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1f1f1f] overflow-x-auto">
        {(['Overview', 'Performance', 'Leads', 'Creative', 'Settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-[#a3a3a3]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Budget', value: campaign.budget ? `₹${Number(campaign.budget).toLocaleString()}` : '—', desc: 'Total campaign budget' },
              { label: 'Impressions', value: campaign.analytics?.impressions?.toLocaleString() || '0', desc: 'Total impressions' },
              { label: 'Leads Generated', value: campaign.analytics?.conversions?.toLocaleString() || '0', desc: 'Total conversions' },
              { label: 'CPL', value: cpl ? `₹${cpl}` : '—', desc: 'Cost per lead' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
                <p className="text-[10px] text-slate-400 dark:text-[#737373] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-[#ededed] mt-0.5">{s.value}</p>
                <span className="text-[10px] text-slate-400 dark:text-[#737373] block mt-0.5">{s.desc}</span>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Clicks vs Conversions</h3>
            <div className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                  <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#a3a3a3] font-semibold">
                <span className="w-3 h-1 bg-blue-500 rounded-full inline-block" /> Clicks
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#a3a3a3] font-semibold">
                <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" /> Conversions
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Performance' && (
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Performance Metrics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Clicks', value: campaign.analytics?.clicks?.toLocaleString() || '0' },
              { label: 'Impressions', value: campaign.analytics?.impressions?.toLocaleString() || '0' },
              { label: 'Conversions', value: campaign.analytics?.conversions?.toLocaleString() || '0' },
              { label: 'Total Spend', value: campaign.analytics?.spend ? `₹${Number(campaign.analytics.spend).toLocaleString()}` : '₹0' },
              { label: 'CTR', value: campaign.analytics?.clicks && campaign.analytics?.impressions
                ? `${((campaign.analytics.clicks / campaign.analytics.impressions) * 100).toFixed(2)}%`
                : '0%' },
              { label: 'CVR', value: campaign.analytics?.conversions && campaign.analytics?.clicks
                ? `${((campaign.analytics.conversions / campaign.analytics.clicks) * 100).toFixed(2)}%`
                : '0%' },
            ].map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-[#111] rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-[#737373] font-bold uppercase tracking-wider">{m.label}</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-[#ededed] mt-1">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Leads' && (
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-4">Leads from this Campaign</h3>
          <p className="text-xs text-slate-400 dark:text-[#737373]">
            Leads generated by this campaign appear in the{' '}
            <button onClick={() => router.push('/marketing/leads')} className="text-blue-600 font-bold hover:underline">
              Leads module
            </button>{' '}
            filtered by Campaign ID: <span className="font-mono font-bold text-slate-700 dark:text-[#d4d4d4]">{id}</span>.
          </p>
        </div>
      )}

      {activeTab === 'Creative' && (
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Ad Creative</h3>
          {[
            ['Headline', campaign.content?.headline || '—'],
            ['CTA', campaign.content?.cta || '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <label className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider block mb-1">{k}</label>
              <p className="text-sm font-semibold text-slate-800 dark:text-[#ededed]">{v}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Campaign Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              ['Platform', campaign.platform],
              ['Type', campaign.campaign_type],
              ['Status', campaign.status],
              ['Budget', campaign.budget ? `₹${Number(campaign.budget).toLocaleString()}` : '—'],
              ['Start Date', campaign.start_date || '—'],
              ['End Date', campaign.end_date || '—'],
              ['Target Age', campaign.target_audience?.age_range || '—'],
              ['Interests', campaign.target_audience?.interests || '—'],
            ].map(([k, v]) => (
              <div key={k} className="p-3 bg-slate-50 dark:bg-[#111] rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider">{k}</p>
                <p className="font-semibold text-slate-800 dark:text-[#ededed] mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
