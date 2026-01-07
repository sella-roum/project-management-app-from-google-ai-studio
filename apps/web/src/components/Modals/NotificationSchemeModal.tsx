import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { DEFAULT_NOTIFICATION_SCHEME } from "../../services/mockData";

interface Props {
  isOpen: boolean;
  currentScheme: Record<string, string[]>;
  onClose: () => void;
  onSave: (scheme: Record<string, string[]>) => void;
}

const EVENTS = [
  { id: "issue_created", label: "課題の作成" },
  { id: "issue_updated", label: "課題の更新" },
  { id: "issue_assigned", label: "課題の割り当て" },
  { id: "comment_added", label: "コメント投稿" },
  { id: "issue_resolved", label: "課題の解決" },
];

const RECIPIENTS = ["Reporter", "Assignee", "Watcher"];

export const NotificationSchemeModal: React.FC<Props> = ({
  isOpen,
  currentScheme,
  onClose,
  onSave,
}) => {
  const [scheme, setScheme] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      // Merge current scheme with defaults to ensure all keys exist
      setScheme({ ...DEFAULT_NOTIFICATION_SCHEME, ...currentScheme });
    }
  }, [isOpen, currentScheme]);

  if (!isOpen) return null;

  const toggleRecipient = (eventId: string, recipient: string) => {
    setScheme((prev) => {
      const current = prev[eventId] || [];
      if (current.includes(recipient)) {
        return { ...prev, [eventId]: current.filter((r) => r !== recipient) };
      } else {
        return { ...prev, [eventId]: [...current, recipient] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800">通知スキーム編集</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-4">
            {EVENTS.map((event) => (
              <div
                key={event.id}
                className="py-3 border-b border-gray-50 last:border-0"
              >
                <div className="font-bold text-gray-800 text-sm mb-3">
                  {event.label}
                </div>
                <div className="flex gap-3">
                  {RECIPIENTS.map((r) => {
                    const isSelected = (scheme[event.id] || []).includes(r);
                    return (
                      <button
                        key={r}
                        onClick={() => toggleRecipient(event.id, r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isSelected ? "bg-blue-50 text-primary border-primary" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {r === "Reporter"
                          ? "報告者"
                          : r === "Assignee"
                            ? "担当者"
                            : "ウォッチャー"}
                      </button>
                    );
                  })}
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
            onClick={() => onSave(scheme)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-primaryHover"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
