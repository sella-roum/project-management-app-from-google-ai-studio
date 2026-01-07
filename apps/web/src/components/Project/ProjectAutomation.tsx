import React, { useState } from "react";
import { Project, AutomationRule, AutomationLog } from "../../types";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getAutomationRules,
  toggleAutomationRule,
  createAutomationRule,
  getAutomationLogs,
} from "@repo/storage";
import {
  Zap,
  PlayCircle,
  History,
  Plus,
  X,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const ProjectAutomation: React.FC<{ project: Project }> = ({
  project,
}) => {
  const rules =
    useLiveQuery(() => getAutomationRules(project.id), [project.id]) || [];
  const [activeTab, setActiveTab] = useState<"rules" | "audit">("rules");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const auditLogs =
    useLiveQuery(
      () =>
        selectedRuleId
          ? getAutomationLogs(selectedRuleId)
          : Promise.resolve([]),
      [selectedRuleId],
    ) || [];

  const [showCreate, setShowCreate] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<AutomationRule>>({
    name: "",
    trigger: "issue_created",
    action: "assign_reporter",
  });

  const handleCreate = async () => {
    if (!ruleForm.name) return;
    await createAutomationRule({
      ...ruleForm,
      projectId: project.id,
      enabled: true,
    });
    setShowCreate(false);
    setRuleForm({
      name: "",
      trigger: "issue_created",
      action: "assign_reporter",
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto min-h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <Zap className="text-amber-500" size={24} /> 自動化
          </h2>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setActiveTab("rules")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "rules" ? "border-primary text-primary" : "border-transparent text-gray-400"}`}
            >
              ルール一覧
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "audit" ? "border-primary text-primary" : "border-transparent text-gray-400"}`}
            >
              監査ログ
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white p-3 rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {activeTab === "rules" ? (
        <div className="grid grid-cols-1 gap-4 animate-fadeIn">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${rule.enabled ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">{rule.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                      {rule.trigger} → {rule.action}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) =>
                    toggleAutomationRule(rule.id, e.target.checked)
                  }
                  className="w-6 h-6 accent-primary"
                />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                  <PlayCircle size={14} /> 最終実行:{" "}
                  {rule.lastRun
                    ? new Date(rule.lastRun).toLocaleString()
                    : "なし"}
                </div>
                <button
                  onClick={() => {
                    setSelectedRuleId(rule.id);
                    setActiveTab("audit");
                  }}
                  className="text-[10px] text-primary font-black uppercase flex items-center gap-1 hover:underline"
                >
                  <History size={14} /> ログを表示
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <select
            value={selectedRuleId || ""}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none"
          >
            <option value="">ルールを選択...</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center"
              >
                {log.status === "success" ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <AlertCircle className="text-red-500" size={20} />
                )}
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-800">
                    {log.message}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(log.executedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {selectedRuleId && auditLogs.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold text-xs">
                ログはまだありません。
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-secondary">
                自動化ルールの作成
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                    ルール名
                  </label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, name: e.target.value })
                    }
                    placeholder="例: 自動アサイン"
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      トリガー
                    </label>
                    <select
                      value={ruleForm.trigger}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          trigger: e.target.value as any,
                        })
                      }
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm"
                    >
                      <option value="issue_created">課題の作成時</option>
                      <option value="status_changed">ステータス変更時</option>
                      <option value="comment_added">コメント投稿時</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      アクション
                    </label>
                    <select
                      value={ruleForm.action}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          action: e.target.value as any,
                        })
                      }
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm"
                    >
                      <option value="assign_reporter">報告者に割り当て</option>
                      <option value="add_comment">コメントを自動投稿</option>
                      <option value="set_priority_high">
                        優先度を「高」にする
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!ruleForm.name}
                  className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  作成する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
