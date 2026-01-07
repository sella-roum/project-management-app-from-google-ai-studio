import React from 'react';
import { Issue } from '../../types';
import { Avatar } from '../Common/Avatar';

interface Props {
  issues: Issue[];
}

export const ProjectTimeline: React.FC<Props> = ({ issues }) => {
  // Simplified Logic: Just show months and plot bars based on start/end dates mocked from created/updated + duration
  const months = ['Oct', 'Nov', 'Dec', 'Jan'];
  
  return (
    <div className="h-full bg-white overflow-auto pb-24">
      <div className="min-w-[800px] p-4">
        {/* Header */}
        <div className="flex border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-white z-20">
          <div className="w-1/4 font-semibold text-xs text-gray-500 uppercase">Epic / Issue</div>
          <div className="w-3/4 flex justify-between px-4">
             {months.map(m => <div key={m} className="text-xs font-medium text-gray-400 border-l border-gray-100 pl-2 flex-1">{m}</div>)}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-6">
          {issues.map((issue, idx) => {
             // Mock start/width for visual demo
             const startOffset = Math.floor(Math.random() * 40) + '%';
             const width = Math.max(10, Math.floor(Math.random() * 30)) + '%';
             const colorClass = issue.status === 'Done' ? 'bg-green-400' : 'bg-blue-500';

             return (
               <div key={issue.id} className="flex items-center group hover:bg-gray-50 py-1 -mx-2 px-2 rounded">
                 <div className="w-1/4 pr-4 flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-mono text-gray-400 shrink-0">{issue.key}</span>
                    <span className="text-sm text-gray-700 truncate">{issue.title}</span>
                 </div>
                 <div className="w-3/4 relative h-8 bg-gray-50 rounded border border-gray-100">
                    {/* Gantt Bar */}
                    <div 
                      className={`absolute top-1.5 h-5 rounded ${colorClass} shadow-sm opacity-80 group-hover:opacity-100 cursor-pointer transition-all`}
                      style={{ left: startOffset, width: width }}
                    >
                      <div className="absolute -right-7 top-0.5">
                        <Avatar userId={issue.assigneeId} size="sm" />
                      </div>
                    </div>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};
