'use client';

import { useState } from 'react';
import { Sparkles, ArrowDown, ChevronDown, Percent } from 'lucide-react';

export default function MarketingFunnelPage() {
  const [campaign, setCampaign] = useState('All');

  const funnelStages = [
    { name: 'Impressions', value: '1,48,600', dropoff: '4.8% CTR' },
    { name: 'Clicks / Visits', value: '7,132', dropoff: '17.6% lead rate' },
    { name: 'Leads Generated', value: '1,256', dropoff: '45.2% conv. rate' },
    { name: 'Conversions', value: '568', dropoff: 'Complete sales' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Conversion Funnel</h2>
          <p className="text-xs text-slate-500 mt-1">Track conversions at each level, calculate drop-off ratios, and optimize customer journeys.</p>
        </div>
        <div className="relative">
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 transition outline-none text-slate-700"
          >
            <option value="All">All Campaigns</option>
            <option value="Summer Sale">Summer Sale 2026</option>
            <option value="Google Search">Google Search Brand</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel diagram */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Pipeline Flow</h3>

          <div className="space-y-4 max-w-lg mx-auto">
            {funnelStages.map((stage, idx) => {
              const widthClass = idx === 0 ? 'w-full' : idx === 1 ? 'w-11/12' : idx === 2 ? 'w-10/12' : 'w-8/12';
              const bgClass = idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-indigo-500' : 'bg-indigo-600';
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
                    <div className="flex flex-col items-center py-2 text-red-500">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 self-start">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Optimization Tips</h3>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { title: 'High Click Drop-off', desc: 'CTR is 4.8% but leads conversion is 17%. Consider checking mobile landing page load speed.', status: 'Attention' },
              { title: 'Re-target Incomplete Leads', desc: '568 conversions from 1,256 leads. Re-engage the rest with automated WhatsApp sequence.', status: 'Action' },
            ].map((tip, idx) => (
              <div key={idx} className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-violet-900">{tip.title}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-violet-100 text-violet-700">
                    {tip.status}
                  </span>
                </div>
                <p className="text-[11px] text-violet-700 leading-relaxed font-medium mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
