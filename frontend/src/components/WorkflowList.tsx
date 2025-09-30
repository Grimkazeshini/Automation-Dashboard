import { useEffect } from 'react';
import { useStore } from '../store';
import { workflowApi } from '../api';

export function WorkflowList() {
  const { workflows, setWorkflows, setError } = useStore();

  useEffect(() => {
    loadWorkflows();
    const interval = setInterval(loadWorkflows, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await workflowApi.getAll(50);
      setWorkflows(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="workflows-section">
      <div className="card-header">
        <h2 className="card-title">Recent Workflows</h2>
        <button className="button button-secondary" onClick={loadWorkflows}>
          Refresh
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No workflows yet. Try running an action above!</p>
        </div>
      ) : (
        <div className="workflow-list">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="workflow-item">
              <div className="workflow-header">
                <div>
                  <span className="workflow-type">
                    {workflow.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`status-badge status-${workflow.status}`}>
                    {workflow.status}
                  </span>
                </div>
                <span className="workflow-time">
                  {formatDate(workflow.started_at)}
                </span>
              </div>
              <div className="workflow-time">
                Duration: {formatDuration(workflow.started_at, workflow.completed_at)}
              </div>
              {workflow.error && (
                <div className="error" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>
                  {workflow.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
