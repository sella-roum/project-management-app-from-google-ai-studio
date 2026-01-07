
import React from 'react';
import { Home, Search, FolderKanban, Bell, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, path, active }: { icon: any, label: string, path: string, active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center w-full py-2 space-y-1 ${active ? 'text-primary' : 'text-gray-500'}`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        <NavItem icon={Home} label="ホーム" path="/" active={currentPath === '/'} />
        <NavItem icon={LayoutDashboard} label="統計" path="/dashboards" active={currentPath === '/dashboards'} />
        <NavItem icon={FolderKanban} label="プロジェクト" path="/projects" active={currentPath.startsWith('/projects')} />
        <NavItem icon={Search} label="検索" path="/search" active={currentPath === '/search'} />
        <NavItem icon={Bell} label="通知" path="/notifications" active={currentPath === '/notifications'} />
      </div>
    </div>
  );
};
