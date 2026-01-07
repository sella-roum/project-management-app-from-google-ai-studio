import React, { useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { getProjectById, getIssues, getSprints } from "../services/mockData";
import { ProjectSummary } from "../components/Project/ProjectSummary";
import { ProjectBoard } from "../components/Project/ProjectBoard";
import { ProjectBacklog } from "../components/Project/ProjectBacklog";
import { ProjectTimeline } from "../components/Project/ProjectTimeline";
import { ProjectReleases } from "../components/Project/ProjectReleases";
import { ProjectSettings } from "../components/Project/ProjectSettings";
import { ProjectAutomation } from "../components/Project/ProjectAutomation";
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  CalendarClock,
  Settings,
  Rocket,
  Zap,
} from "lucide-react";
import { Issue, IssueStatus } from "../types";
import { useLiveQuery } from "dexie-react-hooks";

type Tab =
  | "summary"
  | "board"
  | "backlog"
  | "timeline"
  | "releases"
  | "automation"
  | "settings";

interface GlobalContext {
  onOpenIssue: (i: Issue) => void;
  openCreateModal: (status?: IssueStatus, projectId?: string) => void;
}

export const ProjectView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const { onOpenIssue, openCreateModal } = useOutletContext<GlobalContext>();

  // Reactive queries
  const project = useLiveQuery(
    () => getProjectById(projectId || ""),
    [projectId],
  );
  const issues = useLiveQuery(() => getIssues(projectId), [projectId]) || [];
  const sprints =
    useLiveQuery(() => getSprints(projectId || ""), [projectId]) || [];

  if (!project) {
    if (project === undefined) return null; // Loading
    return <div className="p-8 text-center">プロジェクトが見つかりません</div>;
  }

  const boardIssues =
    project.type === "Scrum"
      ? issues.filter(
          (i) => sprints.find((s) => s.id === i.sprintId)?.status === "active",
        )
      : issues;

  const handleCreateIssue = (status?: IssueStatus) => {
    openCreateModal(status, project.id);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "summary":
        return <ProjectSummary project={project} issues={issues} />;
      case "board":
        return (
          <ProjectBoard
            project={project}
            issues={boardIssues}
            onIssueClick={onOpenIssue}
            onCreateIssue={handleCreateIssue}
          />
        );
      case "backlog":
        return (
          <ProjectBacklog
            project={project}
            issues={issues}
            sprints={sprints}
            onIssueClick={onOpenIssue}
          />
        );
      case "timeline":
        return <ProjectTimeline issues={issues} />;
      case "releases":
        return <ProjectReleases project={project} issues={issues} />;
      case "automation":
        return <ProjectAutomation project={project} />;
      case "settings":
        return <ProjectSettings project={project} />;
      default:
        return null;
    }
  };

  const TabButton = ({
    id,
    icon: Icon,
    label,
  }: {
    id: Tab;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
        activeTab === id
          ? "border-primary text-primary font-medium"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-xl text-white shadow">
              {project.iconUrl}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {project.name}
              </h1>
              <p className="text-xs text-gray-500">
                {project.type} プロジェクト
              </p>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 -mb-[1px]">
          <TabButton id="summary" icon={LayoutDashboard} label="サマリー" />
          <TabButton id="board" icon={Kanban} label="ボード" />
          {project.type === "Scrum" && (
            <TabButton id="backlog" icon={ListTodo} label="バックログ" />
          )}
          <TabButton id="timeline" icon={CalendarClock} label="タイムライン" />
          <TabButton id="releases" icon={Rocket} label="リリース" />
          <TabButton id="automation" icon={Zap} label="自動化" />
          <TabButton id="settings" icon={Settings} label="設定" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-bgLight overflow-y-auto no-scrollbar">
        {renderTab()}
      </div>
    </div>
  );
};
