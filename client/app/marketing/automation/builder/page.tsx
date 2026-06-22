'use client';

import React, { Suspense, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  ArrowLeft, Save, Play, Pause, Loader2, CheckCircle2,
  MoreHorizontal, Trash2, Copy, Zap,
} from 'lucide-react';
import { useAutomationStore } from '../../../../store/automationStore';
import NodeSidebar from '../../../../components/automation/NodeSidebar';
import AutomationCanvas from '../../../../components/automation/AutomationCanvas';
import NodeSettingsPanel from '../../../../components/automation/NodeSettingsPanel';
import { NodeDef, CATEGORY_COLORS } from '../../../../components/automation/nodeCategories';
import api from '../../../../services/api';

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({
  onSave,
  onExecute,
  workflowId,
}: {
  onSave: () => void;
  onExecute: () => void;
  workflowId: string | null;
}) {
  const router = useRouter();
  const { workflowName, workflowStatus, isSaving, setWorkflowName, setWorkflowStatus } =
    useAutomationStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(workflowName);
  const [executing, setExecuting] = React.useState(false);
  const [execDone, setExecDone] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(workflowName);
  }, [workflowName]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitName = () => {
    setWorkflowName(draft.trim() || 'Untitled Workflow');
    setEditing(false);
  };

  const handleExecute = async () => {
    if (!workflowId) return;
    setExecuting(true);
    try {
      await onExecute();
      setExecDone(true);
      setTimeout(() => setExecDone(false), 3000);
    } finally {
      setExecuting(false);
    }
  };

  const isActive = workflowStatus === 'Active';

  return (
    <div
      className="flex items-center gap-3 px-4 border-b border-slate-800 flex-shrink-0"
      style={{ background: '#0F172A', height: 56 }}
    >
      {/* Back */}
      <button
        onClick={() => router.push('/marketing/automation')}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-white/10 flex-shrink-0" />

      {/* Workflow name (inline edit) */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditing(false); }}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm font-semibold text-white focus:outline-none focus:border-orange-500/70 min-w-[200px]"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-bold text-white hover:text-orange-400 transition-colors truncate max-w-[200px]"
          title="Click to rename"
        >
          {workflowName}
        </button>
      )}

      {/* Status badge */}
      <span
        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
        style={{
          background: isActive ? '#10B98120' : '#F5930820',
          color: isActive ? '#10B981' : '#F97316',
          border: `1px solid ${isActive ? '#10B98140' : '#F9731640'}`,
        }}
      >
        {workflowStatus}
      </span>

      <div className="flex-1" />

      {/* Execute button */}
      {workflowId && (
        <button
          onClick={handleExecute}
          disabled={executing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: execDone ? '#10B981' : '#1E293B',
            color: execDone ? 'white' : '#94A3B8',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {executing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : execDone ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {execDone ? 'Triggered!' : 'Test Run'}
        </button>
      )}

      {/* Activate toggle */}
      <button
        onClick={() => setWorkflowStatus(isActive ? 'Paused' : 'Active')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        style={{
          background: isActive ? '#10B98115' : 'transparent',
          borderColor: isActive ? '#10B98140' : 'rgba(255,255,255,0.08)',
          color: isActive ? '#10B981' : '#94A3B8',
        }}
      >
        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        {isActive ? 'Pause' : 'Activate'}
      </button>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        style={{
          background: '#F97316',
          color: 'white',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function AutomationBuilderInner() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  const {
    nodes, edges, addNode,
    setNodes, setEdges,
    workflowName, workflowStatus,
    setSaving,
  } = useAutomationStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load workflow on mount
  useEffect(() => {
    if (!workflowId) return;
    api.get(`/marketing/workflows/${workflowId}`)
      .then((r) => {
        const wf = r.data?.data?.workflow || r.data?.workflow;
        if (!wf) return;
        useAutomationStore.getState().setWorkflowName(wf.name || 'Untitled Workflow');
        useAutomationStore.getState().setWorkflowStatus(wf.status || 'Draft');
        const loadedNodes = Array.isArray(wf.nodes) ? wf.nodes : [];
        const loadedEdges = Array.isArray(wf.edges) ? wf.edges : [];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
      })
      .catch(() => null);
  }, [workflowId, setNodes, setEdges]);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = { name: workflowName, nodes, edges, status: workflowStatus };
      if (workflowId) {
        await api.patch(`/marketing/workflows/${workflowId}`, payload);
      } else {
        const r = await api.post('/marketing/workflows', payload);
        const newId = r.data?.data?.workflow?.id || r.data?.workflow?.id;
        if (newId) {
          window.history.replaceState(null, '', `/marketing/automation/builder?id=${newId}`);
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, workflowStatus, setSaving]);

  // Execute handler
  const handleExecute = useCallback(async () => {
    if (!workflowId) return;
    await api.post(`/marketing/workflows/${workflowId}/execute`).catch(() => null);
  }, [workflowId]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Drop handler: node dropped from sidebar to canvas
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.id !== 'canvas-drop') return;

    const nodeDef = active.data.current?.nodeDef as NodeDef | undefined;
    const color = active.data.current?.color as string | undefined;
    if (!nodeDef) return;

    // Get canvas bounds for position calculation
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();

    // Place node near the center of the canvas by default; dnd-kit doesn't give pixel coords directly
    const x = Math.max(50, (rect.width / 2) - 100 + (Math.random() * 60 - 30));
    const y = Math.max(50, (rect.height / 2) - 50 + (Math.random() * 60 - 30));

    const newNode = {
      id: `${nodeDef.type}-${Date.now()}`,
      type: nodeDef.type,
      position: { x, y },
      data: {
        label: nodeDef.label,
        icon: nodeDef.icon,
        brand: nodeDef.brand || false,
        category: (() => {
          const catMap: Record<string, string> = {
            trigger: 'Triggers',
            action: 'CRM',
            condition: 'Conditions',
            ai: 'AI',
            integration: 'Integrations',
          };
          return catMap[nodeDef.type] || 'CRM';
        })(),
        config: {},
      },
    };

    addNode(newNode);
  }, [addNode]);

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0F172A' }}>
        {/* Top bar */}
        <TopBar
          onSave={handleSave}
          onExecute={handleExecute}
          workflowId={workflowId}
        />

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          <NodeSidebar />

          <div ref={canvasRef} className="flex-1 overflow-hidden">
            <AutomationCanvas />
          </div>

          <NodeSettingsPanel />
        </div>
      </div>
    </DndContext>
  );
}

export default function AutomationBuilderPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    }>
      <AutomationBuilderInner />
    </Suspense>
  );
}
