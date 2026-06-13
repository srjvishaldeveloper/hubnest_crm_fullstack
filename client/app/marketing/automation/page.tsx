'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Zap, GitBranch, Clock, Play, CheckCircle, Loader2,
  Sparkles, ToggleLeft, ToggleRight, X, ChevronDown, Workflow,
} from 'lucide-react';
import api from '../../../services/api';
import { ReactFlow, Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position, NodeChange, EdgeChange, Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeCategories } from '../../../components/automation/nodeCategories';

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
  active_runs?: number | string;
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

function StatCard({ label, value, sub, onClick, active }: { label: string; value: string | number; sub?: string; onClick?: () => void; active?: boolean }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component 
      onClick={onClick} 
      className={`text-left bg-white dark:bg-[#161616] rounded-2xl border shadow-sm p-4 transition-all duration-200
        ${onClick ? 'hover:shadow-md cursor-pointer hover:border-indigo-500/50 dark:hover:border-indigo-500/50' : ''}
        ${active ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200/60 dark:border-[#1f1f1f]'}`}
    >
      <p className="text-xl font-extrabold text-slate-900 dark:text-[#ededed]">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-[#a3a3a3] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-[#555] mt-0.5">{sub}</p>}
    </Component>
  );
}

// ─── Visual Node (Simple View) ───────────────────────────────────────────────

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

// ─── Visual Node (ReactFlow Custom Flow) ──────────────────────────────────────────

