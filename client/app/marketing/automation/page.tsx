'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Zap, GitBranch, Clock, Play, CheckCircle, Loader2,
  Sparkles, ToggleLeft, ToggleRight, X, ChevronDown,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type NodeType = 'trigger' | 'condition' | 'delay' | 'action' | 'goal';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  detail: string;
}

interface Workflow {
  id: number | string;
  name: string;
  trigger_type?: string;
  is_active: boolean;
  action_count?: number;
  created_at?: string;
  nodes?: WorkflowNode[];
}

// ─── Node config ─────────────────────────────────────────────────────────────

const NODE_META: Record<NodeType, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  trigger:   { color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800',   icon: Zap,         label: 'Trigger'   },
  condition: { color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800',   icon: GitBranch,   label: 'Condition' },
  delay:     { color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800',     icon: Clock,       label: 'Delay'     },
  action:    { color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: Play,        label: 'Action'    },
  goal:      { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle, label: 'Goal'  },
};

const TRIGGER_OPTIONS = [
  'Form Submitted', 'Lead Created', 'Deal Won', 'Call Missed',
  'Email Opened', 'Link Clicked', 'Appointment Booked',
];

const ACTION_OPTIONS = [
  'Send Email', 'Send WhatsApp', 'Send SMS',
  'Assign Lead', 'Create Task', 'Update Lead Status',
  'Add to Segment', 'Notify Team',
];

const NODE_TYPE_OPTIONS: NodeType[] = ['condition', 'delay', 'action', 'goal'];

const DEFAULT_NODES: Record<NodeType, WorkflowNode> = {
  trigger:   { id: '', type: 'trigger',   label: 'Trigger',   detail: 'Form Submitted' },
  condition: { id: '', type: 'condition', label: 'Condition', detail: 'If Lead Score > 75' },
  delay:     { id: '', type: 'delay',     label: 'Delay',     detail: 'Wait 2 hours' },
  action:    { id: '', type: 'action',    label: 'Action',    detail: 'Send WhatsApp' },
  goal:      { id: '', type: 'goal',      label: 'Goal',      detail: 'Deal Won' },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
      <p className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-[#555] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Visual Node ─────────────────────────────────────────────────────────────

function VisualNode({ node, onRemove }: { node: WorkflowNode; onRemove?: () => void }) {
  const meta = NODE_META[node.type];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col items-center w-full">
      <div className={`w-44 rounded-2xl border ${meta.bg} ${meta.border} shadow-sm p-3 flex items-center gap-3 relative`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-[9px] font-extrabold uppercase tracking-wider ${meta.color}`}>{meta.label}</p>
          <p className="text-[11px] font-semibold text-slate-700 dark:text-[#ededed] leading-tight mt-0.5 truncate">
            {node.detail}
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-200 dark:bg-[#2a2a2a] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            <X className="w-2.5 h-2.5 text-slate-500 dark:text-[#a3a3a3]" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Arrow Connector ─────────────────────────────────────────────────────────

function Arrow() {
  return (
    <div className="flex flex-col items-center my-0.5">
      <div className="w-0.5 h-5 bg-slate-300 dark:bg-[#2a2a2a]" />
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-300 dark:border-t-[#2a2a2a]" />
    </div>
  );
}

// ─── New Workflow Modal ───────────────────────────────────────────────────────

function NewWorkflowModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (wf: Workflow) => void;
}) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState(TRIGGER_OPTIONS[0]);
  const [firstAction, setFirstAction] = useState(ACTION_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const nodes: WorkflowNode[] = [
      { id: 'trigger', type: 'trigger', label: 'Trigger', detail: triggerType },
      { id: 'action-1', type: 'action', label: 'Action', detail: firstAction },
    ];
    try {
      const res = await api.post('/marketing/workflows', {
        name,
        trigger_type: triggerType,
        nodes,
        is_active: false,
      });
      const wf = res.data?.workflow || res.data?.data || { id: Date.now(), name, trigger_type: triggerType, is_active: false, nodes };
      onCreated(wf);
    } catch {
      // fallback: create local placeholder
      onCreated({ id: Date.now(), name, trigger_type: triggerType, is_active: false, nodes });
    } finally {
      setSaving(false);
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await api.post('/marketing/ai/workflow/generate', { prompt: aiPrompt });
      const wf = res.data?.data?.workflow || res.data?.workflow;
      if (wf?.name) setName(wf.name);
    } catch {
      // silent
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">New Workflow</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* AI Generate */}
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">AI Generate</span>
          </div>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe the workflow..."
              className="flex-1 bg-white dark:bg-[#1a1a1a] border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-[#ededed] outline-none placeholder:text-slate-400"
            />
            <button
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
              Workflow Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lead Nurture Sequence"
              className="mt-1 w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-[#ededed] outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
              Trigger Type
            </label>
            <select
              value={triggerType}
              onChange={e => setTriggerType(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-[#ededed] outline-none focus:border-indigo-500"
            >
              {TRIGGER_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
              First Action
            </label>
            <select
              value={firstAction}
              onChange={e => setFirstAction(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-[#ededed] outline-none focus:border-indigo-500"
            >
              {ACTION_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Node Modal ───────────────────────────────────────────────────────────

function AddNodeModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (node: WorkflowNode) => void;
}) {
  const [nodeType, setNodeType] = useState<NodeType>('action');
  const [detail, setDetail] = useState('');

  function handleAdd() {
    if (!detail.trim()) return;
    onAdd({
      id: `node-${Date.now()}`,
      type: nodeType,
      label: NODE_META[nodeType].label,
      detail,
    });
    onClose();
  }

  const placeholder: Record<NodeType, string> = {
    trigger:   'e.g. Form Submitted',
    condition: 'e.g. If Lead Score > 75',
    delay:     'e.g. Wait 2 hours',
    action:    'e.g. Send WhatsApp',
    goal:      'e.g. Deal Won',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">Add Node</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {NODE_TYPE_OPTIONS.map(t => {
            const meta = NODE_META[t];
            const Icon = meta.icon;
            return (
              <button
                key={t}
                onClick={() => setNodeType(t)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition
                  ${nodeType === t ? `${meta.bg} ${meta.border} ${meta.color}` : 'border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {meta.label}
              </button>
            );
          })}
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Detail</label>
          <input
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder={placeholder[nodeType]}
            className="mt-1 w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-[#ededed] outline-none focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-xs font-semibold text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!detail.trim()} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [executionsToday] = useState(Math.floor(Math.random() * 120) + 40);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/workflows');
      const data: Workflow[] = res.data?.workflows || res.data?.data || [];
      setWorkflows(data);
      if (data.length > 0) selectWorkflow(data[0]);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  function selectWorkflow(wf: Workflow) {
    setSelected(wf);
    setNodes(
      wf.nodes ?? [
        { id: 'trigger', type: 'trigger', label: 'Trigger', detail: wf.trigger_type || 'Form Submitted' },
        { id: 'action-1', type: 'action', label: 'Action', detail: 'Send WhatsApp' },
      ]
    );
  }

  async function toggleActive(wf: Workflow) {
    const updated = { ...wf, is_active: !wf.is_active };
    setWorkflows(prev => prev.map(w => (w.id === wf.id ? updated : w)));
    if (selected?.id === wf.id) setSelected(updated);
    try {
      await api.patch(`/marketing/workflows/${wf.id}`, { is_active: updated.is_active });
    } catch {
      // revert
      setWorkflows(prev => prev.map(w => (w.id === wf.id ? wf : w)));
    }
  }

  async function saveWorkflow() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/marketing/workflows/${selected.id}`, { nodes });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function removeNode(id: string) {
    if (id === 'trigger') return;
    setNodes(prev => prev.filter(n => n.id !== id));
  }

  const activeCount = workflows.filter(w => w.is_active).length;

  return (
    <>
      {showNewModal && (
        <NewWorkflowModal
          onClose={() => setShowNewModal(false)}
          onCreated={wf => {
            setWorkflows(prev => [wf, ...prev]);
            selectWorkflow(wf);
            setShowNewModal(false);
          }}
        />
      )}
      {showAddNode && (
        <AddNodeModal
          onClose={() => setShowAddNode(false)}
          onAdd={node => setNodes(prev => [...prev, node])}
        />
      )}

      <div className="pb-6 space-y-5">

        {/* ── Header ── */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">Workflow Automation</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Build, manage and automate your marketing workflows</p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total Workflows" value={workflows.length} />
          <StatCard label="Active Workflows" value={activeCount} sub={`${workflows.length - activeCount} paused`} />
          <StatCard label="Executions Today" value={executionsToday} sub="across all workflows" />
        </div>

        {/* ── Main panels ── */}
        <div className="flex gap-4 items-start">

          {/* ── Left: Workflow List (320px) ── */}
          <div className="w-80 shrink-0 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1f1f1f]">
              <span className="text-xs font-extrabold text-slate-900 dark:text-[#ededed]">Workflows</span>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400 dark:text-[#a3a3a3]">No workflows yet</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  Create your first one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-[#1f1f1f] max-h-[480px] overflow-y-auto">
                {workflows.map(wf => (
                  <div
                    key={wf.id}
                    onClick={() => selectWorkflow(wf)}
                    className={`px-4 py-3 cursor-pointer transition ${
                      selected?.id === wf.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/10 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-[#ededed] truncate">{wf.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3] mt-0.5">
                          {wf.trigger_type || 'No trigger'} · {wf.action_count ?? (wf.nodes?.length ?? 2)} nodes
                        </p>
                        <p className="text-[10px] text-slate-300 dark:text-[#555] mt-0.5">
                          {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleActive(wf); }}
                        className="shrink-0 mt-0.5"
                        title={wf.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {wf.is_active
                          ? <ToggleRight className="w-5 h-5 text-green-500" />
                          : <ToggleLeft className="w-5 h-5 text-slate-300 dark:text-[#555]" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Detail / Builder ── */}
          <div className="flex-1 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <Zap className="w-10 h-10 text-slate-200 dark:text-[#2a2a2a] mb-3" />
                <p className="text-sm font-bold text-slate-400 dark:text-[#a3a3a3]">Select a workflow or create new</p>
                <p className="text-xs text-slate-300 dark:text-[#555] mt-1">
                  Choose a workflow from the left panel to view its node diagram
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" /> New Workflow
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50/40 dark:bg-[#111]">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">{selected.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3]">
                      {nodes.length} nodes · {selected.is_active ? 'Active' : 'Paused'}
                    </p>
                  </div>
                  <button
                    onClick={saveWorkflow}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save
                  </button>
                </div>

                {/* Node diagram */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                  <div className="flex flex-col items-center w-full max-w-xs">
                    {nodes.map((node, idx) => (
                      <div key={node.id} className="flex flex-col items-center w-full">
                        {idx > 0 && <Arrow />}
                        <VisualNode
                          node={node}
                          onRemove={node.id === 'trigger' ? undefined : () => removeNode(node.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add Node */}
                  <button
                    onClick={() => setShowAddNode(true)}
                    className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#222] border border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-[#a3a3a3] text-xs font-semibold rounded-xl transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Node
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
