import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const NotificationSchemeModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">通知スキーム編集</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
           <div className="space-y-4">
              {[
                {event: '課題の作成', recipients: ['報告者', '担当者', 'ウォッチャー']},
                {event: '課題の更新', recipients: ['担当者', 'ウォッチャー']},
                {event: '課題の割り当て', recipients: ['担当者']},
                {event: 'コメント追加', recipients: ['全関与者']},
                {event: '課題の解決', recipients: ['報告者', '担当者', 'ウォッチャー']},
              ].map((rule, i) => (
                <div key={i} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
                   <div>
                      <div className="font-bold text-gray-800 text-sm">{rule.event}</div>
                   </div>
                   <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                      {rule.recipients.map(r => (
                        <span key={r} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{r}</span>
                      ))}
                      <button className="text-[10px] bg-blue-50 text-primary px-2 py-0.5 rounded-full font-bold hover:bg-blue-100">+</button>
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