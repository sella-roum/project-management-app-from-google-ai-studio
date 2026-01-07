import React, { useState } from 'react';
import { Issue, Sprint, Project } from '../../types';
import { IssueTypeIcon } from '../Common/IssueTypeIcon';
import { PriorityIcon } from '../Common/PriorityIcon';
import { Avatar } from '../Common/Avatar';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { STATUS_LABELS, createSprint } from '../../services/mockData';

interface Props {
  project: Project;
  issues: Issue[];
  sprints: Sprint[];
  onIssueClick: (issue: Issue) => void;
}

interface SprintSectionProps {
  sprint: Sprint;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

const SprintSection: React.FC<SprintSectionProps> = ({ sprint, issues, onIssueClick }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-6">
      <div 
        className="flex items-center justify-between bg-gray-50 p-3 rounded-t-lg border border-gray-200 cursor-pointer sticky top-0 z-10"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <div>
            <h3 className="font-semibold text-sm text-gray-800">{sprint.name}</h3>
            {sprint.goal && <p className="text-xs text-gray-500 truncate max-w-[200px]">{sprint.goal}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full font-mono text-gray-600">
             {issues.length} 件
          </span>
          <MoreHorizontal size={16} className="text-gray-400" />
        </div>
      </div>
      
      {expanded && (
        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg divide-y divide-gray-100">
          {issues.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm border-dashed border-2 border-gray-100 m-2 rounded">
              このスプリントには課題がありません。計画しましょう！
            </div>
          ) : (
            issues.map(issue => (
              <div 
                key={issue.id} 
                onClick={() => onIssueClick(issue)}
                className="flex items-center p-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer group"
              >
                <div className="mr-3">
                   <IssueTypeIcon type={issue.type} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium group-hover:underline">{issue.key}</span>
                      <span className="text-sm text-gray-800 truncate">{issue.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block
                      ${issue.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[issue.status]}
                   </span>
                   {issue.storyPoints !== undefined && (
                     <span className="text-xs bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full font-semibold">
                       {issue.storyPoints}
                     </span>
                   )}
                   <PriorityIcon priority={issue.priority} />
                   <Avatar userId={issue.assigneeId} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const ProjectBacklog: React.FC<Props> = ({ project, issues, sprints, onIssueClick }) => {
  // Force update to reflect new sprints (simple mock behavior)
  const [_, setForceUpdate] = useState(0);
  
  const activeSprints = sprints.filter(s => s.status === 'active');
  const futureSprints = sprints.filter(s => s.status === 'future' && !s.name.includes('バックログ') && !s.name.includes('Backlog'));
  const backlogContainer = sprints.find(s => s.name.includes('バックログ') || s.name.includes('Backlog')) || { id: 'backlog', name: 'バックログ', status: 'future' } as Sprint;

  const handleCreateSprint = () => {
    createSprint(project.id);
    setForceUpdate(prev => prev + 1); // Trigger re-render to show new sprint
  };

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleCreateSprint}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1"
        >
          <Plus size={16} /> スプリントを作成
        </button>
      </div>

      {activeSprints.map(sprint => (
        <SprintSection 
            key={sprint.id} 
            sprint={sprint} 
            issues={issues.filter(i => i.sprintId === sprint.id)} 
            onIssueClick={onIssueClick}
        />
      ))}
      
      {futureSprints.map(sprint => (
        <SprintSection 
            key={sprint.id} 
            sprint={sprint} 
            issues={issues.filter(i => i.sprintId === sprint.id)} 
            onIssueClick={onIssueClick}
        />
      ))}

      <SprintSection 
        sprint={backlogContainer} 
        issues={issues.filter(i => !i.sprintId || i.sprintId === backlogContainer.id)} 
        onIssueClick={onIssueClick}
      />
    </div>
  );
};
