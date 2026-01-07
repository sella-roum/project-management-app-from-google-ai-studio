import React, { useState } from "react";
import { Project } from "../../types";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  WORKFLOW_TRANSITIONS,
} from "@repo/core";
import { updateProject, deleteProject } from "../../services/mockData";
import { Save, Shield, Workflow, Bell, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkflowEditorModal } from "../Modals/WorkflowEditorModal";
import { NotificationSchemeModal } from "../Modals/NotificationSchemeModal";

interface Props {
  project: Project;
}

export const ProjectSettings: React.FC<Props> = ({ project }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "details" | "workflow" | "permissions" | "notifications"
  >("details");
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [category, setCategory] = useState(project.category);
  const [isSaved, setIsSaved] = useState(false);

  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showNotifEditor, setShowNotifEditor] = useState(false);

  const navigate = useNavigate();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(project.id, { name, description, category });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (
      confirm(
        `本当にプロジェクト「${project.name}」を削除しますか？この操作は取り消せません。`,
      )
    ) {
      await deleteProject(project.id);
      navigate("/");
    }
  };

  const handleSaveWorkflow = async (newWorkflow: Record<string, string[]>) => {
    await updateProject(project.id, { workflowSettings: newWorkflow });
    setShowWorkflowEditor(false);
  };

  const handleSaveNotification = async (
    newScheme: Record<string, string[]>,
  ) => {
    await updateProject(project.id, { notificationSettings: newScheme });
    setShowNotifEditor(false);
  };

  // Use project specific or default if missing (though mockData now ensures it)
  const currentWorkflow = project.workflowSettings || WORKFLOW_TRANSITIONS;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: "details", label: "詳細", icon: Info },
          { id: "workflow", label: "ワークフロー", icon: Workflow },
          { id: "permissions", label: "権限", icon: Shield },
          { id: "notifications", label: "通知", icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all ${activeSubTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-400"}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "details" && (
        <div className="space-y-6 animate-fadeIn">
          <form
            onSubmit={handleSave}
            className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                キー
              </label>
              <input
                type="text"
                value={project.key}
                disabled
                className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primaryHover transition-colors"
              >
                <Save size={18} /> 変更を保存
              </button>
              {isSaved && (
                <span className="text-green-600 text-sm font-medium animate-fadeIn">
                  保存しました！
                </span>
              )}
            </div>
          </form>

          <div className="border border-red-100 bg-red-50 p-6 rounded-lg">
            <h3 className="text-red-600 font-bold mb-2">プロジェクトの削除</h3>
            <p className="text-sm text-red-500 mb-4 opacity-80">
              すべての課題、スプリント、リリースが永久に削除されます。
            </p>
            <button
              onClick={handleDelete}
              className="text-white bg-red-600 px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-red-700"
            >
              プロジェクトを削除
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "workflow" && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-gray-800">
            ステータスマッピング
          </h3>
          <div className="space-y-4">
            {Object.entries(currentWorkflow).map(([status, nextStatuses]) => (
              <div key={status} className="flex gap-4 items-center">
                <div className="w-32 p-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center">
                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ||
                    status}
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {(nextStatuses as string[]).map((ns) => (
                    <span
                      key={ns}
                      className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold"
                    >
                      {STATUS_LABELS[ns as keyof typeof STATUS_LABELS] || ns}
                    </span>
                  ))}
                  {(!nextStatuses || nextStatuses.length === 0) && (
                    <span className="text-xs text-gray-400 italic">
                      遷移なし
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setShowWorkflowEditor(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              エディタでワークフローを編集
            </button>
          </div>
        </div>
      )}

      {activeSubTab === "permissions" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-600">権限</th>
                <th className="px-4 py-3 font-bold text-gray-600">
                  プロジェクトロール
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { p: "プロジェクトの参照", r: "管理者、メンバー、閲覧者" },
                { p: "課題の作成", r: "管理者、メンバー" },
                { p: "スプリントの管理", r: "管理者" },
                { p: "課題の削除", r: "管理者" },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {row.p}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.r}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 font-bold border-t border-gray-200">
            権限設定は現在読み取り専用です
          </div>
        </div>
      )}

      {activeSubTab === "notifications" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
            <Info size={16} />
            <p className="text-xs font-medium">
              通知スキームは、どのイベントが誰に送信されるかを制御します。
            </p>
          </div>
          <div className="space-y-4">
            {[
              { event: "issue_created", label: "課題の作成" },
              { event: "issue_updated", label: "課題の更新" },
              { event: "issue_assigned", label: "課題の割り当て" },
              { event: "comment_added", label: "コメント投稿" },
              { event: "issue_resolved", label: "課題の解決" },
            ].map((row, i) => {
              const recipients =
                project.notificationSettings?.[row.event] || [];
              return (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-gray-50"
                >
                  <div>
                    <div className="font-bold text-gray-800 text-sm">
                      {row.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {recipients.length > 0 ? (
                      recipients.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium"
                        >
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300">なし</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setShowNotifEditor(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              エディタで通知を編集
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <WorkflowEditorModal
        isOpen={showWorkflowEditor}
        currentWorkflow={project.workflowSettings || WORKFLOW_TRANSITIONS}
        onClose={() => setShowWorkflowEditor(false)}
        onSave={handleSaveWorkflow}
      />
      <NotificationSchemeModal
        isOpen={showNotifEditor}
        currentScheme={project.notificationSettings || {}}
        onClose={() => setShowNotifEditor(false)}
        onSave={handleSaveNotification}
      />
    </div>
  );
};