function CustomFlowCard({ data, isConnectable }: { data: any, isConnectable: boolean }) {
  const meta = NODE_META[data.type as NodeType] || NODE_META['action'];
  const Icon = meta.icon;
  return (
    <div className="w-36 rounded-xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2a2a2a] shadow-sm p-4 flex flex-col items-center justify-center relative group hover:shadow-md transition">
      {data.type !== 'trigger' && (
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2.5 h-2.5 !bg-slate-400 border-2 border-white dark:border-[#161616] -ml-1" />
      )}
      
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border mb-2`}>
        <Icon className={`w-6 h-6 ${meta.color}`} />
      </div>
      
      <div className="text-center w-full">
        <p className="text-[10px] font-semibold text-slate-700 dark:text-[#ededed] leading-tight truncate px-1">
          {data.detail || meta.label}
        </p>
      </div>

      {data.type !== 'trigger' && data.onRemove && (
        <button
          onClick={data.onRemove}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-slate-200 dark:bg-[#2a2a2a] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition absolute -top-2 -right-2 shadow-sm"
        >
          <X className="w-3 h-3 text-slate-500 dark:text-[#a3a3a3]" />
        </button>
      )}

      {/* Quick Add Button simulation */}
      <div className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
        <div className="w-4 h-4 bg-white border border-slate-300 rounded flex items-center justify-center shadow-sm">
          <Plus className="w-2.5 h-2.5 text-slate-500" />
        </div>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2.5 h-2.5 !bg-slate-400 border-2 border-white dark:border-[#161616] -mr-1" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomFlowCard,
};

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
      const wf = res.data?.data?.workflow || res.data?.workflow || res.data?.data || { id: Date.now(), name, trigger_type: triggerType, is_active: false, nodes };
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
  const [search, setSearch] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-md p-5 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#ededed]">Add Node</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0">
          <input 
            autoFocus
            placeholder="Search predefined nodes and templates..." 
            className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs mb-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#333]">
          {nodeCategories.map(cat => {
            const filtered = cat.nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.description?.toLowerCase().includes(search.toLowerCase()));
            if (filtered.length === 0) return null;
            return (
              <div key={cat.category}>
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: cat.color }}>{cat.category}</h4>
                <div className="space-y-1">
                  {filtered.map(n => (
                    <button 
                      key={n.label}
                      onClick={() => {
                        const typeMap: Record<string, NodeType> = { trigger: 'trigger', action: 'action', condition: 'condition', integration: 'action', ai: 'action' };
                        const t = typeMap[n.type] || 'action';
                        onAdd({ id: `node-${Date.now()}`, type: t, label: NODE_META[t]?.label || 'Action', detail: n.label });
                        onClose();
                      }}
                      className="w-full flex flex-col items-start p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition text-left"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-[#ededed]">{n.label}</span>
                      {n.description && <span className="text-[10px] text-slate-500 mt-0.5 leading-tight text-slate-400">{n.description}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'running'>('all');
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    const newNodes = nodes.map((n, i) => ({
      id: n.id,
      type: 'custom',
      position: { x: i * 220 + 50, y: 150 }, // Horizontal Custom Flow
      data: {
        ...n,
        onRemove: () => removeNode(n.id)
      }
    }));
    
    const newEdges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      newEdges.push({
        id: `e-${nodes[i].id}-${nodes[i+1].id}`,
        source: nodes[i].id,
        target: nodes[i+1].id,
        type: 'smoothstep', // n8n uses bezier/smoothstep
        animated: true,
        style: { stroke: '#a3a3a3', strokeWidth: 2 }
      });
    }
    setRfNodes(newNodes);
    setRfEdges(newEdges);
  }, [nodes]);

  const onNodesChange = (changes: NodeChange[]) => setRfNodes(c => applyNodeChanges(changes, c));
  const onEdgesChange = (changes: EdgeChange[]) => setRfEdges(c => applyEdgeChanges(changes, c));
  const onConnect = (params: Connection) => setRfEdges(eds => addEdge({...params, animated: true, style: { stroke: '#4f46e5', strokeWidth: 2 }}, eds));

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/workflows');
      const raw = res.data?.data?.workflows || res.data?.workflows || res.data?.data || [];
      const data: Workflow[] = Array.isArray(raw) ? raw : [];
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
  const totalExecutions = workflows.reduce((acc, wf) => acc + Number(wf.active_runs || 0), 0);
  
  const filteredWorkflows = workflows.filter(wf => {
    if (filterMode === 'active') return wf.is_active;
    if (filterMode === 'running') return Number(wf.active_runs || 0) > 0;
    return true;
  });

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
        <div className="flex items-start justify-between gap-4">
          <div className="flex bg-slate-100 dark:bg-[#1a1a1a] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'simple' ? 'bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-[#ededed] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Simple View
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === 'advanced' ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Workflow className="w-3.5 h-3.5" /> Custom Flow
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total Workflows" value={workflows.length} onClick={() => setFilterMode('all')} active={filterMode === 'all'} />
          <StatCard label="Active Workflows" value={activeCount} sub={`${workflows.length - activeCount} paused`} onClick={() => setFilterMode('active')} active={filterMode === 'active'} />
          <StatCard label="Active Runs" value={totalExecutions} sub="across workflows right now" onClick={() => setFilterMode('running')} active={filterMode === 'running'} />
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
                {filteredWorkflows.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No workflows found for this filter.</p>
                ) : (
                  filteredWorkflows.map(wf => (
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/marketing/automation/builder?id=${wf.id}`); }}
                          className="text-[9px] font-bold text-orange-500 hover:text-orange-700 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md transition"
                        >
                          Builder
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleActive(wf); }}
                          className="shrink-0"
                          title={wf.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {wf.is_active
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft className="w-5 h-5 text-slate-300 dark:text-[#555]" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )))}
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
                {viewMode === 'advanced' ? (
                  <div className="flex-1 relative w-full h-full bg-slate-50/50 dark:bg-[#0d0d0d]">
                    <ReactFlow
                      nodes={rfNodes}
                      edges={rfEdges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      className="w-full h-full"
                    >
                      <Background color="#ccc" gap={16} size={1} variant="dots" />
                      <Controls className="!bg-white dark:!bg-[#161616] !border-slate-200 dark:!border-[#2a2a2a] shadow-sm rounded-lg overflow-hidden" />
                      <MiniMap 
                        nodeColor={(n: any) => n.type === 'custom' ? '#4f46e5' : '#eee'}
                        className="!bg-white dark:!bg-[#161616] !border-slate-200 dark:!border-[#2a2a2a] shadow-sm rounded-xl overflow-hidden hidden sm:block" 
                      />
                    </ReactFlow>

                    {/* Add Node Overlay */}
                    <div className="absolute bottom-6 right-6 z-10">
                      <button
                        onClick={() => setShowAddNode(true)}
                        className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-[#1a1a1a] shadow-lg border border-slate-200 dark:border-[#2a2a2a] text-slate-800 dark:text-[#ededed] text-xs font-bold rounded-full hover:bg-slate-50 dark:hover:bg-[#222] transition"
                      >
                        <Plus className="w-4 h-4 text-indigo-600" /> Add Node
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center bg-white dark:bg-[#161616]">
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

                    <button
                      onClick={() => setShowAddNode(true)}
                      className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#222] border border-slate-200 dark:border-[#2a2a2a] text-slate-600 dark:text-[#a3a3a3] text-xs font-semibold rounded-xl transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Node
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
