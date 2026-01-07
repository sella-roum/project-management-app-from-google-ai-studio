import React, { useState } from 'react';
import { Project } from '../../types';
import { updateProject, CATEGORY_LABELS } from '../../services/mockData';
import { Save } from 'lucide-react';

interface Props {
  project: Project;
}

export const ProjectSettings: React.FC<Props> = ({ project }) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [category, setCategory] = useState(project.category);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(project.id, { name, description, category });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-6">プロジェクト詳細</h2>
      
      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">名前</label>
           <input 
             type="text" 
             value={name}
             onChange={(e) => setName(e.target.value)}
             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
             required
           />
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">キー</label>
           <input 
             type="text" 
             value={project.key}
             disabled
             className="w-full p-2 border border-gray-200 bg-gray-50 rounded text-gray-500 cursor-not-allowed"
           />
           <p className="text-xs text-gray-400 mt-1">プロジェクトキーは変更できません。</p>
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">カテゴリ</label>
           <select 
             value={category}
             onChange={(e) => setCategory(e.target.value as any)}
             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
           >
             {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
               <option key={key} value={key}>{label}</option>
             ))}
           </select>
        </div>

        <div>
           <label className="block text-sm font-semibold text-gray-700 mb-1">説明</label>
           <textarea 
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             rows={4}
             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none"
           />
        </div>

        <div className="pt-2 flex items-center justify-between">
           <button 
             type="submit"
             className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primaryHover transition-colors"
           >
             <Save size={18} />
             変更を保存
           </button>
           {isSaved && <span className="text-green-600 text-sm font-medium animate-fadeIn">保存しました！</span>}
        </div>
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-red-600 font-bold mb-2">危険な領域</h3>
        <p className="text-sm text-gray-500 mb-4">プロジェクトをゴミ箱へ移動します。</p>
        <button type="button" className="text-red-600 border border-red-200 bg-red-50 px-4 py-2 rounded text-sm font-medium hover:bg-red-100">
           プロジェクトを削除
        </button>
      </div>
    </div>
  );
};
