
import React, { useState } from 'react';
import { Project } from '../../types';
import { updateProject, deleteProject, CATEGORY_LABELS, WORKFLOW_TRANSITIONS, STATUS_LABELS } from '../../services/mockData';
import { Save, Shield, Workflow, Bell, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  project: Project;
}

export const ProjectSettings: React.FC<Props> = ({ project }) => {
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'workflow' | 'permissions' | 'notifications'>('details');
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [category, setCategory] = useState(project.category);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(project.id, { name, description, category });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm(`本当にプロジェクト「${project.name}」を削除しますか？この操作は取り消せません。`)) {
      await deleteProject(project.id);
      navigate('/');
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
         {[
           {id: 'details', label: '詳細', icon: Info},
           {id: 'workflow', label: 'ワークフロー', icon: Workflow},
           {id: 'permissions', label: '権限', icon: Shield},
           {id: 'notifications', label: '通知', icon: Bell}
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveSubTab(tab.id as any)}
             className={`pb-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-all ${activeSubTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}
           >
             <tab.icon size={14} />
             {tab.label}
           </button>
         ))}
      </div>

      {activeSubTab === 'details' && (
        <div className="space-y-6 animate-fadeIn">
          <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">名前</label>
               <input 
                 type="text" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
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
            </div>

            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">カテゴリ</label>
               <select 
                 value={category}
                 onChange={(e) => setCategory(e.target.value as any)}
                 className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
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
                 className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none"
               />
            </div>

            <div className="pt-2 flex items-center justify-between">
               <button type="submit" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primaryHover transition-colors">
                 <Save size={18} /> 変更を保存
               </button>
               {isSaved && <span className="text-green-600 text-sm font-medium animate-fadeIn">保存しました！</span>}
            </div>
          </form>

          <div className="border border-red-100 bg-red-50 p-6 rounded-lg">
            <h3 className="text-red-600 font-bold mb-2">プロジェクトの削除</h3>
            <p className="text-sm text-red-500 mb-4 opacity-80">すべての課題、スプリント、リリースが永久に削除されます。</p>
            <button onClick={handleDelete} className="text-white bg-red-600 px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-red-700">
               プロジェクトを削除
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'workflow' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-gray-800">ステータスマッピング</h3>
          <div className="space-y-4">
            {Object.entries(WORKFLOW_TRANSITIONS).map(([status, nextStatuses]) => (
              <div key={status} className="flex gap-4 items-center">
                 <div className="w-32 p-2 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center">{STATUS_LABELS[status as any]}</div>
                 <div className="text-gray-400">→</div>
                 <div className="flex-1 flex flex-wrap gap-2">
                    {/* Fix: Cast nextStatuses to any[] to ensure .map is available */}
                    {(nextStatuses as any[]).map(ns => (
                      <span key={ns} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold">
                        {STATUS_LABELS[ns as any]}
                      </span>
                    ))}
                 </div>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
             <button className="text-xs font-bold text-primary hover:underline">エディタでワークフローを編集</button>
          </div>
        </div>
      )}

      {activeSubTab === 'permissions' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-4 py-3 font-bold text-gray-600">権限</th>
                    <th className="px-4 py-3 font-bold text-gray-600">プロジェクトロール</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {[
                   {p: 'プロジェクトの参照', r: '管理者、メンバー、閲覧者'},
                   {p: '課題の作成', r: '管理者、メンバー'},
                   {p: 'スプリントの管理', r: '管理者'},
                   {p: '課題の削除', r: '管理者'}
                 ].map((row, i) => (
                   <tr key={i}>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.p}</td>
                      <td className="px-4 py-3 text-gray-500">{row.r}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
      
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-fadeIn">
           <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
              <Info size={16} />
              <p className="text-xs font-medium">通知スキームは、どのイベントが誰に送信されるかを制御します。</p>
           </div>
           <div className="space-y-4">
              {[
                {e: '課題が作成されたとき', r: '報告者、担当者、ウォッチャー'},
                {e: '課題が更新されたとき', r: '担当者、ウォッチャー'},
                {e: 'コメントが投稿されたとき', r: 'すべての関与ユーザー'}
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                   <div>
                      <div className="font-bold text-gray-800 text-sm">{row.e}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{row.r}</div>
                   </div>
                   <button className="text-[10px] font-bold text-primary">編集</button>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
