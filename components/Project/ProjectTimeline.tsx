import React from 'react';
import { Issue } from '../../types';
import { Avatar } from '../Common/Avatar';
import { Calendar } from 'lucide-react';

interface Props {
  issues: Issue[];
}

export const ProjectTimeline: React.FC<Props> = ({ issues }) => {
  // Determine timeline range based on current date
  const now = new Date();
  const startOfTimeline = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfTimeline = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Approx 3 months view
  const totalDays = (endOfTimeline.getTime() - startOfTimeline.getTime()) / (1000 * 60 * 60 * 24);

  const months: string[] = [];
  let current = new Date(startOfTimeline);
  while (current <= endOfTimeline) {
    months.push(`${current.getMonth() + 1}月`);
    current.setMonth(current.getMonth() + 1);
  }

  const getPosition = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const diffTime = date.getTime() - startOfTimeline.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return (diffDays / totalDays) * 100;
  };

  return (
    <div className="h-full bg-white overflow-auto pb-24">
      <div className="min-w-[800px] p-4">
        {/* Header */}
        <div className="flex border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-white z-20">
          <div className="w-1/4 font-semibold text-xs text-gray-500 uppercase">エピック / 課題</div>
          <div className="w-3/4 flex justify-between px-4">
             {months.map((m, i) => (
               <div key={i} className="text-xs font-medium text-gray-400 border-l border-gray-100 pl-2 flex-1">
                 {m}
               </div>
             ))}
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-4">
          {issues.map((issue) => {
             // Calculate positions
             let startPercent = getPosition(issue.createdAt);
             let endPercent = getPosition(issue.dueDate);
             
             // Defaults if outside range or missing
             if (startPercent === null) startPercent = 0;
             if (endPercent === null) {
               // Default duration 7 days if no due date
               endPercent = startPercent + (7 / totalDays) * 100; 
             }
             
             // Clamp values for display
             if (startPercent < 0) startPercent = 0;
             if (endPercent > 100) endPercent = 100;
             let widthPercent = endPercent - startPercent;
             if (widthPercent < 2) widthPercent = 2; // Min width

             const colorClass = issue.status === 'Done' ? 'bg-green-400' : 
                                issue.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400';

             return (
               <div key={issue.id} className="flex items-center group hover:bg-gray-50 py-1 -mx-2 px-2 rounded">
                 <div className="w-1/4 pr-4 flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-mono text-gray-400 shrink-0">{issue.key}</span>
                    <span className="text-sm text-gray-700 truncate">{issue.title}</span>
                 </div>
                 <div className="w-3/4 relative h-8 bg-gray-50 rounded border border-gray-100 overflow-hidden">
                    {/* Gantt Bar */}
                    <div 
                      className={`absolute top-1.5 h-5 rounded ${colorClass} shadow-sm opacity-80 group-hover:opacity-100 cursor-pointer transition-all flex items-center px-2`}
                      style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                    >
                      {widthPercent > 10 && (
                         <span className="text-[10px] text-white truncate w-full block">{issue.title}</span>
                      )}
                    </div>
                    {/* Assignee Avatar (Floating) */}
                    <div className="absolute top-1.5 pointer-events-none" style={{ left: `${endPercent}%`, transform: 'translateX(4px)' }}>
                         <Avatar userId={issue.assigneeId} size="sm" />
                    </div>
                 </div>
               </div>
             );
          })}
        </div>
        
        {issues.length === 0 && (
          <div className="text-center py-12 text-gray-400">
             <Calendar size={48} className="mx-auto mb-4 opacity-20" />
             <p>表示するタイムラインデータがありません。</p>
          </div>
        )}
      </div>
    </div>
  );
};
