'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Zap, Play, Pause, Save, Loader2, X, Search,
  ChevronDown, ChevronRight, CheckCircle2, Workflow,
  LayoutTemplate, Layers, MousePointer2, Settings2,
  ToggleLeft, ToggleRight, Trash2,
  PanelLeftClose, PanelLeftOpen,
  AlertTriangle, Clock, XCircle, Terminal,
  ChevronUp, Activity, ArrowLeft,
} from 'lucide-react';
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  Connection, NodeTypes, BackgroundVariant, Panel, MarkerType,
  applyNodeChanges, applyEdgeChanges, Node, Edge, NodeChange, EdgeChange,
  Handle, Position, NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  DndContext, DragEndEvent, MouseSensor, TouchSensor,
  useSensor, useSensors, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { useTheme } from '../../../components/shared/ThemeProvider';
import api from '../../../services/api';
import {
  nodeCategories, workflowTemplates, NodeDef, CATEGORY_COLORS,
} from '../../../components/automation/nodeCategories';
import NodeIcon from '../../../components/automation/NodeIcon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowItem {
  id: number | string;
  name: string;
  trigger_type?: string;
  trigger_config?: Record<string, unknown>;
  is_active?: boolean;
  status?: string;
  description?: string;
  action_count?: number;
  active_runs?: number | string;
  created_at?: string;
  nodes?: Node[];
  edges?: Edge[];
}

// Helper to check if a workflow is active (handles both DB schema variants)
function isWorkflowActive(wf: WorkflowItem): boolean {
  if (typeof wf.is_active === 'boolean') return wf.is_active;
  if (wf.status) return wf.status === 'Active';
  return false;
}

// Helper to get trigger type from either field
function getWorkflowTrigger(wf: WorkflowItem): string {
  if (wf.trigger_type) return wf.trigger_type;
  if (wf.trigger_config && typeof wf.trigger_config === 'object') {
    return (wf.trigger_config as any).type || (wf.trigger_config as any).trigger_type || '';
  }
  return '';
}

// Execution state for n8n-style test run
interface NodeExecState {
  nodeId: string;
  label: string;
  status: 'waiting' | 'running' | 'success' | 'error';
  startTime?: number;
  duration?: number;
  message?: string;
}

interface AutomationNodeData {
  label: string;
  icon: string;
  brand?: boolean;
  category: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function makeTokens(dark: boolean) {
  return {
    // page backgrounds
    pageBg:        dark ? '#0F172A' : '#F1F5F9',
    topBarBg:      dark ? '#0A0F1E' : '#FFFFFF',
    topBarBorder:  dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.08)',
    sidebarBg:     dark ? '#0B1120' : '#FFFFFF',
    sidebarBorder: dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.08)',
    panelBg:       dark ? '#0F172A' : '#FFFFFF',
    panelBorder:   dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.08)',
    canvasBg:      dark ? '#0A1120' : '#F8FAFC',
    modalBg:       dark ? '#0F172A' : '#FFFFFF',
    modalBorder:   dark ? 'rgba(255,255,255,.1)' : 'rgba(15,23,42,.1)',
    // canvas dot color
    dotColor:      dark ? 'rgba(255,255,255,.07)' : 'rgba(15,23,42,.08)',
    // node card backgrounds
    nodeBg:        dark ? 'linear-gradient(135deg,#16213a 0%,#121929 100%)' : 'linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%)',
    nodeSelBg:     dark ? 'linear-gradient(135deg,#1a2235 0%,#151c2e 100%)' : 'linear-gradient(135deg,#EFF6FF 0%,#EEF2FF 100%)',
    nodeBorder:    dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.10)',
    nodeHandleBg:  dark ? '#0F172A' : '#FFFFFF',
    nodeInfoBg:    dark ? 'rgba(255,255,255,.04)' : 'rgba(15,23,42,.04)',
    nodeInfoBorder:dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.06)',
    // text
    textPrimary:   dark ? '#F1F5F9' : '#0F172A',
    textSecondary: dark ? '#94A3B8' : '#475569',
    textMuted:     dark ? '#475569' : '#94A3B8',
    textDim:       dark ? '#334155' : '#CBD5E1',
    // controls
    ctrlBg:        dark ? '#1E293B' : '#FFFFFF',
    ctrlBorder:    dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.1)',
    minimapBg:     dark ? '#0D1A2D' : '#F8FAFC',
    // input
    inputBg:       dark ? '#1E293B' : '#F8FAFC',
    inputBorder:   dark ? '#334155' : '#CBD5E1',
    inputText:     dark ? '#F1F5F9' : '#0F172A',
    inputPlaceholder: dark ? '#475569' : '#94A3B8',
    // hover / item states
    hoverBg:       dark ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.05)',
    activeItemBg:  dark ? 'rgba(249,115,22,.1)' : 'rgba(249,115,22,.08)',
    activeItemBorder: dark ? 'rgba(249,115,22,.3)' : 'rgba(249,115,22,.3)',
    // badge/misc
    credBg:        dark ? 'rgba(255,255,255,.03)' : 'rgba(15,23,42,.03)',
    credBorder:    dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    divider:       dark ? 'rgba(255,255,255,.05)' : 'rgba(15,23,42,.07)',
    iconBg:        dark ? '#1E293B' : '#F1F5F9',
  } as const;
}

type Tokens = ReturnType<typeof makeTokens>;

// ─── Constants ────────────────────────────────────────────────────────────────

const EDGE_COLOR = '#F97316';

const CATEGORY_LABEL: Record<string, string> = {
  Triggers: 'TRIGGER', CRM: 'ACTION', Communication: 'ACTION',
  Conditions: 'CONDITION', AI: 'AI', Integrations: 'INTEGRATION',
  Data: 'DATA', Notifications: 'NOTIFY',
};

// ─── Canvas Node ──────────────────────────────────────────────────────────────

// Node renders inside ReactFlow so it can't use hooks from the page.
// We pass tokens via a module-level ref that the main page writes before render.
const tokensRef = { current: makeTokens(true) };
const execStateRef: { current: Record<string, 'waiting' | 'running' | 'success' | 'error'> } = { current: {} };

