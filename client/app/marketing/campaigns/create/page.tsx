'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, Image as ImageIcon } from 'lucide-react';

export default function MarketingCreateCampaignPage() {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('Lead Gen');
  const [platform, setPlatform] = useState('FB');
  const [ageRange, setAgeRange] = useState('18-45');
  const [dailyBudget, setDailyBudget] = useState('₹1,500');
  const [headline, setHeadline] = useState('');

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const launchCampaign = () => {
    alert('Campaign launched successfully!');
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Create Campaign</h2>
        <p className="text-xs text-slate-500 mt-1">Design, configure, and launch advertising campaigns across social and search platforms.</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Wizard */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6 flex flex-col justify-between min-h-[420px]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 1: Basic Details</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Sale 2026"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Type</label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                  >
                    <option value="Lead Gen">Lead Gen</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Conversion">Conversion</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                  >
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
              <h3 className="text-sm font-bold text-slate-900">Step 2: Target Audience</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Age Range</label>
                <input
                  type="text"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Location Interests</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Business, Marketing"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 3: Budget & Schedule</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Daily Budget</label>
                <input
                  type="text"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 4: Ad Creative</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ad Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Master CRM automation today!"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Button</label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold">
                  <option>Learn More</option>
                  <option>Sign Up</option>
                  <option>Book Demo</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Step 5: Tracking</h3>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Landing Page URL</label>
                <input
                  type="text"
                  placeholder="https://yourwebsite.com/landing"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">UTM Campaign Parameter</label>
                <input
                  type="text"
                  placeholder="utm_campaign=summer_2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold font-mono"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition ${
                step === 1 ? 'text-slate-300 border-slate-200' : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {step < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={launchCampaign}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Launch Campaign <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 self-start">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Copywriter suggestions</h3>
          </div>
          <div className="space-y-3 pt-2">
            {[
              'Unlock 2.3x higher conversion rate with our CRM automation tool.',
              'Empower your marketing and sales departments with next-gen AI insights.',
              'Stop losing B2B leads. Scale your operations today with Job Nest.',
            ].map((copy, idx) => (
              <div key={idx} className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-xs text-violet-900 leading-relaxed font-semibold">
                {copy}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
