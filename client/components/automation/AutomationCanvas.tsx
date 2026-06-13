'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import { useAutomationStore } from '../../store/automationStore';
import AutomationNode from './nodes/BaseNode';
import { CATEGORY_COLORS } from './nodeCategories';
import { Workflow, MousePointer2 } from 'lucide-react';

const nodeTypes: NodeTypes = {
  trigger:     AutomationNode,
  action:      AutomationNode,
  condition:   AutomationNode,
  ai:          AutomationNode,
  integration: AutomationNode,
};

const EDGE_COLOR = '#F97316';

export default function AutomationCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode } = useAutomationStore();

  const { setNodeRef } = useDroppable({ id: 'canvas-drop' });

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges(
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: EDGE_COLOR, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
          },
          edges
        )
      ),
    [edges, setEdges]
  );

  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  const onNodeDragStop = useCallback(
    (_evt: unknown, node: { id: string; position: { x: number; y: number } }) => {
      setNodes(nodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)));
    },
    [nodes, setNodes]
  );

  const isEmpty = nodes.length === 0;

  return (
    <div ref={setNodeRef} className="flex-1 relative" style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          const next = [...nodes];
          changes.forEach((change) => {
            if (change.type === 'remove') {
              const idx = next.findIndex((n) => n.id === change.id);
              if (idx !== -1) next.splice(idx, 1);
            }
          });
          setNodes(next);
        }}
        onEdgesChange={(changes) => {
          const next = [...edges];
          changes.forEach((change) => {
            if (change.type === 'remove') {
              const idx = next.findIndex((e) => e.id === change.id);
              if (idx !== -1) next.splice(idx, 1);
            }
          });
          setEdges(next);
        }}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        snapToGrid
        snapGrid={[16, 16]}
        style={{ background: '#0A1120' }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: EDGE_COLOR, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        }}
        connectionLineStyle={{ stroke: EDGE_COLOR, strokeWidth: 2, strokeDasharray: '6 3' }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Dot grid — two-layer for n8n style */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.07)"
        />

        {/* Controls */}
        <Controls
          style={{
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
          className="[&_button]:!bg-transparent [&_button]:!border-0 [&_button]:!text-slate-400 [&_button:hover]:!text-white [&_button:hover]:!bg-white/10"
        />

        {/* Minimap */}
        <MiniMap
          style={{
            background: '#0D1A2D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
          nodeColor={(n) => {
            const data = n.data as { category?: string };
            return CATEGORY_COLORS[data?.category || ''] || '#475569';
          }}
          maskColor="rgba(0,0,0,0.5)"
        />

        {/* Node count badge */}
        {nodes.length > 0 && (
          <Panel position="top-right">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                color: '#94A3B8',
              }}
            >
              <Workflow className="w-3.5 h-3.5 text-orange-400" />
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
            </div>
          </Panel>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Panel position="top-center">
            <div className="flex flex-col items-center gap-3 mt-28 pointer-events-none select-none">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1.5px dashed rgba(249,115,22,0.25)',
                }}
              >
                <Workflow className="w-9 h-9 text-orange-500/40" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-semibold text-slate-400">Your canvas is empty</p>
                <p className="text-xs text-slate-600 max-w-[220px] leading-relaxed">
                  Drag a node from the left panel, or pick a template to get started
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)',
                  color: '#F97316',
                }}
              >
                <MousePointer2 className="w-3 h-3" /> Start with a Trigger node
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
