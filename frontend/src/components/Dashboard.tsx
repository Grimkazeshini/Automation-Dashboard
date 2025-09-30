import { useEffect } from 'react';
import { useStore } from '../store';
import { statsApi } from '../api';

export function Dashboard() {
  const { stats, setStats, setLoading, setError } = useStore();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsApi.get();
      setStats(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="stat-label">Total Workflows</div>
        <div className="stat-value">{stats.total_workflows}</div>
      </div>

      <div className="card">
        <div className="stat-label">Completed</div>
        <div className="stat-value" style={{ color: '#4ade80' }}>
          {stats.completed}
        </div>
      </div>

      <div className="card">
        <div className="stat-label">Running</div>
        <div className="stat-value" style={{ color: '#60a5fa' }}>
          {stats.running}
        </div>
      </div>

      <div className="card">
        <div className="stat-label">Failed</div>
        <div className="stat-value" style={{ color: '#f87171' }}>
          {stats.failed}
        </div>
      </div>
    </div>
  );
}
