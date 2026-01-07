import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { BottomNav } from './components/Layout/BottomNav';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectView } from './pages/ProjectView';
import { IssueDrawer } from './pages/IssueDrawer';
import { Issue } from './types';
import { updateIssueStatus } from './services/mockData';
import { Search, Bell, Menu } from 'lucide-react';

const TopBar = () => {
  return (
    <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button className="p-2 -ml-2 hover:bg-gray-100 rounded-full md:hidden">
          <Menu size={24} className="text-secondary" />
        </button>
        <span className="font-bold text-xl text-primary flex items-center gap-1">
          <span className="bg-primary text-white p-1 rounded">J</span> JiraMobile
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
           <Search size={20} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 relative">
           <Bell size={20} />
           <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
           AE
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const handleUpdateIssue = (updated: Issue) => {
    // Force re-render logic typically handled by context/store. 
    // Here we just update local state if the drawer is open.
    setSelectedIssue(updated);
  };

  return (
    <div className="flex flex-col h-full bg-bgLight">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar md:pr-[280px]"> 
        {/* On Desktop, sidebar would be here or content would assume width */}
        <div className="h-full">
          <Routes>
            <Route path="/" element={<Home onOpenIssue={setSelectedIssue} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectView onOpenIssue={setSelectedIssue} />} />
            <Route path="/search" element={<div className="p-8 text-center text-gray-500">Search not implemented yet</div>} />
            <Route path="/notifications" element={<div className="p-8 text-center text-gray-500">No new notifications</div>} />
            <Route path="/profile" element={<div className="p-8 text-center text-gray-500">Profile Settings</div>} />
          </Routes>
        </div>
      </main>

      <BottomNav />
      
      {/* Global Issue Drawer */}
      {selectedIssue && (
        <IssueDrawer 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
          onUpdate={handleUpdateIssue}
        />
      )}
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
