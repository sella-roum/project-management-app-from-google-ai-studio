import React, { useState } from "react";
import { X } from "lucide-react";
import { CATEGORY_LABELS } from "@repo/core";
import { createProject } from "../../services/mockData";
import { Project } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState<"Scrum" | "Kanban">("Kanban");
  const [category, setCategory] = useState<"Software" | "Business">("Software");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !key || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newProject = await createProject({
        name,
        key: key.toUpperCase(),
        type,
        category,
        description,
        iconUrl: type === "Scrum" ? "🚀" : "📋",
      });

      onCreated(newProject);

      // Reset
      setName("");
      setKey("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create project", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl relative z-10 animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            プロジェクトを作成
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              プロジェクト名 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Simple auto-key generation
                if (!key) setKey(e.target.value.substring(0, 4).toUpperCase());
              }}
              className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              キー *
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                テンプレート
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="Kanban">カンバン</option>
                <option value="Scrum">スクラム</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name || !key || isSubmitting}
              className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primaryHover disabled:opacity-50"
            >
              {isSubmitting ? "作成中..." : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
