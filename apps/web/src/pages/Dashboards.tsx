import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, STATUS_LABELS, getCurrentUserId } from "../services/mockData";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Layout,
  LayoutDashboard,
  Bug,
  CheckCircle,
  Clock,
  Plus,
  X,
  List,
} from "lucide-react";

const COLORS = ["#0052CC", "#36B37E", "#FFAB00", "#FF5630", "#00B8D9"];

interface Gadget {
  id: string;
  title: string;
  icon: any;
}

const AVAILABLE_GADGETS: Gadget[] = [
  { id: "status", title: "ステータス分布", icon: Layout },
  { id: "progress", title: "プロジェクト別進捗", icon: CheckCircle },
  { id: "bugs", title: "最近のバグ", icon: Bug },
  { id: "due", title: "期限切れ間近", icon: Clock },
];

export const Dashboards = () => {
  const issues = useLiveQuery(() => db.issues.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const [activeGadgetIds, setActiveGadgetIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load configuration
  useEffect(() => {
    const userId = getCurrentUserId();
    const stored = localStorage.getItem(`dashboard_gadgets_${userId}`);
    if (stored) {
      setActiveGadgetIds(JSON.parse(stored));
    } else {
      setActiveGadgetIds(["status", "progress", "bugs"]);
    }
    setIsInitialized(true);
  }, []);

  // Save configuration
  useEffect(() => {
    if (!isInitialized) return;
    const userId = getCurrentUserId();
    localStorage.setItem(
      `dashboard_gadgets_${userId}`,
      JSON.stringify(activeGadgetIds),
    );
  }, [activeGadgetIds, isInitialized]);

  const statusData = Object.entries(
    issues.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({
    name: STATUS_LABELS[name as keyof typeof STATUS_LABELS] || name,
    value,
  }));

  const projectData = projects.map((p) => ({
    name: p.key,
    count: issues.filter((i) => i.projectId === p.id).length,
    done: issues.filter((i) => i.projectId === p.id && i.status === "Done")
      .length,
  }));

  const removeGadget = (id: string) => {
    setActiveGadgetIds((prev) => prev.filter((x) => x !== id));
  };

  const addGadget = (id: string) => {
    if (!activeGadgetIds.includes(id)) {
      setActiveGadgetIds((prev) => [...prev, id]);
    }
    setShowAddModal(false);
  };

  const GadgetWrapper: React.FC<{
    id: string;
    title: string;
    icon: any;
    children?: React.ReactNode;
  }> = ({ id, title, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <button
          onClick={() => removeGadget(id)}
          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  if (!isInitialized) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> ダッシュボード
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            プロジェクトの概況をリアルタイムで監視します。
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white border-2 border-primary text-primary px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} /> ガジェット追加
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeGadgetIds.map((id) => {
          const g = AVAILABLE_GADGETS.find((x) => x.id === id);
          if (!g) return null;

          return (
            <GadgetWrapper key={id} id={id} title={g.title} icon={g.icon}>
              {id === "status" && (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2">
                    {statusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-[10px] font-bold text-gray-500">
                          {d.name}: {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {id === "progress" && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectData}
                      layout="vertical"
                      margin={{ left: -20 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={40}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        fontBold
                      />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar
                        dataKey="done"
                        stackId="a"
                        fill="#36B37E"
                        barSize={12}
                        radius={[2, 0, 0, 2]}
                      />
                      <Bar
                        dataKey="count"
                        stackId="a"
                        fill="#DFE1E6"
                        barSize={12}
                        radius={[0, 2, 2, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {id === "bugs" && (
                <div className="space-y-2">
                  {issues
                    .filter((i) => i.type === "Bug")
                    .slice(0, 4)
                    .map((bug) => (
                      <div
                        key={bug.id}
                        className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs font-bold text-gray-700 truncate">
                            {bug.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">
                          {bug.key}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {id === "due" && (
                <div className="space-y-2">
                  {issues
                    .filter((i) => i.dueDate && i.status !== "Done")
                    .slice(0, 4)
                    .map((issue) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-2.5"
                      >
                        <span className="text-xs text-gray-700 truncate max-w-[180px] font-medium">
                          {issue.title}
                        </span>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          {new Date(issue.dueDate!).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </GadgetWrapper>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <List size={18} /> ガジェットを選択
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {AVAILABLE_GADGETS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => addGadget(g.id)}
                  disabled={activeGadgetIds.includes(g.id)}
                  className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all ${activeGadgetIds.includes(g.id) ? "opacity-50 grayscale bg-gray-50" : "hover:bg-blue-50 border border-transparent hover:border-blue-100"}`}
                >
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-primary shadow-sm">
                    <g.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">
                      {g.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activeGadgetIds.includes(g.id)
                        ? "追加済み"
                        : "クリックして追加"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
