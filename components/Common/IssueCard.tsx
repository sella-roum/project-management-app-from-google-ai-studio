import React from 'react';
import { Issue } from '../../types';
import { IssueTypeIcon } from './IssueTypeIcon';
import { PriorityIcon } from './PriorityIcon';
import { Avatar } from './Avatar';

interface Props {
  issue: Issue;
  onClick?: () => void;
  compact?: boolean;
}

export const IssueCard: React.FC<Props> = ({ issue, onClick, compact }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-semibold text-gray-500 hover:underline">{issue.key}</span>
        {compact ? null : <Avatar userId={issue.assigneeId} size="sm" />}
      </div>
      
      <div className="flex items-start gap-2 mb-2">
        <div className="mt-1 flex-shrink-0">
          <IssueTypeIcon type={issue.type} />
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{issue.title}</p>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
           <PriorityIcon priority={issue.priority} />
           {issue.storyPoints !== undefined && (
             <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600 font-semibold">{issue.storyPoints}</span>
           )}
        </div>
        {compact && <Avatar userId={issue.assigneeId} size="sm" />}
        {!compact && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
            ${issue.status === 'Done' ? 'bg-green-100 text-green-800' : 
              issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-700'}`}>
            {issue.status}
        </span>}
      </div>
    </div>
  );
};
