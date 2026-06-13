'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Layers, LayoutTemplate, Zap } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { nodeCategories, workflowTemplates, NodeDef, WorkflowTemplate } from './nodeCategories';
import NodeIcon from './NodeIcon';
import { useAutomationStore } from '../../store/automationStore';

type Tab = 'nodes' | 'templates';

// ── Draggable node item ──────────────────────────────────────────────────────
function DraggableNode({ node, color }: { node: NodeDef; color: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${node.type}-${node.label}`,
    data: { nodeDef: node, color },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors select-none"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: `${color}28`, border: `1px solid ${color}40` }}
      >
        <NodeIcon icon={node.icon} brand={node.brand} size={13} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200 font-medium truncate leading-tight">{node.label}</p>
        {node.description && (
          <p className="text-[10px] text-slate-600 truncate leading-tight mt-0.5">{node.description}</p>
        )}
      </div>
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />
    </div>
  );
}

// ── Category section ─────────────────────────────────────────────────────────
function CategorySection({
  category, color, icon, nodes, query,
}: {
  category: string; color: string; icon: string; nodes: NodeDef[]; query: string;
}) {
  const [open, setOpen] = useState(true);
  const filtered = query
    ? nodes.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()) || n.description?.toLowerCase().includes(query.toLowerCase()))
    : nodes;

  if (query && filtered.length === 0) return null;

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: color }}>
          <NodeIcon icon={icon} size={9} color="white" />
        </div>
        <span className="text-[10px] font-bold text-slate-300 flex-1 text-left tracking-wider uppercase">{category}</span>
        <span className="text-[10px] text-slate-600 font-medium mr-1">{filtered.length}</span>
        {open ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
      </button>

      {open && (
        <div className="ml-1 mt-0.5 space-y-0.5">
          {filtered.map((node) => (
            <DraggableNode key={`${node.type}-${node.label}`} node={node} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template }: { template: WorkflowTemplate }) {
  const { setNodes, setEdges, setWorkflowName } = useAutomationStore();

  const loadTemplate = () => {
    const nodes = template.nodes.map((n, i) => ({
      id: String(i),
      type: n.type,
      position: n.position,
      data: {
        label: n.label,
        icon: n.icon,
        brand: n.brand || false,
        category: (() => {
          const m: Record<string, string> = { trigger: 'Triggers', action: 'CRM', condition: 'Conditions', ai: 'AI', integration: 'Integrations' };
          return m[n.type] || 'CRM';
        })(),
        config: n.config || {},
      },
    }));

    const edges = template.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: template.color, strokeWidth: 2 },
    }));

    setNodes(nodes);
    setEdges(edges);
    setWorkflowName(template.name);
  };

  return (
    <button
      onClick={loadTemplate}
      className="w-full text-left p-3 rounded-xl border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all group"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${template.color}25`, border: `1px solid ${template.color}40` }}
        >
          <NodeIcon icon={template.icon} size={14} color={template.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate">{template.name}</p>
          <p className="text-[10px] text-slate-500">{template.nodes.length} nodes · {template.category}</p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{ background: `${template.color}25`, color: template.color }}
        >
          Use
        </span>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{template.description}</p>
    </button>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function NodeSidebar() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('nodes');

  const totalNodes = nodeCategories.reduce((a, c) => a + c.nodes.length, 0);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: 270,
        background: '#0B1120',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Tab bar */}
      <div className="flex p-2 gap-1 border-b border-white/5 flex-shrink-0">
        <button
          onClick={() => setTab('nodes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'nodes' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Nodes
          <span className="text-[10px] text-slate-600 font-normal">({totalNodes})</span>
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            tab === 'templates' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          Templates
          <span className="text-[10px] text-slate-600 font-normal">({workflowTemplates.length})</span>
        </button>
      </div>

      {/* Search (only for nodes tab) */}
      {tab === 'nodes' && (
        <div className="px-3 py-2.5 border-b border-white/5 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {tab === 'nodes' ? (
          <div className="px-1.5 space-y-0.5">
            {query && (
              <p className="text-[10px] text-slate-600 px-2.5 py-1">
                {nodeCategories.reduce((a, c) => a + c.nodes.filter(n =>
                  n.label.toLowerCase().includes(query.toLowerCase()) ||
                  n.description?.toLowerCase().includes(query.toLowerCase())
                ).length, 0)} results
              </p>
            )}
            {nodeCategories.map((cat) => (
              <CategorySection
                key={cat.category}
                category={cat.category}
                color={cat.color}
                icon={cat.icon}
                nodes={cat.nodes}
                query={query}
              />
            ))}
          </div>
        ) : (
          <div className="px-2 space-y-1.5">
            <p className="text-[10px] text-slate-600 px-1 py-1 font-semibold uppercase tracking-wider">
              Click a template to load it onto the canvas
            </p>
            {workflowTemplates.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-white/5 flex-shrink-0">
        {tab === 'nodes' ? (
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Zap className="w-3 h-3 text-orange-500/70" />
            Drag nodes onto the canvas to build
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <LayoutTemplate className="w-3 h-3 text-pink-500/70" />
            Templates replace current canvas
          </div>
        )}
      </div>
    </div>
  );
}
