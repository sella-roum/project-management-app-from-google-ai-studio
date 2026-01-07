import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import { BottomNav } from './components/Layout/BottomNav';
import { Sidebar } from './components/Layout/Sidebar';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectView } from './pages/ProjectView';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { IssueDrawer } from './pages/IssueDrawer';
import { CreateIssueModal } from './components/Modals/CreateIssueModal';
import { Issue, IssueStatus } from './types';
import { Menu, Plus } from 'lucide-react';

const TopBar = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button className="p-2 -ml-2 hover:bg-gray-100 rounded-full md:hidden">
          <Menu size={24} className="text-secondary" />
        </button>
        <span className="font-bold text-xl text-primary flex items-center gap-1">
          <span className="bg-primary text-white p-1 rounded">J</span> JiraMobile
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onCreate}
          className="hidden md:flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded font-medium hover:bg-primaryHover transition-colors text-sm"
        >
          <Plus size={16} /> 作成
        </button>
        <button 
          onClick={onCreate}
          className="md:hidden p-2 bg-primary text-white rounded-full hover:bg-primaryHover shadow-sm"
        >
           <Plus size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm ml-2">
           AE
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<IssueStatus | undefined>(undefined);
  const [createProjectId, setCreateProjectId] = useState<string | undefined>(undefined);

  const handleUpdateIssue = (updated: Issue) => {
    setSelectedIssue(updated);
  };

  const handleOpenCreateModal = (status?: IssueStatus, projectId?: string) => {
    setCreateStatus(status);
    setCreateProjectId(projectId);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateStatus(undefined);
    setCreateProjectId(undefined);
  };

  return (
    <div className="flex flex-col h-full bg-bgLight">
      <TopBar onCreate={() => handleOpenCreateModal()} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto no-scrollbar relative"> 
          <div className="h-full">
            <Routes>
              <Route element={<Outlet context={{ onOpenIssue: setSelectedIssue, openCreateModal: handleOpenCreateModal }} />}>
                <Route path="/" element={<Home onOpenIssue={setSelectedIssue} />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectView />} />
                <Route path="/search" element={<Search onOpenIssue={setSelectedIssue} />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </div>
        </main>
      </div>

      <BottomNav />
      
      {/* Global Issue Drawer */}
      {selectedIssue && (
        <IssueDrawer 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          onUpdate={handleUpdateIssue}
        />
      )}

      {/* Global Create Modal */}
      <CreateIssueModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal}
        preselectedStatus={createStatus}
        defaultProjectId={createProjectId}
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
