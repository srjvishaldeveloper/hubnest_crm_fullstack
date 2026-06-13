'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { X, Settings2 } from 'lucide-react';
import NodeIcon from '../NodeIcon';
import { useAutomationStore } from '../../../store/automationStore';
import { CATEGORY_COLORS } from '../nodeCategories';

export interface AutomationNodeData {
  label: string;
  icon: string;
  brand?: boolean;
  category: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

const CATEGORY_LABEL: Record<string, string> = {
  Triggers:      'TRIGGER',
  CRM:           'ACTION',
  Communication: 'ACTION',
  Conditions:    'CONDITION',
  AI:            'AI',
  Integrations:  'INTEGRATION',
  Data:          'DATA',
  Notifications: 'NOTIFY',
};

function getColor(category: string) {
  return CATEGORY_COLORS[category] || '#6B7280';
}

export function AutomationNode({ id, data, type, selected }: NodeProps) {
  const { selectNode, removeNode, nodes } = useAutomationStore();
  const nodeData = data as AutomationNodeData;
  const color = getColor(nodeData.category);
  const kindLabel = CATEGORY_LABEL[nodeData.category] || 'NODE';

  const thisNode = nodes.find((n) => n.id === id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (thisNode) selectNode(thisNode);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const configSummary = nodeData.config
    ? Object.entries(nodeData.config)
        .filter(([, v]) => v)
        .slice(0, 2)
        .map(([k, v]) => `${String(v).slice(0, 24)}`)
        .join(' · ')
    : null;

  const hasConfig = !!(nodeData.config && Object.values(nodeData.config).some(Boolean));

  return (
    <div
      onClick={handleClick}
      className="group"
      style={{
        width: 220,
        borderRadius: 14,
        border: selected ? `2px solid ${color}` : '1.5px solid rgba(255,255,255,0.10)',
        background: selected
          ? 'linear-gradient(135deg, #1a2235 0%, #151c2e 100%)'
          : 'linear-gradient(135deg, #16213a 0%, #121929 100%)',
        boxShadow: selected
          ? `0 0 0 3px ${color}22, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 4px 16px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transition: 'all 0.15s',
        cursor: 'pointer',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top target handle */}
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: color, width: 12, height: 12,
            border: '2.5px solid #0F172A', top: -7,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      )}

      {/* Kind badge + delete */}
      <div style={{ padding: '8px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          color: color, background: `${color}1A`,
          padding: '2px 6px', borderRadius: 4,
          border: `1px solid ${color}30`,
        }}>
          {kindLabel}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {hasConfig && (
            <div style={{
              width: 16, height: 16, borderRadius: 4,
              background: `${color}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings2 size={9} color={color} />
            </div>
          )}
          <button
            onClick={handleDelete}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none',
              borderRadius: 4, width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              opacity: 0, transition: 'opacity 0.15s',
            }}
            className="group-hover:!opacity-100"
          >
            <X size={9} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Icon + Label */}
      <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}22`, border: `1.5px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: selected ? `0 0 10px ${color}40` : 'none',
          transition: 'box-shadow 0.15s',
        }}>
          <NodeIcon icon={nodeData.icon} brand={nodeData.brand} size={16} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: '#F1F5F9', fontSize: 13, fontWeight: 700,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {nodeData.label}
          </p>
        </div>
      </div>

      {/* Config summary or placeholder */}
      <div style={{
        margin: '0 10px 10px', padding: '6px 8px', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 28,
      }}>
        {configSummary ? (
          <p style={{ fontSize: 10, color: '#94A3B8', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {configSummary}
          </p>
        ) : (
          <p style={{ fontSize: 10, color: '#334155', margin: 0, fontStyle: 'italic' }}>
            Click to configure…
          </p>
        )}
      </div>

      {/* Bottom source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color, width: 12, height: 12,
          border: '2.5px solid #0F172A', bottom: -7,
          boxShadow: `0 0 6px ${color}80`,
        }}
      />

      {/* Condition: right handle for "false/else" branch */}
      {type === 'condition' && nodeData.label !== 'Delay' && nodeData.label !== 'Wait' && (
        <Handle
          id="false"
          type="source"
          position={Position.Right}
          style={{
            background: '#F59E0B', width: 12, height: 12,
            border: '2.5px solid #0F172A', right: -7,
            boxShadow: '0 0 6px rgba(245,158,11,0.5)',
          }}
        />
      )}
    </div>
  );
}

export default AutomationNode;
