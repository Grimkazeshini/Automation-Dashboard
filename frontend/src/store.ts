import { create } from 'zustand';
import type { Workflow, Log, Stats } from './api';

interface AppState {
  workflows: Workflow[];
  logs: Log[];
  stats: Stats | null;
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;

  setWorkflows: (workflows: Workflow[]) => void;
  setLogs: (logs: Log[]) => void;
  setStats: (stats: Stats) => void;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
}

export const useStore = create<AppState>((set) => ({
  workflows: [],
  logs: [],
  stats: null,
  selectedWorkflow: null,
  isLoading: false,
  error: null,

  setWorkflows: (workflows) => set({ workflows }),
  setLogs: (logs) => set({ logs }),
  setStats: (stats) => set({ stats }),
  setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addWorkflow: (workflow) =>
    set((state) => ({
      workflows: [workflow, ...state.workflows],
    })),

  updateWorkflow: (id, updates) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
}));
