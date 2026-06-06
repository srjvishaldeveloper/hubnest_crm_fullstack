'use client';

import { useState } from 'react';
import { Plus, X, Play, ShieldAlert, Check } from 'lucide-react';

export default function MarketingAutomationPage() {
  const [rules, setRules] = useState([
    { id: 1, name: 'Auto-pause on High CPL', trigger: 'CPL > ₹250', action: 'Pause Campaign', active: true },
    { id: 2, name: 'Scale Budget for High ROI', trigger: 'ROI > 200%', action: 'Increase Budget by 20%', active: true },
    { id: 3, name: 'Instant Sales Assignment', trigger: 'Lead Quality Score > 75', action: 'Assign to Sales Core Team', active: true },
    { id: 4, name: 'Weekend Schedule Stop', trigger: 'Day is Saturday or Sunday', action: 'Pause Campaign', active: false },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerVal, setTriggerVal] = useState('CPL > ₹200');
  const [actionVal, setActionVal] = useState('Pause Campaign');

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;
    setRules(prev => [
      { id: Date.now(), name: ruleName, trigger: triggerVal, action: actionVal, active: true },
      ...prev
    ]);
    setRuleName('');
    setShowModal(false);
  };

  const activeRulesCount = rules.filter(r => r.active).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campaign Automation</h2>
          <p className="text-xs text-slate-500 mt-1">Configure trigger-based rules to auto-optimize budgets, pause campaigns, or dispatch leads.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Active Automation Rules', value: activeRulesCount, icon: Play, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Triggers Executed Today', value: 12, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Trigger: <span className="font-mono text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold">{rule.trigger}</span> • Action: <span className="font-semibold text-slate-700">{rule.action}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${rule.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                {rule.active ? 'Active' : 'Paused'}
              </span>
              <input
                type="checkbox"
                checked={rule.active}
                onChange={() => toggleRule(rule.id)}
                className="w-9 h-5 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Create Automation Rule</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pause Ad Set 1"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trigger Condition</label>
                <select
                  value={triggerVal}
                  onChange={(e) => setTriggerVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                >
                  <option value="CPL > ₹200">Cost per Lead &gt; ₹200</option>
                  <option value="ROI < 100%">ROI &lt; 100%</option>
                  <option value="Lead Quality Score < 30">Quality Score &lt; 30</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Action to Take</label>
                <select
                  value={actionVal}
                  onChange={(e) => setActionVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                >
                  <option value="Pause Campaign">Pause Campaign</option>
                  <option value="Email Alert to Admin">Email Alert to Admin</option>
                  <option value="Reduce Budget by 10%">Reduce Budget by 10%</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm mt-2">
                Save Automation Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
