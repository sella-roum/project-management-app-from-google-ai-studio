import React from "react";
import { Project, Issue } from "../../types";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  YAxis,
} from "recharts";
import { AlertCircle, CheckCircle, Clock, Users, Zap } from "lucide-react";
import { STATUS_LABELS } from "@repo/core";
import { getProjectStats } from "@repo/storage";
import { useLiveQuery } from "dexie-react-hooks";

interface Props {
  project: Project;
  issues: Issue[];
}

export const ProjectSummary: React.FC<Props> = ({ project, issues }) => {
  const stats = useLiveQuery(() => getProjectStats(project.id), [project.id]);

  const statusCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const data = [
    { name: "未着手", count: statusCounts["To Do"] || 0, color: "#DFE1E6" },
    {
      name: "進行中",
      count: statusCounts["In Progress"] || 0,
      color: "#0052CC",
    },
    { name: "完了", count: statusCounts["Done"] || 0, color: "#36B37E" },
  ];

  const recentActivity = issues
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              未完了
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {issues.filter((i) => i.status !== "Done").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              完了
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {issues.filter((i) => i.status === "Done").length}
          </p>
        </div>
      </div>

      {stats && stats.workload.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14} /> ワークロード (担当課題数)
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.workload} layout="vertical">
                <YAxis
                  dataKey="userName"
                  type="category"
                  fontSize={10}
                  width={60}
                  hide
                />
                <XAxis type="number" hide />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#0052CC"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 10, fill: "#666" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats && stats.epicProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Zap size={14} className="text-purple-500" /> エピック進捗
          </h3>
          <div className="space-y-2">
            {stats.epicProgress.map((epic) => (
              <div
                key={epic.id}
                className="bg-white p-3 rounded-xl border border-gray-100"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">
                    {epic.title}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {epic.percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-700"
                    style={{ width: `${epic.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          ステータス合計
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
