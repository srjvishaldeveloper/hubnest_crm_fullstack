import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

interface AutomationStore {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowName: string;
  workflowStatus: 'Draft' | 'Active' | 'Paused';
  isSaving: boolean;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Record<string, unknown>) => void;
  removeNode: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (node: Node | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowStatus: (status: 'Draft' | 'Active' | 'Paused') => void;
  setSaving: (v: boolean) => void;
}

export const useAutomationStore = create<AutomationStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowName: 'Untitled Workflow',
  workflowStatus: 'Draft',
  isSaving: false,

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  updateNode: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      selectedNode:
        s.selectedNode?.id === id
          ? { ...s.selectedNode, data: { ...s.selectedNode.data, ...data } }
          : s.selectedNode,
    })),

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: s.selectedNode?.id === id ? null : s.selectedNode,
    })),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (node) => set({ selectedNode: node }),
  setWorkflowName: (workflowName) => set({ workflowName }),
  setWorkflowStatus: (workflowStatus) => set({ workflowStatus }),
  setSaving: (isSaving) => set({ isSaving }),
}));
