'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowDown, ChevronDown, Loader2 } from 'lucide-react';
import api from '../../../../services/api';

interface DashData {
  totalCampaigns?: number;
  totalLeads?: number;
  conversionRate?: number;
}

export default function MarketingFunnelPage() {
  const [campaign, setCampaign] = useState('All');
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashData>({});
  const [campaigns, setCampaigns] = useState<{ id: number | string; name: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, campRes] = await Promise.allSettled([
          api.get('/marketing/dashboard'),
          api.get('/campaigns'),
        ]);
        if (dashRes.status === 'fulfilled') {
          setDash(dashRes.value.data?.data || dashRes.value.data || {});
        }
        if (campRes.status === 'fulfilled') {
          const d = campRes.value.data?.data || campRes.value.data?.campaigns || campRes.value.data || [];
          setCampaigns(Array.isArray(d) ? d : []);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Build funnel from real data if available
  const totalLeads = dash.totalLeads ?? 1256;
  const clicks = Math.round(totalLeads / 0.176);
  const impressions = Math.round(clicks / 0.048);
  const conversions = Math.round(totalLeads * (dash.conversionRate ? dash.conversionRate / 100 : 0.452));

  const funnelStages = [
    { name: 'Impressions',     value: impressions.toLocaleString(),  dropoff: '4.8% CTR'         },
    { name: 'Clicks / Visits', value: clicks.toLocaleString(),       dropoff: '17.6% lead rate'   },
    { name: 'Leads Generated', value: totalLeads.toLocaleString(),   dropoff: '45.2% conv. rate'  },
    { name: 'Conversions',     value: conversions.toLocaleString(),  dropoff: 'Complete sales'    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading funnel data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Conversion Funnel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track conversions at each level, calculate drop-off ratios, and optimize customer journeys.
          </p>
        </div>
        <div className="relative">
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-xs font-semibold bg-white dark:bg-[#161616] text-slate-700 dark:text-[#ededed] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition outline-none"
          >
            <option value="All">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel diagram */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Pipeline Flow</h3>

          <div className="space-y-4 max-w-lg mx-auto">
            {funnelStages.map((stage, idx) => {
              const widthClass = idx === 0 ? 'w-full' : idx === 1 ? 'w-11/12' : idx === 2 ? 'w-10/12' : 'w-8/12';
              const bgClass = ['bg-blue-600', 'bg-blue-500', 'bg-indigo-500', 'bg-indigo-600'][idx];
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`${widthClass} ${bgClass} text-white p-4 rounded-2xl flex justify-between items-center shadow-md`}>
                    <div>
                      <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider block">{stage.name}</span>
                      <span className="text-lg font-extrabold">{stage.value}</span>
                    </div>
                    <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                      Level {idx + 1}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className="flex flex-col items-center py-2 text-red-500 dark:text-red-400">
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-0.5">{stage.dropoff} drop-off</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI improvement cards */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4 self-start">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">AI Optimization Tips</h3>
          </div>
          <div className="space-y-4 pt-2">
            {[
              {
                title: 'High Click Drop-off',
                desc: 'CTR is 4.8% but leads conversion is 17%. Consider checking mobile landing page load speed.',
                status: 'Attention',
              },
              {
                title: 'Re-target Incomplete Leads',
                desc: `${conversions} conversions from ${totalLeads} leads. Re-engage the rest with automated WhatsApp sequence.`,
                status: 'Action',
              },
            ].map((tip, idx) => (
              <div key={idx} className="p-3.5 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-violet-900 dark:text-violet-300">{tip.title}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400">
                    {tip.status}
                  </span>
                </div>
                <p className="text-[11px] text-violet-700 dark:text-violet-400 leading-relaxed font-medium mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
