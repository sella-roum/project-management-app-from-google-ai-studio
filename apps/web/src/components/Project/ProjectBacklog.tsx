import React, { useState } from "react";
import { Issue, Sprint, Project } from "../../types";
import { IssueTypeIcon } from "../Common/IssueTypeIcon";
import { PriorityIcon } from "../Common/PriorityIcon";
import { Avatar } from "../Common/Avatar";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Play,
  CheckCircle,
  Trash2,
  X,
} from "lucide-react";
// Fix: Removed deleteSprint from imports as it is not exported from mockData.ts and not used in this file
import { STATUS_LABELS } from "@repo/core";
import {
  createSprint,
  updateSprintStatus,
  updateIssue,
  createIssue,
} from "@repo/storage";

interface Props {
  project: Project;
  issues: Issue[];
  sprints: Sprint[];
  onIssueClick: (issue: Issue) => void;
}

const CompleteSprintModal = ({
  isOpen,
  onClose,
  sprint,
  issues,
  onComplete,
}: any) => {
  const [destination, setDestination] = useState<"backlog" | string>("backlog");
  const incompleteCount = issues.filter(
    (i: Issue) => i.status !== "Done",
  ).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">
            スプリント完了: {sprint.name}
          </h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            このスプリントには <strong>{incompleteCount}件</strong>{" "}
            の未完了課題があります。これらをどこへ移動しますか？
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={destination === "backlog"}
                onChange={() => setDestination("backlog")}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                バックログ
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={destination === "next"}
                onChange={() => setDestination("next")}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                次のスプリントへ (自動作成)
              </span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-500"
          >
            キャンセル
          </button>
          <button
            onClick={() => onComplete(destination)}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg"
          >
            完了する
          </button>
        </div>
      </div>
    </div>
  );
};

