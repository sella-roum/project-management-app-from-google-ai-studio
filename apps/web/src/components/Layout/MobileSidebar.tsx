import React from "react";
import {
  Home,
  Search,
  FolderKanban,
  Bell,
  User,
  LayoutDashboard,
  X,
  HelpCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { SidebarItem } from "./Sidebar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<Props> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl animate-slideRight flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-bold text-xl text-primary flex items-center gap-1">
            <span className="bg-primary text-white p-1 rounded">J</span>{" "}
            JiraMobile
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          <SidebarItem
            icon={Home}
            label="ホーム"
            path="/"
            active={currentPath === "/"}
            onClick={onClose}
          />
          <SidebarItem
            icon={LayoutDashboard}
            label="ダッシュボード"
            path="/dashboards"
            active={currentPath === "/dashboards"}
            onClick={onClose}
          />
          <SidebarItem
            icon={FolderKanban}
            label="プロジェクト"
            path="/projects"
            active={currentPath.startsWith("/projects")}
            onClick={onClose}
          />
          <SidebarItem
            icon={Search}
            label="検索"
            path="/search"
            active={currentPath === "/search"}
            onClick={onClose}
          />
          <SidebarItem
            icon={Bell}
            label="通知"
            path="/notifications"
            active={currentPath === "/notifications"}
            onClick={onClose}
          />
          <SidebarItem
            icon={User}
            label="マイページ"
            path="/profile"
            active={currentPath === "/profile"}
            onClick={onClose}
          />

          <div className="border-t border-gray-100 my-2 pt-2">
            <SidebarItem
              icon={HelpCircle}
              label="ヘルプセンター"
              path="/help"
              active={currentPath === "/help"}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
