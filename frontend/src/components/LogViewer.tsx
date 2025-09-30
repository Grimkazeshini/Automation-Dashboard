import { useEffect } from 'react';
import { useStore } from '../store';
import { logApi } from '../api';

export function LogViewer() {
  const { logs, setLogs, setError } = useStore();

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const response = await logApi.getAll(100);
      setLogs(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="logs-section">
      <div className="card-header">
        <h2 className="card-title">Activity Logs</h2>
        <button className="button button-secondary" onClick={loadLogs}>
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No logs available</p>
        </div>
      ) : (
        <div className="log-list">
          {logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <span className={`log-level log-level-${log.level}`}>
                  {log.level}
                </span>
                <span className="workflow-time">{formatTime(log.timestamp)}</span>
              </div>
              <div className="log-message">{log.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
