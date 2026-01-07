import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, getIssues, getSprints } from '../services/mockData';
import { ProjectSummary } from '../components/Project/ProjectSummary';
import { ProjectBoard } from '../components/Project/ProjectBoard';
import { ProjectBacklog } from '../components/Project/ProjectBacklog';
import { ProjectTimeline } from '../components/Project/ProjectTimeline';
import { LayoutDashboard, Kanban, ListTodo, CalendarClock, Settings } from 'lucide-react';
import { Issue } from '../types';

type Tab = 'summary' | 'board' | 'backlog' | 'timeline' | 'settings';

export const ProjectView = ({ onOpenIssue }: { onOpenIssue: (i: Issue) => void }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const project = getProjectById(projectId || '');
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const issues = getIssues(project.id);
  const sprints = getSprints(project.id);

  // Filter issues for Board: Only active sprint or items on the board
  // In a real app, this logic is complex (board query). Here, we just show all non-done, or everything.
  // For standard Agile: Board usually shows active sprints.
  // For Kanban: Shows everything.
  const boardIssues = project.type === 'Scrum' 
    ? issues.filter(i => sprints.find(s => s.id === i.sprintId)?.status === 'active')
    : issues;

  const renderTab = () => {
    switch(activeTab) {
      case 'summary': return <ProjectSummary project={project} issues={issues} />;
      case 'board': return <ProjectBoard issues={boardIssues} onIssueClick={onOpenIssue} />;
      case 'backlog': return <ProjectBacklog issues={issues} sprints={sprints} onIssueClick={onOpenIssue} />;
      case 'timeline': return <ProjectTimeline issues={issues} />;
      default: return <div className="p-4">Settings Placeholder</div>;
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
        activeTab === id 
        ? 'border-primary text-primary font-medium' 
        : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-xl text-white shadow">
             {project.iconUrl}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
            <p className="text-xs text-gray-500">{project.type} Project</p>
          </div>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 -mb-[1px]">
          <TabButton id="summary" icon={LayoutDashboard} label="Summary" />
          <TabButton id="board" icon={Kanban} label="Board" />
          {project.type === 'Scrum' && <TabButton id="backlog" icon={ListTodo} label="Backlog" />}
          <TabButton id="timeline" icon={CalendarClock} label="Timeline" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-bgLight">
         {renderTab()}
      </div>
    </div>
  );
};
