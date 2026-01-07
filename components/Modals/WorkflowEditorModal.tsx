import React from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';
import { WORKFLOW_TRANSITIONS, STATUS_LABELS } from '../../services/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const WorkflowEditorModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">ワークフローエディタ</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-700 mb-4">
              現在のバージョンでは、ワークフローの遷移ルールは読み取り専用です。
           </div>
           
           <div className="space-y-6">
             {Object.entries(WORKFLOW_TRANSITIONS).map(([from, toList]) => (
                <div key={from} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="font-bold text-gray-800">{STATUS_LABELS[from as keyof typeof STATUS_LABELS]}</span>
                   </div>
                   <div className="space-y-2 pl-4 border-l-2 border-gray-200 ml-1.5">
                      {(toList as string[]).map(to => (
                        <div key={to} className="flex items-center gap-2 text-sm text-gray-600">
                           <ArrowRight size={14} className="text-gray-400"/>
                           <span>{STATUS_LABELS[to as keyof typeof STATUS_LABELS]}</span>
                        </div>
                      ))}
                      <button className="flex items-center gap-1 text-xs font-bold text-primary mt-2">
                         <Plus size={12}/> 遷移を追加
                      </button>
                   </div>
                </div>
             ))}
           </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
           <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-500">キャンセル</button>
           <button onClick={onSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg">保存</button>
        </div>
      </div>
    </div>
  );
};