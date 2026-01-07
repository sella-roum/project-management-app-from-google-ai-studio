
import React from 'react';
import { Home, Search, FolderKanban, Bell, User, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, path, active }: { icon: any, label: string, path: string, active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`flex items-center w-full px-6 py-3 gap-3 transition-colors ${active ? 'text-primary bg-blue-50 border-r-4 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full pt-4 shrink-0">
      <div className="space-y-1">
        <SidebarItem icon={Home} label="ホーム" path="/" active={currentPath === '/'} />
        <SidebarItem icon={LayoutDashboard} label="ダッシュボード" path="/dashboards" active={currentPath === '/dashboards'} />
        <SidebarItem icon={FolderKanban} label="プロジェクト" path="/projects" active={currentPath.startsWith('/projects')} />
        <SidebarItem icon={Search} label="検索" path="/search" active={currentPath === '/search'} />
        <SidebarItem icon={Bell} label="通知" path="/notifications" active={currentPath === '/notifications'} />
        <SidebarItem icon={User} label="マイページ" path="/profile" active={currentPath === '/profile'} />
      </div>
    </div>
  );
};
