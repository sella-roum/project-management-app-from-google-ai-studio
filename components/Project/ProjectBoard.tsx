import React from 'react';
import { Issue, IssueStatus } from '../../types';
import { IssueCard } from '../Common/IssueCard';
import { Plus } from 'lucide-react';
import { STATUS_LABELS } from '../../services/mockData';

interface Props {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onCreateIssue?: (status: IssueStatus) => void;
}

interface ColumnProps {
  title: string;
  status: IssueStatus;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onCreateIssue?: (status: IssueStatus) => void;
}

const Column: React.FC<ColumnProps> = ({ title, status, issues, onIssueClick, onCreateIssue }) => {
  return (
    <div className="min-w-[280px] w-[85vw] md:w-[320px] flex flex-col h-full max-h-full bg-gray-100 rounded-lg mx-2 first:ml-4 last:mr-4">
      <div className="p-3 font-semibold text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center sticky top-0 bg-gray-100 z-10 rounded-t-lg">
        {title} <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{issues.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} onClick={() => onIssueClick(issue)} />
        ))}
        <button 
          onClick={() => onCreateIssue && onCreateIssue(status)}
          className="w-full py-2 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded text-sm transition-colors"
        >
            <Plus size={16} className="mr-1"/> 作成
        </button>
      </div>
    </div>
  );
};

export const ProjectBoard: React.FC<Props> = ({ issues, onIssueClick, onCreateIssue }) => {
  const columns: { title: string, status: IssueStatus }[] = [
    { title: STATUS_LABELS['To Do'], status: 'To Do' },
    { title: STATUS_LABELS['In Progress'], status: 'In Progress' },
    { title: STATUS_LABELS['In Review'], status: 'In Review' },
    { title: STATUS_LABELS['Done'], status: 'Done' },
  ];

  return (
    <div className="flex h-full overflow-x-auto pb-20 pt-4 bg-white md:bg-transparent">
      {columns.map(col => (
        <Column 
          key={col.status} 
          title={col.title} 
          status={col.status} 
          issues={issues.filter(i => i.status === col.status)}
          onIssueClick={onIssueClick}
          onCreateIssue={onCreateIssue}
        />
      ))}
    </div>
  );
};
