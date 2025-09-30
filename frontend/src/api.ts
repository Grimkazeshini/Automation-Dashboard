import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Workflow {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result?: any;
  error?: string;
  created_at: string;
}

export interface Log {
  id: number;
  workflow_id: string;
  level: 'info' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export interface Summary {
  id: string;
  workflow_id?: string;
  content: string;
  token_count?: number;
  created_at: string;
}

export interface Stats {
  total_workflows: number;
  completed: number;
  failed: number;
  running: number;
  by_type: Record<string, number>;
  recent_activity: Log[];
}

// Workflow endpoints
export const workflowApi = {
  parseEmail: (emailContent: string) =>
    api.post<{ workflow_id: string; status: string; result: any }>(
      '/api/workflows/email-parse',
      { emailContent }
    ),

  cleanData: (data: any) =>
    api.post<{ workflow_id: string; status: string; result: any }>(
      '/api/workflows/data-clean',
      { data }
    ),

  getAll: (limit = 100) =>
    api.get<Workflow[]>('/api/workflows', { params: { limit } }),

  getById: (id: string) => api.get<Workflow>(`/api/workflows/${id}`),
};

// Log endpoints
export const logApi = {
  getAll: (limit = 500) => api.get<Log[]>('/api/logs', { params: { limit } }),

  getByWorkflowId: (workflowId: string) =>
    api.get<Log[]>(`/api/logs/${workflowId}`),
};

// AI/Summary endpoints
export const summaryApi = {
  generate: (content: string, type?: string, workflowId?: string) =>
    api.post<{ id: string; summary: string; usage: any }>('/api/summarize', {
      content,
      type,
      workflowId,
    }),

  getWorkflowInsights: (limit = 50) =>
    api.get<{ insights: string; analyzed_count: number; usage: any }>(
      '/api/insights/workflows',
      { params: { limit } }
    ),

  generateReport: (data: any) =>
    api.post<{ summary: string; usage: any }>('/api/reports/summarize', {
      data,
    }),

  getAll: (limit = 50) =>
    api.get<Summary[]>('/api/summaries', { params: { limit } }),
};

// Stats endpoint
export const statsApi = {
  get: () => api.get<Stats>('/api/stats'),
};

export default api;
