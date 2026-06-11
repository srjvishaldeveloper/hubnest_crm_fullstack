'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';

export default function MarketingCreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('Lead Gen');
  const [platform, setPlatform] = useState('FB');
  const [ageRange, setAgeRange] = useState('18-45');
  const [interests, setInterests] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [headline, setHeadline] = useState('');
  const [cta, setCta] = useState('Learn More');
  const [landingUrl, setLandingUrl] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const nextStep = () => {
    if (step === 1 && !campaignName.trim()) { setError('Campaign name is required.'); return; }
    if (step === 3 && !dailyBudget) { setError('Daily budget is required.'); return; }
    if (step === 4 && !headline.trim()) { setError('Ad headline is required.'); return; }
    setError('');
    setStep(prev => Math.min(prev + 1, 5));
  };
  const prevStep = () => { setError(''); setStep(prev => Math.max(prev - 1, 1)); };

  const launchCampaign = async () => {
    if (!landingUrl.trim()) { setError('Landing page URL is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/campaigns', {
        name: campaignName,
        type: campaignType,
        platform,
        status: 'Active',
        budget_daily: parseFloat(dailyBudget) || 0,
        budget_total: (parseFloat(dailyBudget) || 0) * 30,
        start_date: startDate || null,
        end_date: endDate || null,
        target_audience: { age_range: ageRange, interests },
        content: { headline, cta },
        schedule_config: { landing_url: landingUrl, utm_campaign: utmCampaign },
      });
      router.push('/marketing/campaigns');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create campaign.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold placeholder:text-slate-400';
  const selectCls = inputCls;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Create Campaign</h2>
        <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Design, configure, and launch advertising campaigns across platforms.</p>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-[#222] h-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-400 font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-6 flex flex-col justify-between min-h-[420px]">

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Step 1: Basic Details</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Campaign Name *</label>
                <input type="text" placeholder="e.g. Summer Sale 2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Campaign Type</label>
                  <select value={campaignType} onChange={e => setCampaignType(e.target.value)} className={selectCls}>
                    <option>Lead Gen</option>
                    <option>Awareness</option>
                    <option>Conversion</option>
                    <option>Retargeting</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className={selectCls}>
                    <option value="FB">Facebook</option>
                    <option value="Google">Google</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Step 2: Target Audience</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Age Range</label>
                <input type="text" value={ageRange} onChange={e => setAgeRange(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Interests</label>
                <input type="text" placeholder="e.g. Technology, Business, Marketing" value={interests} onChange={e => setInterests(e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Step 3: Budget & Schedule</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Daily Budget (₹)</label>
                <input type="number" min="0" placeholder="e.g. 1500" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Step 4: Ad Creative</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Ad Headline</label>
                <input type="text" placeholder="e.g. Master CRM automation today!" value={headline} onChange={e => setHeadline(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">CTA Button</label>
                <select value={cta} onChange={e => setCta(e.target.value)} className={selectCls}>
                  <option>Learn More</option>
                  <option>Sign Up</option>
                  <option>Book Demo</option>
                  <option>Get Started</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Step 5: Tracking</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">Landing Page URL</label>
                <input type="text" placeholder="https://yourwebsite.com/landing" value={landingUrl} onChange={e => setLandingUrl(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider block mb-1">UTM Campaign Parameter</label>
                <input type="text" placeholder="utm_campaign=summer_2026" value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              {/* Summary */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-[#111] rounded-xl border border-slate-100 dark:border-[#222] space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 dark:text-[#d4d4d4] mb-2 text-[11px] uppercase tracking-wider">Campaign Summary</p>
                {[
                  ['Name', campaignName || '—'],
                  ['Type', campaignType],
                  ['Platform', platform],
                  ['Daily Budget', dailyBudget ? `₹${Number(dailyBudget).toLocaleString()}` : '—'],
                  ['Duration', startDate && endDate ? `${startDate} → ${endDate}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 dark:text-[#737373]">{k}</span>
                    <span className="font-semibold text-slate-700 dark:text-[#ededed]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-[#1f1f1f] mt-6">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition ${
                step === 1 ? 'text-slate-300 dark:text-[#555] border-slate-200 dark:border-[#333]' : 'text-slate-600 dark:text-[#a3a3a3] border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            {step < 5 ? (
              <button onClick={nextStep} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={launchCampaign} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-sm">
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Launching...</> : <><CheckCircle className="w-3.5 h-3.5" /> Launch Campaign</>}
              </button>
            )}
          </div>
        </div>

        {/* AI Panel */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm space-y-4 self-start">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">AI Copywriter Suggestions</h3>
          </div>
          <div className="space-y-3 pt-2">
            {[
              'Unlock 2.3x higher conversion rate with our CRM automation tool.',
              'Empower your marketing and sales departments with next-gen AI insights.',
              'Stop losing B2B leads. Scale your operations today with HubNest.',
            ].map((copy, idx) => (
              <button
                key={idx}
                onClick={() => setHeadline(copy)}
                className="w-full text-left p-3 bg-violet-50/50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl text-xs text-violet-900 dark:text-violet-300 leading-relaxed font-semibold hover:bg-violet-50 dark:hover:bg-violet-500/15 transition"
              >
                {copy}
              </button>
            ))}
            <p className="text-[10px] text-slate-400 dark:text-[#737373]">Click a suggestion to use it as your headline.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
