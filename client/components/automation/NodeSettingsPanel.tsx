'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Save } from 'lucide-react';
import { useAutomationStore } from '../../store/automationStore';
import { AutomationNodeData } from './nodes/BaseNode';
import NodeIcon from './NodeIcon';
import { CATEGORY_COLORS } from './nodeCategories';

// ─── Generic field component ──────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/20 transition-all';

// ─── Config fields by node label ──────────────────────────────────────────────
function ConfigFields({
  label,
  config,
  onChange,
}: {
  label: string;
  config: Record<string, unknown>;
  onChange: (key: string, val: string) => void;
}) {
  const get = (k: string) => (config[k] as string) || '';

  if (label === 'Send Email') {
    return (
      <>
        <Field label="From Name">
          <input className={inputCls} placeholder="HubNest CRM" value={get('fromName')} onChange={(e) => onChange('fromName', e.target.value)} />
        </Field>
        <Field label="Subject Line">
          <input className={inputCls} placeholder="Hello {{first_name}}!" value={get('subject')} onChange={(e) => onChange('subject', e.target.value)} />
        </Field>
        <Field label="Template">
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={get('template')} onChange={(e) => onChange('template', e.target.value)}>
              <option value="">Select a template…</option>
              <option>Welcome Email</option>
              <option>Follow-up</option>
              <option>Re-engagement</option>
              <option>Promotional</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </Field>
      </>
    );
  }

  if (label === 'Send SMS' || label === 'Send WhatsApp') {
    const max = label === 'Send SMS' ? 160 : 1024;
    const msg = get('message');
    return (
      <>
        <Field label="Message">
          <div>
            <textarea
              className={inputCls + ' resize-none'}
              rows={4}
              maxLength={max}
              placeholder="Write your message… Use {{first_name}} for personalization"
              value={msg}
              onChange={(e) => onChange('message', e.target.value)}
            />
            <p className={`text-right text-[10px] mt-0.5 ${msg.length > max * 0.85 ? 'text-amber-400' : 'text-slate-600'}`}>
              {msg.length}/{max}
            </p>
          </div>
        </Field>
      </>
    );
  }

  if (label === 'If / Else' || label === 'Filter') {
    return (
      <>
        <Field label="Field">
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={get('field')} onChange={(e) => onChange('field', e.target.value)}>
              <option value="">Select field…</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="tag">Tag</option>
              <option value="deal_value">Deal Value</option>
              <option value="source">Lead Source</option>
              <option value="status">Status</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </Field>
        <Field label="Operator">
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={get('operator')} onChange={(e) => onChange('operator', e.target.value)}>
              <option value="">Select…</option>
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="gt">Greater Than</option>
              <option value="lt">Less Than</option>
              <option value="exists">Exists</option>
              <option value="not_exists">Does Not Exist</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </Field>
        <Field label="Value">
          <input className={inputCls} placeholder="e.g. premium" value={get('value')} onChange={(e) => onChange('value', e.target.value)} />
        </Field>
      </>
    );
  }

  if (label === 'Delay' || label === 'Wait') {
    return (
      <>
        <Field label="Duration">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className={inputCls}
              placeholder="1"
              value={get('duration')}
              onChange={(e) => onChange('duration', e.target.value)}
            />
            <div className="relative w-32">
              <select className={inputCls + ' appearance-none pr-6'} value={get('unit') || 'hours'} onChange={(e) => onChange('unit', e.target.value)}>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </Field>
      </>
    );
  }

  if (label === 'Webhook') {
    return (
      <>
        <Field label="URL">
          <input className={inputCls} placeholder="https://your-webhook.com/path" value={get('url')} onChange={(e) => onChange('url', e.target.value)} />
        </Field>
        <Field label="Method">
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={get('method') || 'POST'} onChange={(e) => onChange('method', e.target.value)}>
              <option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </Field>
        <Field label="Headers (JSON)">
          <textarea className={inputCls + ' resize-none font-mono text-xs'} rows={3} placeholder={'{"Authorization": "Bearer ..."}'} value={get('headers')} onChange={(e) => onChange('headers', e.target.value)} />
        </Field>
      </>
    );
  }

  if (label === 'AI Agent' || label === 'Claude') {
    return (
      <>
        <Field label="Prompt">
          <textarea className={inputCls + ' resize-none'} rows={5} placeholder="You are a helpful assistant. Analyze the lead {{email}} and summarize their intent." value={get('prompt')} onChange={(e) => onChange('prompt', e.target.value)} />
        </Field>
        <Field label="Output Variable">
          <input className={inputCls} placeholder="ai_response" value={get('outputVar')} onChange={(e) => onChange('outputVar', e.target.value)} />
        </Field>
      </>
    );
  }

  if (label === 'Add Tag' || label === 'Remove Tag' || label === 'Tag Added') {
    return (
      <Field label="Tag Name">
        <input className={inputCls} placeholder="e.g. hot-lead" value={get('tag')} onChange={(e) => onChange('tag', e.target.value)} />
      </Field>
    );
  }

  if (label === 'Create Deal' || label === 'Move Pipeline') {
    return (
      <>
        <Field label="Pipeline Stage">
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={get('stage')} onChange={(e) => onChange('stage', e.target.value)}>
              <option value="">Select stage…</option>
              <option>Lead</option><option>Qualified</option><option>Proposal</option>
              <option>Negotiation</option><option>Won</option><option>Lost</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </Field>
        {label === 'Create Deal' && (
          <Field label="Deal Value (₹)">
            <input type="number" className={inputCls} placeholder="10000" value={get('value')} onChange={(e) => onChange('value', e.target.value)} />
          </Field>
        )}
      </>
    );
  }

  // Generic fallback
  return (
    <Field label="Note">
      <textarea
        className={inputCls + ' resize-none'}
        rows={3}
        placeholder="Add a note or description for this step…"
        value={get('note')}
        onChange={(e) => onChange('note', e.target.value)}
      />
    </Field>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function NodeSettingsPanel() {
  const { selectedNode, updateNode, selectNode } = useAutomationStore();
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  const nodeData = selectedNode?.data as AutomationNodeData | undefined;
  const color = CATEGORY_COLORS[nodeData?.category || ''] || '#6B7280';

  useEffect(() => {
    if (nodeData?.config) {
      setConfig(nodeData.config as Record<string, unknown>);
    } else {
      setConfig({});
    }
    setSaved(false);
  }, [selectedNode?.id]);

  const handleChange = (key: string, val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, { config });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!selectedNode || !nodeData) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center px-6"
        style={{ width: 300, background: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-xs text-slate-500 font-medium">Click a node to configure it</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 300, background: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
          <NodeIcon icon={nodeData.icon} brand={nodeData.brand} size={14} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-100 truncate">{nodeData.label}</h3>
          <p className="text-[10px] text-slate-500 capitalize">{nodeData.category}</p>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <ConfigFields
          label={nodeData.label}
          config={config}
          onChange={handleChange}
        />
      </div>

      {/* Save button */}
      <div className="px-4 py-4 border-t border-white/5">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: saved ? '#10B981' : color,
            color: 'white',
          }}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
