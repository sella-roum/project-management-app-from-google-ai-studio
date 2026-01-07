
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Outlet, Navigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components/Layout/BottomNav';
import { Sidebar } from './components/Layout/Sidebar';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectView } from './pages/ProjectView';
import { Search } from './pages/Search';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Dashboards } from './pages/Dashboards';
import { Login } from './pages/Login';
import { Welcome } from './pages/Welcome';
import { IssueDrawer } from './pages/IssueDrawer';
import { SetupWizard } from './components/Modals/SetupWizard';
import { CreateIssueModal } from './components/Modals/CreateIssueModal';
import { Issue, IssueStatus } from './types';
import { Menu, Plus, Search as SearchIcon } from 'lucide-react';

const TopBar = ({ onCreate }: { onCreate: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button className="p-2 -ml-2 hover:bg-gray-100 rounded-full md:hidden">
          <Menu size={24} className="text-secondary" />
        </button>
        <span onClick={() => navigate('/')} className="font-bold text-xl text-primary flex items-center gap-1 cursor-pointer">
          <span className="bg-primary text-white p-1 rounded">J</span> JiraMobile
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/search')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <SearchIcon size={20} />
        </button>
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
      </div>
    </div>
  );
};

// Check if app has been initialized (Welcome screen passed)
const InitCheck = () => {
  const initialized = localStorage.getItem('appInitialized') === 'true';
  return initialized ? <Outlet /> : <Navigate to="/welcome" />;
};

const PrivateRoute = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

const AppContent = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [createStatus, setCreateStatus] = useState<IssueStatus | undefined>(undefined);
  const [createProjectId, setCreateProjectId] = useState<string | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    // Check if we need to show setup wizard (only when logged in and on home/protected routes)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const hasSetup = localStorage.getItem('hasSetup') === 'true';
    if (isLoggedIn && !hasSetup && location.pathname !== '/welcome' && location.pathname !== '/login') {
      setShowSetup(true);
    }
  }, [location.pathname]);

  const handleOpenCreateModal = (status?: IssueStatus, projectId?: string) => {
    setCreateStatus(status);
    setCreateProjectId(projectId);
    setIsCreateModalOpen(true);
  };

  const handleSetupComplete = () => {
    localStorage.setItem('hasSetup', 'true');
    setShowSetup(false);
  };

  return (
    <div className="flex flex-col h-full bg-bgLight">
      {showSetup && <SetupWizard onComplete={handleSetupComplete} />}
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route element={<InitCheck />}>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={
              <div className="flex flex-col h-full">
                <TopBar onCreate={() => handleOpenCreateModal()} />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto no-scrollbar relative">
                     <Outlet context={{ onOpenIssue: setSelectedIssue, openCreateModal: handleOpenCreateModal }} />
                  </main>
                </div>
                <BottomNav />
              </div>
            }>
              <Route path="/" element={<Home onOpenIssue={setSelectedIssue} />} />
              <Route path="/dashboards" element={<Dashboards />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectView />} />
              <Route path="/search" element={<Search onOpenIssue={setSelectedIssue} />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      
      {selectedIssue && (
        <IssueDrawer 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          onUpdate={(updated) => setSelectedIssue(updated)}
        />
      )}

      <CreateIssueModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
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
