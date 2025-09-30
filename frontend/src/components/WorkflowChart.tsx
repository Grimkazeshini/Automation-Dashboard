import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStore } from '../store';

const COLORS = {
  completed: '#4ade80',
  failed: '#f87171',
  running: '#60a5fa',
  pending: '#fbbf24',
};

export function WorkflowChart() {
  const { workflows } = useStore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (workflows.length > 0) {
      // Prepare bar chart data (workflows by type)
      const typeCount: Record<string, any> = {};

      workflows.forEach((w) => {
        if (!typeCount[w.type]) {
          typeCount[w.type] = {
            name: w.type.replace('_', ' ').toUpperCase(),
            completed: 0,
            failed: 0,
            running: 0,
            pending: 0,
          };
        }
        typeCount[w.type][w.status]++;
      });

      setChartData(Object.values(typeCount));

      // Prepare pie chart data (status distribution)
      const statusCount: Record<string, number> = {
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0,
      };

      workflows.forEach((w) => {
        statusCount[w.status]++;
      });

      const pieChartData = Object.entries(statusCount)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));

      setPieData(pieChartData);
    }
  }, [workflows]);

  if (workflows.length === 0) {
    return (
      <div className="chart-section">
        <h2 className="card-title">Workflow Analytics</h2>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No data to visualize yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-section">
      <h2 className="card-title">Workflow Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8' }}>
            Workflows by Type
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill={COLORS.completed} />
              <Bar dataKey="failed" stackId="a" fill={COLORS.failed} />
              <Bar dataKey="running" stackId="a" fill={COLORS.running} />
              <Bar dataKey="pending" stackId="a" fill={COLORS.pending} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8' }}>
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
