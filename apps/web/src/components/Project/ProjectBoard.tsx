import React, { useState, useMemo } from "react";
import { Issue, IssueStatus, User, Project } from "../../types";
import { IssueCard } from "../Common/IssueCard";
import {
  Plus,
  Users,
  LayoutList,
  ChevronDown,
  ChevronRight,
  Filter,
  UserCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { STATUS_LABELS } from "@repo/core";
import { updateIssueStatus, USERS, getCurrentUserId } from "@repo/storage";

interface Props {
  project: Project;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onCreateIssue?: (status: IssueStatus) => void;
}

export const ProjectBoard: React.FC<Props> = ({
  project,
  issues,
  onIssueClick,
  onCreateIssue,
}) => {
  const [swimlaneMode, setSwimlaneMode] = useState<"none" | "assignee">("none");
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(
    new Set(),
  );
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [isOverColumn, setIsOverColumn] = useState<{
    status: IssueStatus;
    swimlaneId: string;
  } | null>(null);

  const statuses: IssueStatus[] = ["To Do", "In Progress", "In Review", "Done"];

  const filteredIssues = useMemo(() => {
    let result = [...issues];
    if (activeQuickFilters.includes("mine")) {
      const currentUserId = getCurrentUserId();
      result = result.filter((i) => i.assigneeId === currentUserId);
    }
    if (activeQuickFilters.includes("recent")) {
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      result = result.filter((i) => i.updatedAt > dayAgo);
    }
    return result;
  }, [issues, activeQuickFilters]);

  const swimlanes = useMemo(() => {
    if (swimlaneMode === "none") return [{ id: "all", name: "すべての課題" }];

    // 実際に課題が割り当てられているユーザー＋未割り当て
    const assigneeIds = new Set(
      issues.map((i) => i.assigneeId).filter(Boolean),
    );
    const activeUsers = USERS.filter((u) => assigneeIds.has(u.id));
    return [
      ...activeUsers.map((u) => ({ id: u.id, name: u.name })),
      { id: "unassigned", name: "未割り当て" },
    ];
  }, [swimlaneMode, issues]);

  const toggleSwimlane = (id: string) => {
    const newSet = new Set(collapsedSwimlanes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCollapsedSwimlanes(newSet);
  };

  const handleDrop = async (e: React.DragEvent, status: IssueStatus) => {
    e.preventDefault();
    setIsOverColumn(null);
    const issueId = e.dataTransfer.getData("issueId");
    if (issueId) {
      await updateIssueStatus(issueId, status);
    }
  };

  const getColumnLimit = (status: IssueStatus) =>
    project.columnSettings?.[status]?.limit;

  return (
    <div className="h-full flex flex-col bg-bgLight md:bg-transparent overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between bg-white shrink-0 gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSwimlaneMode("none")}
            className={`p-1.5 rounded-md flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${swimlaneMode === "none" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <LayoutList size={12} /> スタンダード
          </button>
          <button
            onClick={() => setSwimlaneMode("assignee")}
            className={`p-1.5 rounded-md flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${swimlaneMode === "assignee" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Users size={12} /> 担当者別
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() =>
              setActiveQuickFilters((prev) =>
                prev.includes("mine")
                  ? prev.filter((x) => x !== "mine")
                  : [...prev, "mine"],
              )
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${activeQuickFilters.includes("mine") ? "bg-secondary border-secondary text-white" : "bg-white border-gray-200 text-gray-500"}`}
          >
            <UserCheck size={12} /> 自分の課題
          </button>
          <button
            onClick={() =>
              setActiveQuickFilters((prev) =>
                prev.includes("recent")
                  ? prev.filter((x) => x !== "recent")
                  : [...prev, "recent"],
              )
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${activeQuickFilters.includes("recent") ? "bg-secondary border-secondary text-white" : "bg-white border-gray-200 text-gray-500"}`}
          >
            <Clock size={12} /> 最近更新
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar bg-gray-50 p-4">
        <div className="flex gap-4 min-h-full">
          {statuses.map((status) => {
            const columnIssues = filteredIssues.filter(
              (i) => i.status === status,
            );
            const limit = getColumnLimit(status);
            const isOverLimit = limit ? columnIssues.length > limit : false;

            return (
              <div
                key={status}
                className="min-w-[280px] w-[280px] md:w-[320px] flex flex-col shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* 列ヘッダー */}
                <div
                  className={`p-3 font-bold text-[10px] uppercase tracking-widest flex justify-between items-center mb-3 rounded-lg ${isOverLimit ? "bg-red-100 text-red-600" : "bg-white border border-gray-200 text-gray-400"}`}
                >
                  <div className="flex items-center gap-2">
                    {STATUS_LABELS[status]}
                    {isOverLimit && <AlertTriangle size={12} />}
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full ${isOverLimit ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {columnIssues.length} {limit ? `/ ${limit}` : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {swimlanes.map((lane) => {
                    const laneIssues =
                      swimlaneMode === "none"
                        ? columnIssues
                        : columnIssues.filter((i) =>
                            lane.id === "unassigned"
                              ? !i.assigneeId
                              : i.assigneeId === lane.id,
                          );

                    const isCollapsed = collapsedSwimlanes.has(lane.id);

                    return (
                      <div key={lane.id} className="space-y-2">
                        {swimlaneMode !== "none" && status === statuses[0] && (
                          <div
                            onClick={() => toggleSwimlane(lane.id)}
                            className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronRight
                                size={14}
                                className="text-gray-400"
                              />
                            ) : (
                              <ChevronDown
                                size={14}
                                className="text-gray-400"
                              />
                            )}
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                              {lane.name}
                            </span>
                            <span className="text-[9px] bg-gray-200 px-1 rounded text-gray-500">
                              {
                                filteredIssues.filter((i) =>
                                  lane.id === "unassigned"
                                    ? !i.assigneeId
                                    : i.assigneeId === lane.id,
                                ).length
                              }
                            </span>
                          </div>
                        )}

                        {!isCollapsed && (
                          <div
                            className={`space-y-2 min-h-[40px] rounded-lg p-1 transition-colors ${isOverColumn?.status === status && isOverColumn?.swimlaneId === lane.id ? "bg-blue-100/50" : ""}`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsOverColumn({ status, swimlaneId: lane.id });
                            }}
                            onDragLeave={() => setIsOverColumn(null)}
                          >
                            {laneIssues.map((issue) => (
                              <div
                                key={issue.id}
                                draggable
                                onDragStart={(e) =>
                                  e.dataTransfer.setData("issueId", issue.id)
                                }
                                className="cursor-grab active:cursor-grabbing"
                              >
                                {/* Fix: Changed onOpenIssue to onIssueClick as defined in component props */}
                                <IssueCard
                                  issue={issue}
                                  onClick={() => onIssueClick(issue)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {status === "To Do" && (
                    <button
                      onClick={() => onCreateIssue?.(status)}
                      className="w-full py-2 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-blue-50 rounded text-xs transition-colors border-2 border-dashed border-gray-200 hover:border-blue-200"
                    >
                      <Plus size={16} className="mr-1" /> 課題を追加
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