const SprintSection = ({
  sprint,
  issues,
  onIssueClick,
  onStartSprint,
  onCompleteSprint,
  onDropIssue,
  onCreateInline,
}: any) => {
  const [expanded, setExpanded] = useState(true);
  const [isOver, setIsOver] = useState(false);
  const [inlineValue, setInlineValue] = useState("");
  const [showInline, setShowInline] = useState(false);

  const isBacklog =
    sprint.id === "backlog" || sprint.name.includes("バックログ");

  const handleInlineSubmit = async () => {
    if (!inlineValue.trim()) return;
    await onCreateInline(inlineValue, sprint.id);
    setInlineValue("");
    setShowInline(false);
  };

  return (
    <div className="mb-6">
      <div
        className="flex items-center justify-between bg-gray-50 p-3 rounded-t-lg border border-gray-200 cursor-pointer sticky top-0 z-10"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-800">
                {sprint.name}
              </h3>
              {sprint.status === "active" && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold uppercase">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isBacklog && (
            <div onClick={(e) => e.stopPropagation()} className="flex gap-1">
              {sprint.status === "future" && onStartSprint && (
                <button
                  onClick={() => onStartSprint(sprint.id)}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Play size={12} fill="currentColor" /> 開始
                </button>
              )}
              {sprint.status === "active" && onCompleteSprint && (
                <button
                  onClick={() => onCompleteSprint(sprint)}
                  className="text-xs bg-primary text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle size={12} /> 完了
                </button>
              )}
            </div>
          )}
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full font-mono text-gray-600">
            {issues.length}
          </span>
        </div>
      </div>

      {expanded && (
        <div
          className={`bg-white border-x border-b border-gray-200 rounded-b-lg divide-y divide-gray-100 min-h-[50px] transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsOver(true);
          }}
          onDragLeave={() => setIsOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsOver(false);
            const id = e.dataTransfer.getData("issueId");
            if (id) onDropIssue(id, sprint.id);
          }}
        >
          {issues.map((issue: Issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("issueId", issue.id)}
              className="flex items-center p-3 hover:bg-gray-50 cursor-grab active:cursor-grabbing group"
            >
              <div className="mr-3">
                <IssueTypeIcon type={issue.type} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {issue.key}
                  </span>
                  <span className="text-sm text-gray-800 truncate">
                    {issue.title}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <PriorityIcon priority={issue.priority} />
                <Avatar userId={issue.assigneeId} size="sm" />
              </div>
            </div>
          ))}

          {showInline ? (
            <div className="p-2 bg-gray-50 flex gap-2">
              <input
                autoFocus
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInlineSubmit()}
                placeholder="何を完了する必要がありますか？"
                className="flex-1 text-sm p-2 border rounded focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                onClick={handleInlineSubmit}
                className="bg-primary text-white px-4 rounded text-xs font-bold"
              >
                作成
              </button>
              <button
                onClick={() => setShowInline(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInline(true)}
              className="w-full py-2 text-xs text-gray-400 hover:text-primary hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5 border-t border-gray-100"
            >
              <Plus size={14} /> 課題を作成
            </button>
          )}

          {issues.length === 0 && !showInline && (
            <div className="p-8 text-center text-gray-400 text-xs">
              課題をドロップまたは作成して追加
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProjectBacklog: React.FC<Props> = ({
  project,
  issues,
  sprints,
  onIssueClick,
}) => {
  const [completeModalSprint, setCompleteModalSprint] = useState<Sprint | null>(
    null,
  );

  const handleCreateInline = async (title: string, sprintId: string) => {
    await createIssue({
      projectId: project.id,
      title,
      sprintId:
        sprintId === "backlog" || sprintId.includes("backlog")
          ? undefined
          : sprintId,
      status: "To Do",
      type: "Task",
    });
  };

  const handleCompleteSprintFinish = async (
    destination: "backlog" | "next",
  ) => {
    if (!completeModalSprint) return;

    const incompleteIssues = issues.filter(
      (i) => i.sprintId === completeModalSprint.id && i.status !== "Done",
    );
    let targetSprintId: string | undefined = undefined;

    if (destination === "next") {
      const newSprint = await createSprint(project.id);
      targetSprintId = newSprint.id;
    }

    for (const issue of incompleteIssues) {
      await updateIssue(issue.id, { sprintId: targetSprintId });
    }

    await updateSprintStatus(completeModalSprint.id, "completed");
    setCompleteModalSprint(null);
  };

  const activeSprints = sprints.filter((s) => s.status === "active");
  const futureSprints = sprints.filter(
    (s) => s.status === "future" && !s.name.includes("バックログ"),
  );
  const backlogContainer =
    sprints.find((s) => s.name.includes("バックログ")) ||
    ({ id: "backlog", name: "バックログ", status: "future" } as Sprint);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => createSprint(project.id)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium flex items-center gap-1"
        >
          <Plus size={16} /> スプリントを作成
        </button>
      </div>

      {activeSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          issues={issues.filter((i) => i.sprintId === sprint.id)}
          onIssueClick={onIssueClick}
          onCompleteSprint={(s: Sprint) => setCompleteModalSprint(s)}
          onDropIssue={(id: string, sid: string) =>
            updateIssue(id, { sprintId: sid === "backlog" ? undefined : sid })
          }
          onCreateInline={handleCreateInline}
        />
      ))}

      {futureSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          issues={issues.filter((i) => i.sprintId === sprint.id)}
          onIssueClick={onIssueClick}
          onStartSprint={(id: string) => updateSprintStatus(id, "active")}
          onDropIssue={(id: string, sid: string) =>
            updateIssue(id, { sprintId: sid === "backlog" ? undefined : sid })
          }
          onCreateInline={handleCreateInline}
        />
      ))}

      <SprintSection
        sprint={backlogContainer}
        issues={issues.filter(
          (i) => !i.sprintId || i.sprintId === backlogContainer.id,
        )}
        onIssueClick={onIssueClick}
        onDropIssue={(id: string, sid: string) =>
          updateIssue(id, { sprintId: undefined })
        }
        onCreateInline={handleCreateInline}
      />

      <CompleteSprintModal
        isOpen={!!completeModalSprint}
        onClose={() => setCompleteModalSprint(null)}
        sprint={completeModalSprint}
        issues={issues.filter((i) => i.sprintId === completeModalSprint?.id)}
        onComplete={handleCompleteSprintFinish}
      />
    </div>
  );
};
