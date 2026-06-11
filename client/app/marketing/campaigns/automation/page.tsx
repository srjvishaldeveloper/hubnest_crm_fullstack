'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Play, Check, Loader2, Zap } from 'lucide-react';
import api from '../../../../services/api';

interface Workflow {
  id: string;
  name: string;
  trigger_type?: string;
  trigger_config?: Record<string, unknown>;
  actions?: { type?: string; config?: Record<string, unknown> }[];
  is_active: boolean;
  executions_count?: number;
  created_at?: string;
}

export default function MarketingAutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerVal, setTriggerVal] = useState('lead_created');
  const [actionVal, setActionVal] = useState('assign_to_sales');
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { workflows: Workflow[] } }>('/marketing/workflows');
      setWorkflows(res.data.data.workflows || []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkflows(); }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ data: { workflow: Workflow } }>('/marketing/workflows', {
        name: ruleName,
        trigger_type: triggerVal,
        trigger_config: {},
        actions: [{ type: actionVal, config: {} }],
        is_active: true,
      });
      setWorkflows(prev => [res.data.data.workflow, ...prev]);
      setRuleName('');
      setShowModal(false);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  };

  const toggleWorkflow = async (wf: Workflow) => {
    setToggling(wf.id);
    try {
      const res = await api.patch<{ data: { workflow: Workflow } }>(`/marketing/workflows/${wf.id}`, {
        is_active: !wf.is_active,
      });
      setWorkflows(prev => prev.map(w => w.id === wf.id ? res.data.data.workflow : w));
    } catch { /* silent */ } finally {
      setToggling(null);
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await api.delete(`/marketing/workflows/${id}`);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch { /* silent */ }
  };

  const activeCount = workflows.filter(w => w.is_active).length;

  const TRIGGER_LABELS: Record<string, string> = {
    lead_created: 'New Lead Created',
    campaign_started: 'Campaign Started',
    cpl_threshold: 'CPL Exceeds Threshold',
    roi_high: 'ROI Exceeds Target',
    lead_score_high: 'Lead Score > 75',
    day_of_week: 'Day of Week Condition',
  };

  const ACTION_LABELS: Record<string, string> = {
    assign_to_sales: 'Assign to Sales Team',
    pause_campaign: 'Pause Campaign',
    increase_budget: 'Increase Budget by 20%',
    send_email: 'Send Follow-up Email',
    create_task: 'Create Follow-up Task',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Campaign Automation</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Configure trigger-based rules to auto-optimize budgets, pause campaigns, or dispatch leads.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Active Rules', value: activeCount, icon: Play, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Total Workflows', value: workflows.length, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-[#737373] font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <h3 className="text-xs font-bold text-slate-900 dark:text-[#ededed] uppercase tracking-wider">Automation Rules</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-[#737373]">No automation rules yet. Create your first rule.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
            {workflows.map(wf => (
              <div key={wf.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${wf.is_active ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-slate-100 dark:bg-[#222]'}`}>
                    <Zap className={`w-4 h-4 ${wf.is_active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-[#555]'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-[#ededed]">{wf.name}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 dark:text-[#737373]">
                        Trigger: <span className="font-semibold text-slate-600 dark:text-[#a3a3a3]">{TRIGGER_LABELS[wf.trigger_type || ''] || wf.trigger_type || '—'}</span>
                      </span>
                      {wf.actions?.[0] && (
                        <span className="text-[10px] text-slate-400 dark:text-[#737373]">
                          Action: <span className="font-semibold text-slate-600 dark:text-[#a3a3a3]">{ACTION_LABELS[wf.actions[0].type || ''] || wf.actions[0].type || '—'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWorkflow(wf)}
                    disabled={toggling === wf.id}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${wf.is_active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-[#333]'} disabled:opacity-60`}
                  >
                    <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow transform transition-transform mt-[3px] ${wf.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-[10px] font-bold ${wf.is_active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-[#737373]'}`}>
                    {wf.is_active ? 'On' : 'Off'}
                  </span>
                  <button onClick={() => deleteWorkflow(wf.id)} className="p-1 text-slate-300 dark:text-[#555] hover:text-red-500 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200 dark:border-[#333] shadow-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">New Automation Rule</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider block mb-1">Rule Name *</label>
                <input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Auto-pause on High CPL" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#111] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider block mb-1">Trigger</label>
                <select value={triggerVal} onChange={e => setTriggerVal(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#111] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold">
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider block mb-1">Action</label>
                <select value={actionVal} onChange={e => setActionVal(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#111] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold">
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-[#a3a3a3] border border-slate-200 dark:border-[#333] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">Cancel</button>
                <button type="submit" disabled={creating} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
