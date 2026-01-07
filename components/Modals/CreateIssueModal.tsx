import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PROJECTS, createIssue, USERS, TYPE_LABELS, PRIORITY_LABELS } from '../../services/mockData';
import { IssuePriority, IssueType, IssueStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedStatus?: IssueStatus;
  defaultProjectId?: string;
}

export const CreateIssueModal: React.FC<Props> = ({ isOpen, onClose, preselectedStatus, defaultProjectId }) => {
  const [projectId, setProjectId] = useState(defaultProjectId || PROJECTS[0]?.id || '');
  const [type, setType] = useState<IssueType>('Story');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [assigneeId, setAssigneeId] = useState('');

  // Update projectId when defaultProjectId changes
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    createIssue({
      projectId,
      type,
      title,
      description,
      priority,
      assigneeId: assigneeId || undefined,
      status: preselectedStatus || 'To Do'
    });

    // Reset and close
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white w-full md:w-[600px] md:rounded-lg rounded-t-xl h-[85vh] md:h-auto flex flex-col pointer-events-auto animate-slideUp md:animate-fadeIn shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">課題を作成</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">プロジェクト</label>
            <select 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.iconUrl} {p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">課題タイプ</label>
            <div className="flex gap-2">
              {(['Story', 'Task', 'Bug', 'Epic'] as IssueType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded text-sm font-medium border ${type === t ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">要約 (タイトル) *</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="何を完了する必要がありますか？"
              className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">説明</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="詳細をここに入力..."
              rows={4}
              className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">優先度</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">担当者</label>
              <select 
                value={assigneeId} 
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">未割り当て</option>
                {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded">
            キャンセル
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!title}
            className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
};
