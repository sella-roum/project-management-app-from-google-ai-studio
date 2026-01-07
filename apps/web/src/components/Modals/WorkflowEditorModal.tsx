import React, { useState, useEffect } from "react";
import { X, ArrowRight, Plus, Trash2 } from "lucide-react";
import { STATUS_LABELS } from "@repo/core";

interface Props {
  isOpen: boolean;
  currentWorkflow: Record<string, string[]>;
  onClose: () => void;
  onSave: (workflow: Record<string, string[]>) => void;
}

export const WorkflowEditorModal: React.FC<Props> = ({
  isOpen,
  currentWorkflow,
  onClose,
  onSave,
}) => {
  const [workflow, setWorkflow] = useState<Record<string, string[]>>({});
  const [editingFrom, setEditingFrom] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkflow(JSON.parse(JSON.stringify(currentWorkflow)));
    }
  }, [isOpen, currentWorkflow]);

  if (!isOpen) return null;

  const handleAddTransition = (from: string, to: string) => {
    setWorkflow((prev) => {
      const current = prev[from] || [];
      if (current.includes(to)) return prev;
      return { ...prev, [from]: [...current, to] };
    });
    setEditingFrom(null);
  };

  const handleRemoveTransition = (from: string, to: string) => {
    setWorkflow((prev) => ({
      ...prev,
      [from]: prev[from].filter((t) => t !== to),
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800">ワークフローエディタ</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-6">
            {Object.keys(STATUS_LABELS).map((from) => (
              <div
                key={from}
                className="bg-gray-50 p-4 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-bold text-gray-800">
                    {STATUS_LABELS[from as keyof typeof STATUS_LABELS] || from}
                  </span>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-gray-200 ml-1.5">
                  {(workflow[from] || []).map((to) => (
                    <div
                      key={to}
                      className="flex items-center justify-between text-sm text-gray-600 group bg-white p-2 rounded border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight size={14} className="text-gray-400" />
                        <span>
                          {STATUS_LABELS[to as keyof typeof STATUS_LABELS] ||
                            to}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveTransition(from, to)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {editingFrom === from ? (
                    <div className="flex gap-2 items-center bg-white p-2 rounded border border-blue-200 animate-fadeIn">
                      <select
                        className="text-xs p-1 border border-gray-300 rounded outline-none"
                        onChange={(e) => {
                          if (e.target.value)
                            handleAddTransition(from, e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          遷移先を選択...
                        </option>
                        {Object.keys(STATUS_LABELS)
                          .filter(
                            (s) =>
                              s !== from && !(workflow[from] || []).includes(s),
                          )
                          .map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s as keyof typeof STATUS_LABELS] ||
                                s}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => setEditingFrom(null)}
                        className="text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingFrom(from)}
                      className="flex items-center gap-1 text-xs font-bold text-primary mt-2 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <Plus size={12} /> 遷移を追加
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-white"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave(workflow)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-primaryHover"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