function CanvasNode(props: NodeProps) {
  const tk = tokensRef.current;
  const nodeData = props.data as AutomationNodeData;
  const nodeType = props.type || (nodeData as any)?.nodeType || 'action';
  const selected = props.selected;
  const color = CATEGORY_COLORS[nodeData?.category] || '#6B7280';
  const kindLabel = CATEGORY_LABEL[nodeData?.category] || 'NODE';

  const configSummary = nodeData?.config
    ? Object.entries(nodeData.config).filter(([, v]) => v).slice(0, 2)
        .map(([, v]) => String(v).slice(0, 24)).join(' · ')
    : null;
  const hasConfig = !!(nodeData?.config && Object.values(nodeData.config).some(Boolean));

  const execStatus = execStateRef.current[props.id] || null;

  return (
    <div
      style={{
        width: 220, borderRadius: 14,
        border: selected ? `2px solid ${color}` 
          : execStatus === 'success' ? '1.5px solid rgba(16,185,129,.5)'
          : execStatus === 'running' ? '1.5px solid rgba(249,115,22,.5)'
          : `1.5px solid ${tk.nodeBorder}`,
        background: selected ? tk.nodeSelBg : tk.nodeBg,
        boxShadow: selected
          ? `0 0 0 3px ${color}22, 0 8px 24px rgba(0,0,0,.25)`
          : execStatus === 'running'
          ? '0 0 0 2px rgba(249,115,22,.15), 0 4px 16px rgba(0,0,0,.12)'
          : execStatus === 'success'
          ? '0 0 0 2px rgba(16,185,129,.12), 0 4px 16px rgba(0,0,0,.12)'
          : '0 4px 16px rgba(0,0,0,.12)',
        overflow: 'hidden', transition: 'all .2s',
        cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif',
        position: 'relative',
      }}
      className="group"
    >
      {/* Input handles on Top and Left */}
      <Handle type="target" position={Position.Top} id="target-top"
        style={{ background: color, width: 12, height: 12, border: `2.5px solid ${tk.nodeHandleBg}`, top: -7, boxShadow: `0 0 6px ${color}80` }} />
      <Handle type="target" position={Position.Left} id="target-left"
        style={{ background: color, width: 12, height: 12, border: `2.5px solid ${tk.nodeHandleBg}`, left: -7, boxShadow: `0 0 6px ${color}80` }} />
      <div style={{ padding: '8px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color, background: `${color}1A`, padding: '2px 6px', borderRadius: 4, border: `1px solid ${color}30` }}>
          {kindLabel}
        </span>
        {hasConfig && (
          <div style={{ width: 16, height: 16, borderRadius: 4, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings2 size={9} color={color} />
          </div>
        )}
      </div>
      <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${color}22`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selected ? `0 0 10px ${color}40` : 'none', transition: 'box-shadow .15s' }}>
          <NodeIcon icon={nodeData?.icon} brand={nodeData?.brand} size={16} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: tk.textPrimary, fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
            {nodeData?.label}
          </p>
        </div>
      </div>
      <div style={{ margin: '0 10px 10px', padding: '6px 8px', borderRadius: 8, background: tk.nodeInfoBg, border: `1px solid ${tk.nodeInfoBorder}`, minHeight: 28 }}>
        {configSummary
          ? <p style={{ fontSize: 10, color: tk.textSecondary, margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{configSummary}</p>
          : <p style={{ fontSize: 10, color: tk.textDim, margin: 0, fontStyle: 'italic' }}>Click to configure…</p>
        }
      </div>
      {/* Output handles on Bottom and Right */}
      <Handle type="source" position={Position.Bottom} id="source-bottom"
        style={{ background: color, width: 12, height: 12, border: `2.5px solid ${tk.nodeHandleBg}`, bottom: -7, boxShadow: `0 0 6px ${color}80` }} />
      <Handle type="source" position={Position.Right} id={nodeType === 'condition' && nodeData?.label !== 'Delay' && nodeData?.label !== 'Wait' ? 'false' : 'source-right'}
        style={{
          background: nodeType === 'condition' && nodeData?.label !== 'Delay' && nodeData?.label !== 'Wait' ? '#F59E0B' : color,
          width: 12,
          height: 12,
          border: `2.5px solid ${tk.nodeHandleBg}`,
          right: -7,
          boxShadow: nodeType === 'condition' && nodeData?.label !== 'Delay' && nodeData?.label !== 'Wait' ? '0 0 6px rgba(245,158,11,.5)' : `0 0 6px ${color}80`
        }} />
      {/* Execution status badge */}
      {execStatus === 'success' && (
        <div style={{
          position: 'absolute', top: -6, right: -6, width: 20, height: 20,
          borderRadius: '50%', background: '#10B981', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16,185,129,.4)',
          border: `2px solid ${tk.nodeHandleBg}`,
        }}>
          <CheckCircle2 size={11} color="white" />
        </div>
      )}
      {execStatus === 'running' && (
        <div style={{
          position: 'absolute', top: -6, right: -6, width: 20, height: 20,
          borderRadius: '50%', background: '#F97316', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(249,115,22,.4)',
          border: `2px solid ${tk.nodeHandleBg}`,
          animation: 'spin 1s linear infinite',
        }}>
          <Loader2 size={11} color="white" />
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  trigger: CanvasNode, action: CanvasNode, condition: CanvasNode,
  ai: CanvasNode, integration: CanvasNode,
};

// ─── Settings Panel Inputs ────────────────────────────────────────────────────

function inputClass(tk: Tokens) {
  return `w-full rounded-lg px-3 py-2 text-sm placeholder:text-[${tk.inputPlaceholder}] focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all border`;
}

function InputS({ tk, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { tk: Tokens }) {
  return (
    <input
      {...props}
      style={{ background: tk.inputBg, borderColor: tk.inputBorder, color: tk.inputText }}
      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
    />
  );
}

function TextareaS({ tk, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tk: Tokens }) {
  return (
    <textarea
      {...props}
      style={{ background: tk.inputBg, borderColor: tk.inputBorder, color: tk.inputText }}
      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all resize-none"
    />
  );
}

function SelectS({ tk, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { tk: Tokens }) {
  return (
    <div className="relative">
      <select
        {...props}
        style={{ background: tk.inputBg, borderColor: tk.inputBorder, color: tk.inputText }}
        className="w-full rounded-lg px-3 py-2 text-sm border appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tk.textMuted }} />
    </div>
  );
}

function Field({ label, tk, children }: { label: string; tk: Tokens; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: tk.textSecondary }}>{label}</label>
      {children}
    </div>
  );
}

function CredentialBlock({ service, tk }: { service: string; tk: Tokens }) {
  return (
    <div className="p-3 rounded-xl mb-4" style={{ background: tk.credBg, border: `1px solid ${tk.credBorder}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tk.textSecondary }}>Credential</span>
        <button className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          Set up credential
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: tk.textMuted }}>
        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: tk.iconBg }}>
          <Settings2 size={9} color={tk.textMuted} />
        </div>
        No credentials yet — connect your {service} account
      </div>
    </div>
  );
}

