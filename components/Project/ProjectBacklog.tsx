import React, { useState } from 'react';
import { Issue, Sprint } from '../../types';
import { IssueTypeIcon } from '../Common/IssueTypeIcon';
import { PriorityIcon } from '../Common/PriorityIcon';
import { Avatar } from '../Common/Avatar';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';

interface Props {
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
             {issues.length} issues
          </span>
          <MoreHorizontal size={16} className="text-gray-400" />
        </div>
      </div>
      
      {expanded && (
        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg divide-y divide-gray-100">
          {issues.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm border-dashed border-2 border-gray-100 m-2 rounded">
              No issues in this sprint. Plan something!
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
                      {issue.status}
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

export const ProjectBacklog: React.FC<Props> = ({ issues, sprints, onIssueClick }) => {
  const activeSprints = sprints.filter(s => s.status === 'active');
  const futureSprints = sprints.filter(s => s.status === 'future' && !s.name.includes('Backlog'));
  const backlogContainer = sprints.find(s => s.name.includes('Backlog')) || { id: 'backlog', name: 'Backlog', status: 'future' } as Sprint;

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
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