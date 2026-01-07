import React from 'react';
import { getCurrentUser } from '../services/mockData';
import { LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight } from 'lucide-react';

export const Profile = () => {
  const user = getCurrentUser();

  const MenuItem = ({ icon: Icon, label, danger = false }: { icon: any, label: string, danger?: boolean }) => (
    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <Icon size={20} className={danger ? "text-red-500" : "text-gray-500"} />
        <span className={`text-sm font-medium ${danger ? "text-red-600" : "text-gray-700"}`}>{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </button>
  );

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-bold text-secondary mb-8">マイページ</h1>

      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col items-center mb-6">
         <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-50" />
         <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
         <p className="text-gray-500 text-sm">senior.engineer@example.com</p>
         <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            プロフィールを編集
         </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <MenuItem icon={Settings} label="アカウント設定" />
        <MenuItem icon={Bell} label="通知設定" />
        <MenuItem icon={Shield} label="プライバシーとセキュリティ" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <MenuItem icon={HelpCircle} label="ヘルプとフィードバック" />
        <MenuItem icon={LogOut} label="ログアウト" danger />
      </div>
      
      <p className="text-center text-xs text-gray-400">
        JiraMobile Clone v1.0.0
      </p>
    </div>
  );
};
