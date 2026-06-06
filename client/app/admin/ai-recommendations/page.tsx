'use client';

import { useState } from 'react';
import { Brain, Sparkles, AlertCircle, ArrowRight, Check } from 'lucide-react';

export default function AdminAIRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([
    { id: 1, title: 'Optimize Campaign Budget', desc: 'Growth Marketing Campaign has an ROI of 214%. Consider transferring ₹45,000 from underperforming Sales campaigns.', impact: 'High Impact', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 2, title: 'Lead Assignment Balance', desc: 'Varun Malhotra has 142 active leads while Sneha Gupta has 98, despite Sneha having a 6% higher conversion rate. Re-balance split.', impact: 'Medium Impact', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 3, title: 'Support Shift Scaling', desc: 'Support tickets spike by 40% between 4 PM and 7 PM. Recommend scaling support agent capacity during these hours.', impact: 'Low Impact', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Recommendations</h2>
          <p className="text-xs text-slate-500 mt-1">Autonomous recommendations to optimize lead assignment, budget reallocation, and departmental staffing.</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.bg}`}>
                  <Icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                      r.impact.startsWith('High') ? 'bg-purple-50 text-purple-600' :
                      r.impact.startsWith('Medium') ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-2xl">{r.desc}</p>
                </div>
              </div>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shrink-0">
                Apply <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