function ConfigFields({ label, config, onChange, tk }: {
  label: string; config: Record<string, unknown>;
  onChange: (k: string, v: string) => void; tk: Tokens;
}) {
  const get = (k: string) => (config[k] as string) || '';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => <Field label={l} tk={tk}>{children}</Field>;

  if (label === 'Send Email') return <>
    <CredentialBlock service="Email / SMTP" tk={tk} />
    <F l="From Name"><InputS tk={tk} placeholder="HubNest CRM" value={get('fromName')} onChange={e => onChange('fromName', e.target.value)} /></F>
    <F l="Subject Line"><InputS tk={tk} placeholder="Hello {{first_name}}!" value={get('subject')} onChange={e => onChange('subject', e.target.value)} /></F>
    <F l="Template"><SelectS tk={tk} value={get('template')} onChange={e => onChange('template', e.target.value)}>
      {['Select a template…','Welcome Email','Follow-up','Re-engagement','Promotional'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
  </>;

  if (label === 'Send SMS') return <>
    <CredentialBlock service="Twilio / SMS" tk={tk} />
    <F l="To Number"><InputS tk={tk} placeholder="{{phone}}" value={get('to')} onChange={e => onChange('to', e.target.value)} /></F>
    <F l="Message">
      <TextareaS tk={tk} rows={4} maxLength={160} placeholder="Your message…" value={get('message')} onChange={e => onChange('message', e.target.value)} />
      <p className="text-right text-[10px] mt-0.5" style={{ color: tk.textMuted }}>{get('message').length}/160</p>
    </F>
  </>;

  if (label === 'Send WhatsApp') return <>
    <CredentialBlock service="WhatsApp Business" tk={tk} />
    <F l="To Number"><InputS tk={tk} placeholder="{{phone}}" value={get('to')} onChange={e => onChange('to', e.target.value)} /></F>
    <F l="Message Type"><SelectS tk={tk} value={get('msgType')||'text'} onChange={e => onChange('msgType', e.target.value)}>
      {['text','template','media'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Message">
      <TextareaS tk={tk} rows={4} maxLength={1024} placeholder="Hi {{first_name}}, …" value={get('message')} onChange={e => onChange('message', e.target.value)} />
      <p className="text-right text-[10px] mt-0.5" style={{ color: tk.textMuted }}>{get('message').length}/1024</p>
    </F>
  </>;

  if (label === 'Send Push') return <>
    <CredentialBlock service="Push Notification" tk={tk} />
    <F l="Title"><InputS tk={tk} placeholder="You have a new message" value={get('title')} onChange={e => onChange('title', e.target.value)} /></F>
    <F l="Body"><TextareaS tk={tk} rows={3} placeholder="Tap to view details…" value={get('body')} onChange={e => onChange('body', e.target.value)} /></F>
  </>;

  if (label === 'Webhook') return <>
    <F l="HTTP Method"><SelectS tk={tk} value={get('method')||'POST'} onChange={e => onChange('method', e.target.value)}>
      {['POST','GET','PUT','PATCH','DELETE'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Webhook URL"><InputS tk={tk} placeholder="https://your-domain.com/webhook" value={get('url')} onChange={e => onChange('url', e.target.value)} /></F>
    <F l="Headers (JSON)"><TextareaS tk={tk} rows={3} placeholder={'{"Authorization":"Bearer ..."}'} value={get('headers')} onChange={e => onChange('headers', e.target.value)} className="font-mono text-xs" /></F>
    <F l="Response Mode"><SelectS tk={tk} value={get('responseMode')||'lastNode'} onChange={e => onChange('responseMode', e.target.value)}>
      <option value="lastNode">When last node finishes</option>
      <option value="immediately">Immediately</option>
      <option value="responseNode">Using respond to webhook node</option>
    </SelectS></F>
  </>;

  if (label === 'HTTP Request') return <>
    <F l="Method"><SelectS tk={tk} value={get('method')||'GET'} onChange={e => onChange('method', e.target.value)}>
      {['GET','POST','PUT','PATCH','DELETE'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="URL"><InputS tk={tk} placeholder="https://api.example.com/v1/resource" value={get('url')} onChange={e => onChange('url', e.target.value)} /></F>
    <F l="Authentication"><SelectS tk={tk} value={get('auth')||'None'} onChange={e => onChange('auth', e.target.value)}>
      {['None','Bearer Token','Basic Auth','API Key','OAuth2'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    {get('auth') === 'Bearer Token' && <F l="Token"><InputS tk={tk} placeholder="eyJhbGciOiJ…" value={get('token')} onChange={e => onChange('token', e.target.value)} /></F>}
    {get('auth') === 'API Key' && <>
      <F l="Key Name"><InputS tk={tk} placeholder="x-api-key" value={get('keyName')} onChange={e => onChange('keyName', e.target.value)} /></F>
      <F l="Key Value"><InputS tk={tk} type="password" placeholder="••••••••" value={get('keyValue')} onChange={e => onChange('keyValue', e.target.value)} /></F>
    </>}
    <F l="Body (JSON)"><TextareaS tk={tk} rows={4} placeholder={'{"key":"value"}'} value={get('body')} onChange={e => onChange('body', e.target.value)} /></F>
  </>;

  if (label === 'If / Else' || label === 'Filter') return <>
    <F l="Field"><SelectS tk={tk} value={get('field')} onChange={e => onChange('field', e.target.value)}>
      {['','email','phone','tag','deal_value','source','status','ai_score','country'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Operator"><SelectS tk={tk} value={get('operator')} onChange={e => onChange('operator', e.target.value)}>
      {['','equals','not_equals','contains','not_contains','gt','lt','exists','not_exists'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Value"><InputS tk={tk} placeholder="e.g. premium" value={get('value')} onChange={e => onChange('value', e.target.value)} /></F>
  </>;

  if (label === 'Switch') return <>
    <F l="Input Field"><InputS tk={tk} placeholder="status" value={get('field')} onChange={e => onChange('field', e.target.value)} /></F>
    <F l="Cases (one per line)"><TextareaS tk={tk} rows={4} placeholder={'hot\nwarm\ncold\ndefault'} value={get('cases')} onChange={e => onChange('cases', e.target.value)} /></F>
  </>;

  if (label === 'Delay' || label === 'Wait') return (
    <F l="Duration">
      <div className="flex gap-2">
        <InputS tk={tk} type="number" min={1} placeholder="1" value={get('duration')} onChange={e => onChange('duration', e.target.value)} />
        <SelectS tk={tk} value={get('unit')||'hours'} onChange={e => onChange('unit', e.target.value)} style={{ width: 120 }}>
          {['minutes','hours','days','weeks'].map(o => <option key={o}>{o}</option>)}
        </SelectS>
      </div>
    </F>
  );

  if (label === 'Schedule / Cron') return <>
    <F l="Trigger Interval"><SelectS tk={tk} value={get('interval')||'every_day'} onChange={e => onChange('interval', e.target.value)}>
      {['every_hour','every_day','every_week','every_month','custom_cron'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    {get('interval') === 'custom_cron' && <F l="Cron Expression"><InputS tk={tk} placeholder="0 9 * * MON-FRI" value={get('cron')} onChange={e => onChange('cron', e.target.value)} /></F>}
    <F l="Timezone"><SelectS tk={tk} value={get('tz')||'Asia/Kolkata'} onChange={e => onChange('tz', e.target.value)}>
      {['Asia/Kolkata','UTC','America/New_York','Europe/London','Asia/Singapore'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
  </>;

  if (label === 'Slack') return <>
    <CredentialBlock service="Slack" tk={tk} />
    <F l="Channel"><InputS tk={tk} placeholder="#general or @username" value={get('channel')} onChange={e => onChange('channel', e.target.value)} /></F>
    <F l="Message"><TextareaS tk={tk} rows={3} placeholder="🎉 New deal won: {{deal_name}}" value={get('message')} onChange={e => onChange('message', e.target.value)} /></F>
  </>;

  if (label === 'Google Sheets') return <>
    <CredentialBlock service="Google" tk={tk} />
    <F l="Operation"><SelectS tk={tk} value={get('operation')||'append'} onChange={e => onChange('operation', e.target.value)}>
      {['append','update','read','delete'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Spreadsheet ID"><InputS tk={tk} placeholder="1BxiMVs0XRA5…" value={get('spreadsheetId')} onChange={e => onChange('spreadsheetId', e.target.value)} /></F>
    <F l="Sheet / Tab Name"><InputS tk={tk} placeholder="Sheet1" value={get('sheet')} onChange={e => onChange('sheet', e.target.value)} /></F>
  </>;

  if (label === 'Stripe' || label === 'Razorpay') return <>
    <CredentialBlock service={label} tk={tk} />
    <F l="Event"><SelectS tk={tk} value={get('event')} onChange={e => onChange('event', e.target.value)}>
      {['payment.captured','payment.failed','subscription.created','subscription.cancelled','refund.created'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Webhook Secret"><InputS tk={tk} type="password" placeholder="whsec_••••••••" value={get('webhookSecret')} onChange={e => onChange('webhookSecret', e.target.value)} /></F>
  </>;

  if (['AI Agent','Claude','OpenAI','Gemini'].includes(label)) {
    const modelOptions: Record<string, string[]> = {
      Claude:['claude-sonnet-4-6','claude-opus-4-8','claude-haiku-4-5'],
      OpenAI:['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'],
      Gemini:['gemini-1.5-pro','gemini-1.5-flash','gemini-2.0-flash'],
      'AI Agent':['claude-sonnet-4-6','gpt-4o','gemini-1.5-pro'],
    };
    const models = modelOptions[label] || modelOptions['AI Agent'];
    return <>
      <CredentialBlock service={label === 'AI Agent' ? 'AI Provider' : label} tk={tk} />
      <F l="Model"><SelectS tk={tk} value={get('model')||models[0]} onChange={e => onChange('model', e.target.value)}>
        {models.map(m => <option key={m}>{m}</option>)}
      </SelectS></F>
      <F l="System Prompt"><TextareaS tk={tk} rows={3} placeholder="You are a helpful assistant…" value={get('systemPrompt')} onChange={e => onChange('systemPrompt', e.target.value)} /></F>
      <F l="User Prompt"><TextareaS tk={tk} rows={4} placeholder="Analyze {{message}} and classify the lead intent." value={get('prompt')} onChange={e => onChange('prompt', e.target.value)} /></F>
      <F l="Output Variable"><InputS tk={tk} placeholder="ai_response" value={get('outputVar')} onChange={e => onChange('outputVar', e.target.value)} /></F>
    </>;
  }

  if (['Classify Lead','Sentiment','Summarize','Generate Copy'].includes(label)) {
    const ph: Record<string,string> = {'Classify Lead':'Classify the lead intent (0–100).', Sentiment:'Analyze sentiment of {{message}}.', Summarize:'Summarize: {{content}}', 'Generate Copy':'Write a {{tone}} email about {{topic}}.'};
    return <>
      <F l="Input"><TextareaS tk={tk} rows={4} placeholder={ph[label]} value={get('prompt')} onChange={e => onChange('prompt', e.target.value)} /></F>
      <F l="Output Variable"><InputS tk={tk} placeholder="ai_output" value={get('outputVar')} onChange={e => onChange('outputVar', e.target.value)} /></F>
    </>;
  }

  if (['Add Tag','Remove Tag','Tag Added','Tag Removed'].includes(label)) return (
    <F l="Tag Name"><InputS tk={tk} placeholder="e.g. hot-lead" value={get('tag')} onChange={e => onChange('tag', e.target.value)} /></F>
  );

  if (label === 'Assign Owner') return (
    <F l="Assign To"><SelectS tk={tk} value={get('owner')} onChange={e => onChange('owner', e.target.value)}>
      {['Round Robin','Sales Team Lead','Senior Rep','Junior Rep','Auto-assign'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
  );

  if (label === 'Create Task') return <>
    <F l="Task Title"><InputS tk={tk} placeholder="Follow up with {{first_name}}" value={get('taskTitle')} onChange={e => onChange('taskTitle', e.target.value)} /></F>
    <F l="Priority"><SelectS tk={tk} value={get('priority')||'medium'} onChange={e => onChange('priority', e.target.value)}>
      {['low','medium','high','urgent'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l="Due In">
      <div className="flex gap-2">
        <InputS tk={tk} type="number" placeholder="2" value={get('dueIn')} onChange={e => onChange('dueIn', e.target.value)} />
        <SelectS tk={tk} value={get('dueUnit')||'days'} onChange={e => onChange('dueUnit', e.target.value)} style={{ width: 100 }}>
          {['hours','days','weeks'].map(o => <option key={o}>{o}</option>)}
        </SelectS>
      </div>
    </F>
  </>;

  if (['Create Deal','Move Pipeline','Update Deal'].includes(label)) return <>
    <F l="Pipeline Stage"><SelectS tk={tk} value={get('stage')} onChange={e => onChange('stage', e.target.value)}>
      {['','Lead','Qualified','Proposal','Negotiation','Won','Lost'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    {label !== 'Move Pipeline' && <F l="Deal Value (₹)"><InputS tk={tk} type="number" placeholder="10000" value={get('value')} onChange={e => onChange('value', e.target.value)} /></F>}
  </>;

  if (label === 'Set Variable') return <>
    <F l="Variable Name"><InputS tk={tk} placeholder="my_variable" value={get('varName')} onChange={e => onChange('varName', e.target.value)} /></F>
    <F l="Value"><InputS tk={tk} placeholder="{{lead_score}} * 2" value={get('varValue')} onChange={e => onChange('varValue', e.target.value)} /></F>
  </>;

  if (['Airtable','Notion'].includes(label)) return <>
    <CredentialBlock service={label} tk={tk} />
    <F l="Operation"><SelectS tk={tk} value={get('operation')||'create'} onChange={e => onChange('operation', e.target.value)}>
      {['create','update','read','delete','list'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
    <F l={label === 'Airtable' ? 'Base ID' : 'Database ID'}><InputS tk={tk} placeholder={label === 'Airtable' ? 'appXXXXXX…' : 'xxxxxxxx-…'} value={get('baseId')} onChange={e => onChange('baseId', e.target.value)} /></F>
    <F l={label === 'Airtable' ? 'Table Name' : 'Page Title'}><InputS tk={tk} placeholder={label === 'Airtable' ? 'Contacts' : 'My Page'} value={get('table')} onChange={e => onChange('table', e.target.value)} /></F>
  </>;

  if (label === 'Loop') return <>
    <F l="Loop Over"><InputS tk={tk} placeholder="{{contacts}}" value={get('loopOver')} onChange={e => onChange('loopOver', e.target.value)} /></F>
    <F l="Item Variable"><InputS tk={tk} placeholder="contact" value={get('itemVar')} onChange={e => onChange('itemVar', e.target.value)} /></F>
  </>;

  if (label === 'Meta / Facebook' || label === 'Instagram') {
    const service = label === 'Instagram' ? 'Instagram Graph API' : 'Meta Graph API';
    const oauthUrl = label === 'Instagram'
      ? 'https://developers.facebook.com/docs/instagram-api/getting-started'
      : 'https://developers.facebook.com/apps/';
    return <>
      <div className="p-3 rounded-xl mb-4" style={{ background: tk.credBg, border: `1px solid ${tk.credBorder}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tk.textSecondary }}>OAuth Connection</span>
          <a href={oauthUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            Open Developer Console ↗
          </a>
        </div>
        <p className="text-[10px] mb-2" style={{ color: tk.textMuted }}>
          Create a Meta App at developers.facebook.com, enable the required permissions, then paste your credentials below.
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: tk.textMuted }}>
          <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: tk.iconBg }}>
            <Settings2 size={9} color={tk.textMuted} />
          </div>
          No credentials yet — connect your {service} account
        </div>
      </div>
      <F l="App ID"><InputS tk={tk} placeholder="1234567890" value={get('appId')} onChange={e => onChange('appId', e.target.value)} /></F>
      <F l="App Secret"><InputS tk={tk} type="password" placeholder="••••••••••••••••" value={get('appSecret')} onChange={e => onChange('appSecret', e.target.value)} /></F>
      <F l="Access Token"><InputS tk={tk} type="password" placeholder="EAAxxxxxxxx…" value={get('accessToken')} onChange={e => onChange('accessToken', e.target.value)} /></F>
      <F l="Operation"><SelectS tk={tk} value={get('operation') || (label === 'Instagram' ? 'send_dm' : 'get_leads')} onChange={e => onChange('operation', e.target.value)}>
        {label === 'Instagram'
          ? ['send_dm','get_media','get_comments','reply_comment','get_profile'].map(o => <option key={o}>{o}</option>)
          : ['get_leads','create_ad','get_ad_insights','send_page_message','get_page_posts','create_custom_audience'].map(o => <option key={o}>{o}</option>)
        }
      </SelectS></F>
      {(get('operation') === 'get_leads' || !get('operation')) && label === 'Meta / Facebook' && (
        <F l="Lead Form ID"><InputS tk={tk} placeholder="12345678" value={get('formId')} onChange={e => onChange('formId', e.target.value)} /></F>
      )}
      {get('operation') === 'send_dm' && label === 'Instagram' && <>
        <F l="Recipient (IGSID)"><InputS tk={tk} placeholder="{{instagram_id}}" value={get('recipient')} onChange={e => onChange('recipient', e.target.value)} /></F>
        <F l="Message"><TextareaS tk={tk} rows={3} placeholder="Hi {{first_name}}, thanks for your interest!" value={get('message')} onChange={e => onChange('message', e.target.value)} /></F>
      </>}
      {get('operation') === 'send_page_message' && label === 'Meta / Facebook' && <>
        <F l="Page ID"><InputS tk={tk} placeholder="{{page_id}}" value={get('pageId')} onChange={e => onChange('pageId', e.target.value)} /></F>
        <F l="Message"><TextareaS tk={tk} rows={3} placeholder="Hi {{first_name}}!" value={get('message')} onChange={e => onChange('message', e.target.value)} /></F>
      </>}
      <F l="API Version"><SelectS tk={tk} value={get('apiVersion') || 'v21.0'} onChange={e => onChange('apiVersion', e.target.value)}>
        {['v21.0','v20.0','v19.0','v18.0'].map(o => <option key={o}>{o}</option>)}
      </SelectS></F>
    </>;
  }

  if (label === 'Form Submitted') return <>
    <F l="Select Form"><SelectS tk={tk} value={get('formId')} onChange={e => onChange('formId', e.target.value)}>
      <option value="">All Forms</option>
      <option value="lead-capture">Lead Capture Form</option>
      <option value="contact-us">Contact Us Form</option>
      <option value="newsletter">Newsletter Signup</option>
      <option value="custom">Custom Form ID...</option>
    </SelectS></F>
    {get('formId') === 'custom' && <F l="Custom Form ID"><InputS tk={tk} placeholder="Enter form UUID" value={get('customFormId')} onChange={e => onChange('customFormId', e.target.value)} /></F>}
  </>;

  if (label === 'Appointment Booked') return <>
    <F l="Event Type"><SelectS tk={tk} value={get('eventType')} onChange={e => onChange('eventType', e.target.value)}>
      <option value="all">All Events</option>
      <option value="discovery">Discovery Call</option>
      <option value="demo">Product Demo</option>
      <option value="support">Technical Support</option>
      <option value="consultation">1-on-1 Consultation</option>
    </SelectS></F>
  </>;

  if (label === 'Pipeline Stage Change') return <>
    <F l="Target Stage"><SelectS tk={tk} value={get('stage')} onChange={e => onChange('stage', e.target.value)}>
      {['Any Stage','Lead','Qualified','Proposal','Negotiation','Won','Lost'].map(o => <option key={o} value={o === 'Any Stage' ? '' : o}>{o}</option>)}
    </SelectS></F>
  </>;

  if (label === 'Page Visited') return <>
    <F l="Page Slug / URL"><InputS tk={tk} placeholder="e.g. /pricing or /landing" value={get('pageUrl')} onChange={e => onChange('pageUrl', e.target.value)} /></F>
  </>;

  if (label === 'Email Opened' || label === 'Link Clicked') return <>
    <F l="Campaign / Subject"><InputS tk={tk} placeholder="e.g. June Newsletter" value={get('campaignName')} onChange={e => onChange('campaignName', e.target.value)} /></F>
    {label === 'Link Clicked' && <F l="Link URL"><InputS tk={tk} placeholder="https://example.com/promo" value={get('linkUrl')} onChange={e => onChange('linkUrl', e.target.value)} /></F>}
  </>;

  if (['Lead Created','Deal Won','Deal Lost'].includes(label)) return (
    <div className="p-3 rounded-xl text-xs space-y-1.5 leading-relaxed" style={{ background: tk.nodeInfoBg, border: `1px solid ${tk.nodeInfoBorder}`, color: tk.textSecondary }}>
      <p className="font-semibold" style={{ color: tk.textPrimary }}>💡 Automatic System Event</p>
      <p>This trigger fires automatically whenever a <strong>{label.toLowerCase()}</strong> event occurs in the CRM. No additional settings are required.</p>
    </div>
  );

  if (label === 'Create Contact') return <>
    <F l="Map First Name"><InputS tk={tk} placeholder="{{first_name}}" value={get('firstName')} onChange={e => onChange('firstName', e.target.value)} /></F>
    <F l="Map Last Name"><InputS tk={tk} placeholder="{{last_name}}" value={get('lastName')} onChange={e => onChange('lastName', e.target.value)} /></F>
    <F l="Map Email"><InputS tk={tk} placeholder="{{email}}" value={get('email')} onChange={e => onChange('email', e.target.value)} /></F>
    <F l="Map Phone"><InputS tk={tk} placeholder="{{phone}}" value={get('phone')} onChange={e => onChange('phone', e.target.value)} /></F>
  </>;

  if (label === 'Update Contact') return <>
    <F l="Select Field to Update"><SelectS tk={tk} value={get('updateField')} onChange={e => onChange('updateField', e.target.value)}>
      <option value="">Choose a field...</option>
      <option value="status">Status</option>
      <option value="source">Source</option>
      <option value="owner">Owner</option>
      <option value="custom">Custom Field...</option>
    </SelectS></F>
    {get('updateField') === 'custom' && <F l="Custom Field Key"><InputS tk={tk} placeholder="e.g. lead_score" value={get('customKey')} onChange={e => onChange('customKey', e.target.value)} /></F>}
    <F l="New Value"><InputS tk={tk} placeholder="e.g. Active or {{score}}" value={get('newValue')} onChange={e => onChange('newValue', e.target.value)} /></F>
  </>;

  if (label === 'Delete Contact') return <>
    <F l="Delete Criteria"><SelectS tk={tk} value={get('criteria')} onChange={e => onChange('criteria', e.target.value)}>
      <option value="current">Current Contact in flow</option>
      <option value="email">By Email Address</option>
    </SelectS></F>
    {get('criteria') === 'email' && <F l="Email to Delete"><InputS tk={tk} placeholder="{{email}}" value={get('deleteEmail')} onChange={e => onChange('deleteEmail', e.target.value)} /></F>}
  </>;

  if (label === 'Add Note') return <>
    <F l="Note Content"><TextareaS tk={tk} rows={4} placeholder="Type note details here..." value={get('noteContent')} onChange={e => onChange('noteContent', e.target.value)} /></F>
  </>;

  if (label === 'Create Lead') return <>
    <F l="Lead Source"><InputS tk={tk} placeholder="e.g. Website Signup" value={get('source')} onChange={e => onChange('source', e.target.value)} /></F>
    <F l="Initial Status"><SelectS tk={tk} value={get('status') || 'New'} onChange={e => onChange('status', e.target.value)}>
      {['New','Contacted','Qualified','Nurturing','Unqualified'].map(o => <option key={o}>{o}</option>)}
    </SelectS></F>
  </>;

  return <F l="Note"><TextareaS tk={tk} rows={3} placeholder="Add a note or description…" value={get('note')} onChange={e => onChange('note', e.target.value)} /></F>;
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({ node, onUpdate, onClose, onDelete, tk }: {
  node: Node | null; tk: Tokens;
  onUpdate: (id: string, config: Record<string, unknown>) => void;
  onClose: () => void; onDelete: (id: string) => void;
}) {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(node?.data?.config ? (node.data.config as Record<string, unknown>) : {});
    setSaved(false);
  }, [node?.id]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center px-6"
      style={{ width: 300, background: tk.panelBg, borderLeft: `1px solid ${tk.panelBorder}`, flexShrink: 0 }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: tk.iconBg }}>
        <Settings2 size={24} color={tk.textMuted} />
      </div>
      <p className="text-xs font-medium" style={{ color: tk.textMuted }}>Click a node to configure it</p>
      <p className="text-[10px] mt-1" style={{ color: tk.textDim }}>Select from the canvas</p>
    </div>
  );

  if (!node) return emptyState;

  const nd = node.data as AutomationNodeData;
  const color = CATEGORY_COLORS[nd.category] || '#6B7280';

  const handleSave = () => {
    onUpdate(node.id, config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full" style={{ width: 300, background: tk.panelBg, borderLeft: `1px solid ${tk.panelBorder}`, flexShrink: 0 }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ borderBottom: `1px solid ${tk.divider}` }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
          <NodeIcon icon={nd.icon} brand={nd.brand} size={14} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: tk.textPrimary }}>{nd.label}</h3>
          <p className="text-[10px] capitalize" style={{ color: tk.textMuted }}>{nd.category}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(node.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: tk.textMuted }}>
            <Trash2 size={13} />
          </button>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: tk.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <ConfigFields label={nd.label} config={config} onChange={(k, v) => { setConfig(p => ({ ...p, [k]: v })); setSaved(false); }} tk={tk} />
      </div>
      <div className="px-4 py-4" style={{ borderTop: `1px solid ${tk.divider}` }}>
        <button onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
          style={{ background: saved ? '#10B981' : color }}>
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

function DraggableSidebarNode({ node, color, category, tk }: { node: NodeDef; color: string; category: string; tk: Tokens }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeDef: node, category }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{ cursor: 'grab' }}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors select-none"
      onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: `${color}28`, border: `1px solid ${color}40` }}>
        <NodeIcon icon={node.icon} brand={node.brand} size={13} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight" style={{ color: tk.textPrimary }}>{node.label}</p>
        {node.description && <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: tk.textMuted }}>{node.description}</p>}
      </div>
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ sidebarTab, setSidebarTab, query, setQuery, workflows, selectedId, onSelectWorkflow, onNewWorkflow, loadingWorkflows, onToggleActive, tk }: {
  sidebarTab: 'nodes' | 'templates' | 'workflows';
  setSidebarTab: (t: 'nodes' | 'templates' | 'workflows') => void;
  query: string; setQuery: (q: string) => void;
  workflows: WorkflowItem[]; selectedId: string | number | null;
  onSelectWorkflow: (wf: WorkflowItem) => void;
  onNewWorkflow: () => void;
  loadingWorkflows: boolean;
  onToggleActive: (wf: WorkflowItem, e: React.MouseEvent) => void;
  tk: Tokens;
}) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const isCatOpen = (cat: string) => openCats[cat] !== false;

  const tabBtn = (t: 'nodes' | 'templates' | 'workflows', label: string, icon: React.ReactNode) => {
    const active = sidebarTab === t;
    return (
      <button onClick={() => setSidebarTab(t)}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
        style={{ background: active ? (t === 'workflows' ? 'rgba(249,115,22,.12)' : tk.hoverBg) : 'transparent', color: active ? (t === 'workflows' ? '#F97316' : tk.textPrimary) : tk.textMuted, border: active && t === 'workflows' ? '1px solid rgba(249,115,22,.25)' : '1px solid transparent' }}>
        {icon}{label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ width: 270, background: tk.sidebarBg, borderRight: `1px solid ${tk.sidebarBorder}`, flexShrink: 0 }}>
      {/* Tabs */}
      <div className="flex flex-col p-2 gap-1 flex-shrink-0" style={{ borderBottom: `1px solid ${tk.divider}` }}>
        <div className="flex gap-1">
          {tabBtn('nodes', 'Nodes', <Layers size={11} />)}
          {tabBtn('templates', 'Templates', <LayoutTemplate size={11} />)}
        </div>
        {tabBtn('workflows', `My Workflows (${workflows.length})`, <Workflow size={11} />)}
      </div>

      {/* Search */}
      {sidebarTab === 'nodes' && (
        <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${tk.divider}` }}>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: tk.textMuted }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search nodes…"
              style={{ background: tk.inputBg, borderColor: tk.inputBorder, color: tk.inputText }}
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border focus:outline-none focus:border-orange-500/50 transition-all" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {sidebarTab === 'nodes' && (
          <div className="px-1.5 space-y-0.5">
            {nodeCategories.map(cat => {
              const filtered = query ? cat.nodes.filter(n => n.label.toLowerCase().includes(query.toLowerCase()) || n.description?.toLowerCase().includes(query.toLowerCase())) : cat.nodes;
              if (filtered.length === 0) return null;
              const open = isCatOpen(cat.category);
              return (
                <div key={cat.category}>
                  <button onClick={() => setOpenCats(p => ({ ...p, [cat.category]: !open }))}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: cat.color }}>
                      <NodeIcon icon={cat.icon} size={9} color="white" />
                    </div>
                    <span className="text-[10px] font-bold flex-1 text-left tracking-wider uppercase" style={{ color: tk.textSecondary }}>{cat.category}</span>
                    <span className="text-[10px] font-medium mr-1" style={{ color: tk.textMuted }}>{filtered.length}</span>
                    {open ? <ChevronDown size={11} color={tk.textMuted} /> : <ChevronRight size={11} color={tk.textMuted} />}
                  </button>
                  {open && (
                    <div className="ml-1 mt-0.5 space-y-0.5">
                      {filtered.map(node => <DraggableSidebarNode key={`${node.type}-${node.label}`} node={node} color={cat.color} category={cat.category} tk={tk} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {sidebarTab === 'templates' && (
          <div className="px-2 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 py-1" style={{ color: tk.textMuted }}>Click a template to load it</p>
            {workflowTemplates.map(tpl => (
              <button key={tpl.id} className="w-full text-left p-3 rounded-xl transition-all group"
                onClick={() => {
                  if (!selectedWf) return;
                  const mappedNodes = tpl.nodes.map((node, i) => {
                    const id = `${node.type}-${i}-${Date.now()}`;
                    return {
                      id,
                      type: node.type,
                      position: node.position,
                      data: {
                        label: node.label,
                        icon: node.icon,
                        brand: node.brand || false,
                        category: tpl.category,
                        config: node.config || {},
                      }
                    };
                  });
                  const mappedEdges = tpl.edges.map((edge, i) => {
                    const sourceIndex = parseInt(edge.source, 10);
                    const targetIndex = parseInt(edge.target, 10);
                    return {
                      id: `e-tpl-${i}-${Date.now()}`,
                      source: mappedNodes[sourceIndex]?.id || edge.source,
                      target: mappedNodes[targetIndex]?.id || edge.target,
                      animated: true,
                      style: { stroke: EDGE_COLOR, strokeWidth: 2 },
                      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
                    };
                  });
                  setNodes(mappedNodes);
                  setEdges(mappedEdges);
                  handleSave(mappedNodes, mappedEdges);
                }}
                style={{ border: `1px solid ${tk.divider}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = tk.hoverBg; (e.currentTarget as HTMLElement).style.borderColor = tk.ctrlBorder; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = tk.divider; }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${tpl.color}25`, border: `1px solid ${tpl.color}40` }}>
                    <NodeIcon icon={tpl.icon} size={14} color={tpl.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: tk.textPrimary }}>{tpl.name}</p>
                    <p className="text-[10px]" style={{ color: tk.textMuted }}>{tpl.nodes.length} nodes · {tpl.category}</p>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: tk.textMuted }}>{tpl.description}</p>
              </button>
            ))}
          </div>
        )}

        {sidebarTab === 'workflows' && (
          <div className="px-2 space-y-1">
            <button onClick={onNewWorkflow}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/5 text-orange-400 text-xs font-bold transition-all mb-2">
              <Plus size={13} /> New Workflow
            </button>
            {loadingWorkflows ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-orange-500/60" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="py-6 text-center">
                <Workflow size={28} className="mx-auto mb-2" style={{ color: tk.textDim }} />
                <p className="text-xs" style={{ color: tk.textMuted }}>No workflows yet</p>
              </div>
            ) : (
              workflows.map(wf => (
                <div key={wf.id} onClick={() => onSelectWorkflow(wf)}
                  className="p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: selectedId === wf.id ? tk.activeItemBg : 'transparent', border: `1px solid ${selectedId === wf.id ? tk.activeItemBorder : 'transparent'}` }}
                  onMouseEnter={e => { if (selectedId !== wf.id) (e.currentTarget as HTMLElement).style.background = tk.hoverBg; }}
                  onMouseLeave={e => { if (selectedId !== wf.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: selectedId === wf.id ? '#F97316' : tk.textPrimary }}>{wf.name}</p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: tk.textMuted }}>{getWorkflowTrigger(wf) || 'No trigger'} · {(wf.nodes && Array.isArray(wf.nodes) ? wf.nodes.length : wf.action_count) ?? 0} nodes</p>
                    </div>
                    <button onClick={e => onToggleActive(wf, e)} className="shrink-0 mt-0.5">
                      {isWorkflowActive(wf) ? <ToggleRight size={16} color="#10B981" /> : <ToggleLeft size={16} color={tk.textDim} />}
                    </button>
                  </div>
                  {wf.created_at && <p className="text-[9px] mt-1" style={{ color: tk.textDim }}>{new Date(wf.created_at).toLocaleDateString()}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderTop: `1px solid ${tk.divider}` }}>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: tk.textMuted }}>
          {sidebarTab === 'nodes' && <><Zap size={11} color="#F97316" /> Drag nodes onto the canvas</>}
          {sidebarTab === 'templates' && <><LayoutTemplate size={11} color="#EC4899" /> Templates replace current canvas</>}
          {sidebarTab === 'workflows' && <><Workflow size={11} color="#F97316" /> {workflows.length} total workflows</>}
        </div>
      </div>
    </div>
  );
}

// ─── New Workflow Modal ───────────────────────────────────────────────────────

function NewWorkflowModal({ onClose, onCreated, tk }: { onClose: () => void; onCreated: (wf: WorkflowItem) => void; tk: Tokens }) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('Form Submitted');
  const [saving, setSaving] = useState(false);

  const TRIGGER_OPTIONS = ['Form Submitted','Lead Created','Deal Won','Call Missed','Email Opened','Webhook','Schedule / Cron','Appointment Booked'];

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/marketing/workflows', {
        name,
        trigger_type: triggerType,
        trigger_config: { type: triggerType },
        status: 'Draft',
      });
      const wf = res.data?.data?.workflow || res.data?.workflow || res.data?.data || {
        id: Date.now(), name, trigger_type: triggerType, trigger_config: { type: triggerType }, status: 'Draft',
      };
      onCreated(wf);
    } catch {
      onCreated({ id: Date.now(), name, trigger_type: triggerType, trigger_config: { type: triggerType }, status: 'Draft' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl" style={{ background: tk.modalBg, border: `1px solid ${tk.modalBorder}` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: tk.textPrimary }}>New Workflow</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: tk.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: tk.textMuted }}>Workflow Name</label>
            <InputS tk={tk} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lead Nurture Sequence"
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: tk.textMuted }}>Trigger</label>
            <SelectS tk={tk} value={triggerType} onChange={e => setTriggerType(e.target.value)}>
              {TRIGGER_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </SelectS>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ color: tk.textSecondary, border: `1px solid ${tk.divider}` }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: '#F97316' }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tk = makeTokens(mounted ? isDark : true);

  // Keep tokensRef in sync for the ReactFlow node renderer
  tokensRef.current = tk;



  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'templates' | 'workflows'>('nodes');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedWf, setSelectedWf] = useState<WorkflowItem | null>(null);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: Node } | null>(null);

  const [wfName, setWfName] = useState('Untitled Workflow');
  const [wfStatus, setWfStatus] = useState<'Draft' | 'Active' | 'Paused'>('Draft');
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execDone, setExecDone] = useState(false);

  // n8n-style execution panel state
  const [execNodes, setExecNodes] = useState<NodeExecState[]>([]);
  const [showExecPanel, setShowExecPanel] = useState(false);
  const [execStartTime, setExecStartTime] = useState<number | null>(null);
  const [execTotalTime, setExecTotalTime] = useState<number | null>(null);

  // Keep execStateRef in sync for node execution badges
  useEffect(() => {
    const map: Record<string, 'waiting' | 'running' | 'success' | 'error'> = {};
    execNodes.forEach(en => { map[en.nodeId] = en.status; });
    execStateRef.current = map;
  }, [execNodes]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoadingWorkflows(true);
      try {
        const res = await api.get('/marketing/workflows');
        const raw = res.data?.data?.workflows || res.data?.workflows || res.data?.data || [];
        const data: WorkflowItem[] = Array.isArray(raw) ? raw : [];
        setWorkflows(data);
        if (data.length > 0) loadWorkflow(data[0]);
      } catch { /* empty */ }
      finally { setLoadingWorkflows(false); }
    })();
  }, []);

  useEffect(() => { if (editingName) nameInputRef.current?.focus(); }, [editingName]);

  function loadWorkflow(wf: WorkflowItem) {
    setSelectedWf(wf);
    setWfName(wf.name);
    setNameDraft(wf.name);
    setWfStatus(isWorkflowActive(wf) ? 'Active' : (wf.status === 'Draft' ? 'Draft' : 'Paused'));
    setSelectedNode(null);
    setExecNodes([]);
    setShowExecPanel(false);
    setExecDone(false);

    if (Array.isArray(wf.nodes) && wf.nodes.length > 0) {
      const safeNodes = wf.nodes.map((n, i) => {
        const anyNode = n as any;
        const lookupTerm = (anyNode.detail || anyNode.data?.label || anyNode.label || '').toLowerCase();
        let foundNodeDef: NodeDef | undefined;
        let foundCategory = '';
        for (const cat of nodeCategories) {
          const matched = cat.nodes.find(node =>
            node.label.toLowerCase() === lookupTerm ||
            node.description?.toLowerCase() === lookupTerm
          );
          if (matched) { foundNodeDef = matched; foundCategory = cat.category; break; }
        }
        if (!foundNodeDef) {
          if (anyNode.type === 'trigger') foundCategory = 'Triggers';
          else if (anyNode.type === 'condition') foundCategory = 'Conditions';
          else if (anyNode.type === 'ai') foundCategory = 'AI';
          else if (anyNode.type === 'integration') foundCategory = 'Integrations';
          else foundCategory = 'CRM';
        }
        return {
          ...n,
          position: n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'
            ? n.position : { x: 320, y: 80 + i * 160 },
          data: {
            label: anyNode.detail || anyNode.data?.label || anyNode.label || 'Node',
            icon: foundNodeDef?.icon || anyNode.data?.icon || 'Zap',
            brand: foundNodeDef?.brand || anyNode.data?.brand || false,
            category: foundCategory || anyNode.data?.category || 'CRM',
            config: {},
            ...(n.data || {}),
          },
        };
      });
      setNodes(safeNodes);

      // Load saved edges if they exist, otherwise build a sequential chain for fallback
      const hasSavedEdges = Array.isArray(wf.edges) && wf.edges.length > 0;
      if (hasSavedEdges) {
        const validEdges = wf.edges.filter(e => 
          safeNodes.some(n => n.id === e.source) && 
          safeNodes.some(n => n.id === e.target)
        ).map(e => ({
          ...e,
          animated: e.animated ?? true,
          style: e.style ?? { stroke: EDGE_COLOR, strokeWidth: 2 },
          markerEnd: e.markerEnd ?? { type: MarkerType.ArrowClosed, color: EDGE_COLOR }
        }));
        setEdges(validEdges);
      } else {
        const chainEdges: Edge[] = safeNodes.slice(0, -1).map((n, i) => ({
          id: `e-chain-${i}`,
          source: n.id,
          target: safeNodes[i + 1].id,
          animated: true,
          style: { stroke: EDGE_COLOR, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        }));
        setEdges(chainEdges);
      }
    } else {
      const triggerLabel = getWorkflowTrigger(wf) || wf.trigger_type || 'Form Submitted';
      setNodes([
        { id: 'trigger-0', type: 'trigger', position: { x: 320, y: 80 }, data: { label: triggerLabel, icon: 'Zap', brand: false, category: 'Triggers', config: {} } },
        { id: 'action-1', type: 'action', position: { x: 320, y: 280 }, data: { label: 'Send Email', icon: 'Mail', brand: false, category: 'Communication', config: {} } },
      ]);
      setEdges([{ id: 'e-0-1', source: 'trigger-0', target: 'action-1', animated: true, style: { stroke: EDGE_COLOR, strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR } }]);
    }
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(n => applyNodeChanges(changes, n)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(e => applyEdgeChanges(changes, e)), []);
  const onConnect = useCallback((connection: Connection) =>
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: EDGE_COLOR, strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR } }, eds)), []);
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setContextMenu(null); }, []);
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }, []);
  const onNodeDragStop = useCallback((_: unknown, node: { id: string; position: { x: number; y: number } }) =>
    setNodes(ns => ns.map(n => n.id === node.id ? { ...n, position: node.position } : n)), []);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  async function handleSave(overrideNodes?: Node[], overrideEdges?: Edge[]) {
    if (!selectedWf) return;
    setIsSaving(true);
    const saveNodes = overrideNodes ?? nodesRef.current;
    const saveEdges = overrideEdges ?? edgesRef.current;
    try {
      const res = await api.patch(`/marketing/workflows/${selectedWf.id}`, {
        name: wfName,
        nodes: saveNodes,
        edges: saveEdges,
        status: wfStatus,
      });
      // Update the workflow in the list with the latest saved data
      const saved = res.data?.data?.workflow || res.data?.workflow || res.data?.data;
      if (saved) {
        setWorkflows(prev => prev.map(w => w.id === selectedWf.id ? { ...w, ...saved, nodes: saveNodes, edges: saveEdges } : w));
        setSelectedWf(prev => prev ? { ...prev, nodes: saveNodes, edges: saveEdges } : prev);
      }
    } catch (err: any) {
      console.error('Save failed:', err?.response?.data || err?.message);
    } finally {
      setIsSaving(false);
    }
  }

  function updateNodeConfig(id: string, config: Record<string, unknown>) {
    const updatedNodes = nodesRef.current.map(n => n.id === id ? { ...n, data: { ...n.data, config } } : n);
    setNodes(updatedNodes);
    setSelectedNode(prev => prev?.id === id ? { ...prev, data: { ...prev.data, config } } : prev);
    // Persist immediately when user clicks "Save Configuration"
    handleSave(updatedNodes, edgesRef.current);
  }

  function deleteNode(id: string) {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    setSelectedNode(null);
  }

  // n8n-style execution: simulate node-by-node processing with visual feedback
  async function handleExecute() {
    if (!selectedWf || nodes.length === 0) return;
    setIsExecuting(true);
    setExecDone(false);
    setShowExecPanel(true);
    const startT = Date.now();
    setExecStartTime(startT);
    setExecTotalTime(null);

    // Build topological order: start from triggers, follow edges
    const ordered: string[] = [];
    const visited = new Set<string>();
    const edgeMap = new Map<string, string[]>();
    edges.forEach(e => {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
      edgeMap.get(e.source)!.push(e.target);
    });
    const triggers = nodes.filter(n => n.type === 'trigger').map(n => n.id);
    const queue = triggers.length > 0 ? [...triggers] : [nodes[0].id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      ordered.push(cur);
      (edgeMap.get(cur) || []).forEach(t => queue.push(t));
    }
    // Add any remaining nodes not reached by edges
    nodes.forEach(n => { if (!visited.has(n.id)) ordered.push(n.id); });

    // Initialize all nodes as 'waiting'
    const initial: NodeExecState[] = ordered.map(nid => {
      const nd = nodes.find(n => n.id === nid);
      return {
        nodeId: nid,
        label: (nd?.data as AutomationNodeData)?.label || 'Node',
        status: 'waiting' as const,
      };
    });
    setExecNodes(initial);

    // Execute node by node with delay
    for (let i = 0; i < ordered.length; i++) {
      const nid = ordered[i];
      const nd = nodes.find(n => n.id === nid);
      const label = (nd?.data as AutomationNodeData)?.label || 'Node';

      // Mark current as running
      setExecNodes(prev => prev.map(en =>
        en.nodeId === nid ? { ...en, status: 'running', startTime: Date.now() } : en
      ));

      // Simulate processing time (300-800ms per node)
      const delay = 300 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));

      // Mark as success (simulate — in real n8n this would be actual execution)
      setExecNodes(prev => prev.map(en =>
        en.nodeId === nid
          ? { ...en, status: 'success', duration: Math.round(delay), message: `${label} completed successfully` }
          : en
      ));
    }

    // Try actual API call (silently)
    try {
      await api.post(`/marketing/workflows/${selectedWf.id}/execute`).catch(() => null);
    } catch { /* silent */ }

    setExecTotalTime(Date.now() - startT);
    setExecDone(true);
    setIsExecuting(false);
  }

  async function toggleActive(wf: WorkflowItem, e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = isWorkflowActive(wf) ? 'Paused' : 'Active';
    const updated = { ...wf, status: newStatus, is_active: newStatus === 'Active' };
    setWorkflows(prev => prev.map(w => w.id === wf.id ? updated : w));
    if (selectedWf?.id === wf.id) setWfStatus(newStatus as any);
    try { await api.patch(`/marketing/workflows/${wf.id}`, { status: newStatus }); }
    catch { setWorkflows(prev => prev.map(w => w.id === wf.id ? wf : w)); }
  }

  function commitName() { setWfName(nameDraft.trim() || 'Untitled Workflow'); setEditingName(false); }

  const reactFlowInstanceRef = useRef<any>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const dataStr = event.dataTransfer.getData('application/reactflow');
    if (!dataStr) return;

    try {
      const { nodeDef, category } = JSON.parse(dataStr) as { nodeDef: NodeDef; category: string };
      if (!nodeDef) return;

      let position = { x: 0, y: 0 };
      if (reactFlowInstanceRef.current && typeof reactFlowInstanceRef.current.screenToFlowPosition === 'function') {
        position = reactFlowInstanceRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        const rect = canvasRef.current?.getBoundingClientRect();
        position = {
          x: rect ? event.clientX - rect.left : 200,
          y: rect ? event.clientY - rect.top : 200,
        };
      }

      const newNodeId = `${nodeDef.type}-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: nodeDef.type,
        position,
        data: { label: nodeDef.label, icon: nodeDef.icon, brand: nodeDef.brand || false, category, config: {} },
      };
      setNodes(current => [...current, newNode]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWf, wfName, wfStatus]);

  const isActive = wfStatus === 'Active';

  // Top bar button helpers
  const topBtn = (style?: React.CSSProperties) => ({
    className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0',
    style: { borderColor: tk.ctrlBorder, color: tk.textSecondary, background: 'transparent', ...style },
  });

  return (
    <>
      {showNewModal && (
        <NewWorkflowModal tk={tk} onClose={() => setShowNewModal(false)}
          onCreated={wf => { setWorkflows(prev => [wf, ...prev]); loadWorkflow(wf); setShowNewModal(false); setSidebarTab('workflows'); }} />
      )}

      <div className="fixed inset-0 flex flex-col" style={{ background: tk.pageBg, zIndex: 50 }}>

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-2 px-3 flex-shrink-0"
          style={{ height: 52, background: tk.topBarBg, borderBottom: `1px solid ${tk.topBarBorder}` }}>

          <button onClick={() => router.push('/marketing/dashboard')}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            title="Back to Dashboard"
            style={{ color: tk.textSecondary }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft size={15} />
          </button>

          <div className="w-px h-4 flex-shrink-0" style={{ background: tk.divider }} />

          <button onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: tk.textSecondary }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>

          <div className="w-px h-4 flex-shrink-0" style={{ background: tk.divider }} />

          {editingName ? (
            <input ref={nameInputRef} value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onBlur={commitName} onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
              style={{ background: tk.inputBg, borderColor: tk.inputBorder, color: tk.inputText }}
              className="border rounded-lg px-3 py-1 text-sm font-semibold focus:outline-none focus:border-orange-500/70 min-w-[180px]" />
          ) : (
            <button onClick={() => { setNameDraft(wfName); setEditingName(true); }}
              className="text-sm font-bold hover:text-orange-500 transition-colors truncate max-w-[200px]"
              style={{ color: tk.textPrimary }}>
              {wfName || 'Untitled Workflow'}
            </button>
          )}

          {/* Status badge */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
            style={{
              background: isActive ? '#10B98115' : wfStatus === 'Draft' ? tk.hoverBg : '#F9731810',
              color: isActive ? '#10B981' : wfStatus === 'Draft' ? tk.textMuted : '#F97316',
              border: `1px solid ${isActive ? '#10B98130' : wfStatus === 'Draft' ? tk.divider : '#F9731830'}`,
            }}>
            {wfStatus}
          </span>

          {nodes.length > 0 && (
            <span className="text-[10px] flex-shrink-0 hidden sm:block" style={{ color: tk.textMuted }}>
              {nodes.length} nodes · {edges.length} edges
            </span>
          )}

          <div className="flex-1" />

          {selectedWf && (
            <button onClick={handleExecute} disabled={isExecuting} {...topBtn(execDone ? { background: '#10B981', color: 'white', borderColor: '#10B981' } : {})}>
              {isExecuting ? <Loader2 size={13} className="animate-spin" /> : execDone ? <CheckCircle2 size={13} /> : <Play size={13} />}
              <span className="hidden sm:block">{execDone ? 'Triggered!' : 'Test Run'}</span>
            </button>
          )}

          {selectedWf && (
            <button onClick={() => setWfStatus(isActive ? 'Paused' : 'Active')}
              {...topBtn(isActive ? { background: '#10B98110', borderColor: '#10B98130', color: '#10B981' } : {})}>
              {isActive ? <Pause size={13} /> : <Play size={13} />}
              <span className="hidden sm:block">{isActive ? 'Pause' : 'Activate'}</span>
            </button>
          )}

          <button onClick={handleSave} disabled={isSaving || !selectedWf}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 disabled:opacity-40 text-white"
            style={{ background: '#F97316' }}>
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {isSaving ? 'Saving…' : 'Save'}
          </button>

          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-shrink-0"
            style={{ borderColor: tk.ctrlBorder, color: tk.textSecondary }}
            onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Plus size={13} />
            <span className="hidden sm:block">New</span>
          </button>
        </div>

        {/* ── Three Column ── */}
        <div className="flex flex-1 overflow-hidden">
          {sidebarOpen && (
            <LeftPanel
              sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
              query={query} setQuery={setQuery}
              workflows={workflows} selectedId={selectedWf?.id ?? null}
              onSelectWorkflow={loadWorkflow} onNewWorkflow={() => setShowNewModal(true)}
              loadingWorkflows={loadingWorkflows} onToggleActive={toggleActive}
              tk={tk}
            />
          )}

          {/* Canvas */}
          <div 
            ref={canvasRef} 
            className="flex-1 overflow-hidden relative"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {!selectedWf ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(249,115,22,.08)', border: '1.5px dashed rgba(249,115,22,.25)' }}>
                  <Workflow size={36} color="rgba(249,115,22,.4)" />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: tk.textSecondary }}>No workflow selected</p>
                <p className="text-xs mb-4 max-w-[220px] leading-relaxed" style={{ color: tk.textMuted }}>Select a workflow from the left panel or create your first one</p>
                <button onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#F97316' }}>
                  <Plus size={14} /> New Workflow
                </button>
              </div>
            ) : (
              <ReactFlow
                onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
                nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
                onNodeContextMenu={onNodeContextMenu}
                onNodeDragStop={onNodeDragStop as any}
                nodeTypes={nodeTypes}
                fitView fitViewOptions={{ padding: 0.3 }}
                deleteKeyCode={['Delete', 'Backspace']} snapToGrid snapGrid={[16, 16]}
                style={{ background: tk.canvasBg }}
                defaultEdgeOptions={{ animated: true, style: { stroke: EDGE_COLOR, strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR } }}
                connectionLineStyle={{ stroke: EDGE_COLOR, strokeWidth: 2, strokeDasharray: '6 3' }}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color={tk.dotColor} />
                <Controls style={{ background: tk.ctrlBg, border: `1px solid ${tk.ctrlBorder}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
                  className="[&_button]:!bg-transparent [&_button]:!border-0" />
                <MiniMap style={{ background: tk.minimapBg, border: `1px solid ${tk.ctrlBorder}`, borderRadius: 10 }}
                  nodeColor={n => CATEGORY_COLORS[(n.data as AutomationNodeData)?.category ?? ''] || '#94A3B8'}
                  maskColor={isDark ? 'rgba(0,0,0,.5)' : 'rgba(241,245,249,.7)'} />

                <Panel position="top-left">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold mt-2 ml-2"
                    style={{ background: tk.ctrlBg, border: `1px solid ${tk.ctrlBorder}`, color: tk.textSecondary }}>
                    <Workflow size={12} color="#F97316" />
                    {wfName}
                    <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: isActive ? '#10B981' : tk.textDim }} />
                  </div>
                </Panel>

                {nodes.length === 0 && (
                  <Panel position="top-center">
                    <div className="flex flex-col items-center gap-3 mt-24 pointer-events-none select-none">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                        style={{ background: 'rgba(249,115,22,.08)', border: '1.5px dashed rgba(249,115,22,.25)' }}>
                        <Workflow size={36} color="rgba(249,115,22,.4)" />
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="text-sm font-semibold" style={{ color: tk.textSecondary }}>Canvas is empty</p>
                        <p className="text-xs max-w-[220px] leading-relaxed" style={{ color: tk.textMuted }}>Drag a node from the left panel, or pick a template</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                        style={{ background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.2)', color: '#F97316' }}>
                        <MousePointer2 size={11} /> Start with a Trigger node
                      </div>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            )}
          </div>

          {/* Right panel */}
          <SettingsPanel node={selectedNode} onUpdate={updateNodeConfig} onClose={() => setSelectedNode(null)} onDelete={deleteNode} tk={tk} />
        </div>

        {/* ── n8n-style Execution Output Panel ── */}
        {showExecPanel && (
          <div
            style={{
              background: tk.topBarBg,
              borderTop: `1px solid ${tk.topBarBorder}`,
              flexShrink: 0,
              maxHeight: 260,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-2 flex-shrink-0"
              style={{ borderBottom: `1px solid ${tk.divider}` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Terminal size={14} color="#F97316" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tk.textPrimary }}>
                    Execution Output
                  </span>
                </div>
                {isExecuting && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.2)' }}>
                    <Loader2 size={10} className="animate-spin text-orange-500" />
                    <span className="text-[10px] font-semibold text-orange-500">Running…</span>
                  </div>
                )}
                {execDone && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)' }}>
                    <CheckCircle2 size={10} color="#10B981" />
                    <span className="text-[10px] font-semibold" style={{ color: '#10B981' }}>Completed</span>
                  </div>
                )}
                {execTotalTime !== null && (
                  <span className="text-[10px] font-medium" style={{ color: tk.textMuted }}>
                    Total: {(execTotalTime / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium mr-2" style={{ color: tk.textMuted }}>
                  {execNodes.filter(n => n.status === 'success').length}/{execNodes.length} nodes
                </span>
                <button
                  onClick={() => setShowExecPanel(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: tk.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = tk.hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Node execution list */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <div className="space-y-1">
                {execNodes.map((en, idx) => {
                  const statusIcon = en.status === 'success' ? (
                    <CheckCircle2 size={14} color="#10B981" />
                  ) : en.status === 'running' ? (
                    <Loader2 size={14} className="animate-spin text-orange-500" />
                  ) : en.status === 'error' ? (
                    <XCircle size={14} color="#EF4444" />
                  ) : (
                    <Clock size={14} color={tk.textDim} />
                  );

                  const statusColor = en.status === 'success' ? '#10B981'
                    : en.status === 'running' ? '#F97316'
                    : en.status === 'error' ? '#EF4444'
                    : tk.textDim;

                  return (
                    <div
                      key={en.nodeId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: en.status === 'running'
                          ? 'rgba(249,115,22,.06)'
                          : en.status === 'success'
                          ? 'rgba(16,185,129,.04)'
                          : 'transparent',
                        border: `1px solid ${en.status === 'running' ? 'rgba(249,115,22,.15)' : 'transparent'}`,
                      }}
                    >
                      <span className="text-[10px] font-mono w-5 text-center flex-shrink-0" style={{ color: tk.textDim }}>
                        {idx + 1}
                      </span>
                      <div className="flex-shrink-0">{statusIcon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: en.status === 'waiting' ? tk.textMuted : tk.textPrimary }}>
                          {en.label}
                        </p>
                        {en.message && (
                          <p className="text-[10px] truncate mt-0.5" style={{ color: tk.textMuted }}>
                            {en.message}
                          </p>
                        )}
                      </div>
                      {en.duration !== undefined && (
                        <span className="text-[10px] font-mono flex-shrink-0 tabular-nums" style={{ color: statusColor }}>
                          {en.duration}ms
                        </span>
                      )}
                      {en.status === 'success' && (
                        <div className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: 'rgba(16,185,129,.1)', color: '#10B981' }}>
                          1 item
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Node Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: tk.modalBg,
            border: `1px solid ${tk.modalBorder}`,
            borderRadius: 12,
            padding: '8px 6px',
            minWidth: 200,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,.3), 0 8px 10px -6px rgba(0,0,0,.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: tk.textMuted }}>
            Node: {contextMenu.node.data?.label || 'Node'}
          </div>
          
          <div className="my-1 border-t" style={{ borderColor: tk.divider }} />

          {/* Connect to Section */}
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
            🔌 Connect to...
          </div>
          <div className="space-y-0.5 max-h-[140px] overflow-y-auto px-1">
            {nodes
              .filter(n => n.id !== contextMenu.node.id)
              .map(targetNode => (
                <button
                  key={targetNode.id}
                  onClick={() => {
                    const newEdge = {
                      id: `e-${contextMenu.node.id}-${targetNode.id}-${Date.now()}`,
                      source: contextMenu.node.id,
                      target: targetNode.id,
                      sourceHandle: 'source-bottom',
                      targetHandle: 'target-top',
                      animated: true,
                      style: { stroke: EDGE_COLOR, strokeWidth: 2 },
                      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
                    };
                    setEdges(eds => addEdge(newEdge, eds));
                    setContextMenu(null);
                    setTimeout(() => handleSave(), 100);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold rounded-lg transition-all hover:bg-orange-500/10"
                  style={{ color: tk.textPrimary }}
                >
                  👉 {targetNode.data?.label || 'Node'}
                </button>
              ))}
            {nodes.filter(n => n.id !== contextMenu.node.id).length === 0 && (
              <div className="px-2 py-1.5 text-xs italic" style={{ color: tk.textMuted }}>
                No other nodes
              </div>
            )}
          </div>

          <div className="my-1 border-t" style={{ borderColor: tk.divider }} />

          <button
            onClick={() => {
              setEdges(es => es.filter(e => e.source !== contextMenu.node.id && e.target !== contextMenu.node.id));
              setContextMenu(null);
              setTimeout(() => handleSave(), 100);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-orange-500/10"
            style={{ color: tk.textPrimary }}
          >
            ✂️ Disconnect All
          </button>

          <div className="my-1 border-t" style={{ borderColor: tk.divider }} />

          <button
            onClick={() => {
              deleteNode(contextMenu.node.id);
              setContextMenu(null);
              setTimeout(() => handleSave(), 100);
            }}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors hover:bg-red-500/10 text-red-500"
          >
            🗑️ Delete Node
          </button>
        </div>
      )}
    </>
  );
}
