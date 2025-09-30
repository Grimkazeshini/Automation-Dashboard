import './App.css';
import { Dashboard } from './components/Dashboard';
import { WorkflowActions } from './components/WorkflowActions';
import { WorkflowList } from './components/WorkflowList';
import { LogViewer } from './components/LogViewer';
import { WorkflowChart } from './components/WorkflowChart';
import { useStore } from './store';

function App() {
  const { error } = useStore();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>Automation Dashboard</h1>
            <p className="header-subtitle">
              AI-Powered Workflow Automation & Reporting
            </p>
          </div>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error">Error: {error}</div>}

        <Dashboard />
        <WorkflowActions />
        <WorkflowChart />
        <WorkflowList />
        <LogViewer />
      </main>
    </div>
  );
}

export default App;
