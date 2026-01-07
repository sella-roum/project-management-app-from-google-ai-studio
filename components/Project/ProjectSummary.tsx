import React from 'react';
import { Project, Issue } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  project: Project;
  issues: Issue[];
}

export const ProjectSummary: React.FC<Props> = ({ project, issues }) => {
  const statusCounts = issues.reduce((acc, issue) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    { name: 'To Do', count: statusCounts['To Do'] || 0, color: '#DFE1E6' },
    { name: 'In Progress', count: statusCounts['In Progress'] || 0, color: '#0052CC' },
    { name: 'In Review', count: statusCounts['In Review'] || 0, color: '#00B8D9' },
    { name: 'Done', count: statusCounts['Done'] || 0, color: '#36B37E' },
  ];

  const recentActivity = issues
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertCircle size={16} />
            <span className="text-xs font-semibold uppercase">Open Issues</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {issues.filter(i => i.status !== 'Done').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle size={16} />
            <span className="text-xs font-semibold uppercase">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {issues.filter(i => i.status === 'Done').length}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Overview</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={16} />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map(issue => (
            <div key={issue.id} className="flex gap-3 items-center bg-white p-3 rounded border border-gray-100">
              <span className={`w-2 h-2 rounded-full ${issue.status === 'Done' ? 'bg-green-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{issue.title}</p>
                <p className="text-xs text-gray-500">Updated {new Date(issue.updatedAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-mono text-gray-400">{issue.key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
