import React, { useState } from 'react';
import { Issue, IssueStatus } from '../types';
import { X, Share2, MoreHorizontal, Calendar, Tag, ChevronDown, MessageSquare, Send } from 'lucide-react';
import { IssueTypeIcon } from '../components/Common/IssueTypeIcon';
import { PriorityIcon } from '../components/Common/PriorityIcon';
import { Avatar } from '../components/Common/Avatar';
import { updateIssueStatus, USERS } from '../services/mockData';

interface Props {
  issue: Issue | null;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
}

export const IssueDrawer: React.FC<Props> = ({ issue, onClose, onUpdate }) => {
  const [commentText, setCommentText] = useState('');
  
  if (!issue) return null;

  const handleStatusChange = () => {
    // Simple toggle for demo
    const nextStatus: Record<IssueStatus, IssueStatus> = {
      'To Do': 'In Progress',
      'In Progress': 'In Review',
      'In Review': 'Done',
      'Done': 'To Do'
    };
    const newStatus = nextStatus[issue.status];
    const updated = updateIssueStatus(issue.id, newStatus);
    if(updated) onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer Content */}
      <div className="relative w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slideInRight">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-2 text-gray-500">
             <IssueTypeIcon type={issue.type} />
             <span className="text-sm font-semibold">{issue.key}</span>
           </div>
           <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-gray-800"><Share2 size={20} /></button>
              <button className="text-gray-500 hover:text-gray-800"><MoreHorizontal size={20} /></button>
              <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
           </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Title */}
           <h1 className="text-2xl font-bold text-gray-900 leading-tight">{issue.title}</h1>

           {/* Actions Bar */}
           <div className="flex flex-wrap gap-3">
             <button 
                onClick={handleStatusChange}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-sm text-gray-700 transition-colors uppercase tracking-wide">
                <span>{issue.status}</span>
                <ChevronDown size={14} />
             </button>
             <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-700">
                <Share2 size={16}/> Share
             </button>
           </div>

           {/* Description */}
           <div className="space-y-2">
             <h3 className="text-sm font-bold text-gray-900">Description</h3>
             <div className="prose prose-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 min-h-[100px]">
               {issue.description || "No description provided."}
             </div>
           </div>

           {/* Fields Grid */}
           <div className="bg-white rounded border border-gray-200">
             <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-gray-200">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Assignee</span>
                    <div className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded cursor-pointer">
                      <Avatar userId={issue.assigneeId} size="sm" showName />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Reporter</span>
                    <div className="flex items-center gap-2">
                       <Avatar userId={issue.reporterId} size="sm" showName />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Priority</span>
                    <div className="flex items-center gap-2 text-sm font-medium">
                       <PriorityIcon priority={issue.priority} /> {issue.priority}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                   <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Story Points</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-bold">{issue.storyPoints || '-'}</span>
                  </div>
                   <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Labels</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {issue.labels.length > 0 ? issue.labels.map(l => (
                        <span key={l} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{l}</span>
                      )) : <span className="text-gray-400 text-sm">None</span>}
                    </div>
                  </div>
                   <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Due Date</span>
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      {issue.dueDate ? issue.dueDate : 'None'}
                    </span>
                  </div>
                </div>
             </div>
           </div>

           {/* Activity / Comments */}
           <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Activity</h3>
                <div className="flex gap-2">
                   <button className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-700">Comments</button>
                   <button className="text-xs text-gray-500 px-2 py-1">History</button>
                </div>
              </div>
              
              {/* Fake Comment Input */}
              <div className="flex gap-3">
                 <Avatar userId="u1" size="md" />
                 <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                    <textarea 
                      placeholder="Add a comment..." 
                      className="w-full p-3 text-sm focus:outline-none resize-none"
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    {commentText && (
                      <div className="bg-gray-50 px-3 py-2 flex justify-end">
                        <button className="bg-primary text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-primaryHover">
                          Save
                        </button>
                      </div>
                    )}
                 </div>
              </div>

              {/* Sample Comments (Empty for now based on mock, just placeholders) */}
              <div className="space-y-4">
                 <div className="flex gap-3">
                   <Avatar userId="u2" size="sm" />
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">Bob Manager</span>
                        <span className="text-xs text-gray-500">2 days ago</span>
                      </div>
                      <p className="text-sm text-gray-800">Please prioritize this for the upcoming demo.</p>
                   </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
