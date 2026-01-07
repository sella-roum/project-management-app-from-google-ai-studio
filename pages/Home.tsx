import React from 'react';
import { getCurrentUser, getIssuesForUser, updateIssueStatus } from '../services/mockData';
import { IssueCard } from '../components/Common/IssueCard';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';

export const Home = ({ onOpenIssue }: { onOpenIssue: (i: Issue) => void }) => {
  const user = getCurrentUser();
  const myIssues = getIssuesForUser(user?.id || '');
  const navigate = useNavigate();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary">{greeting()}, {user?.name.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">Here's what's on your plate today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-800">{myIssues.length}</div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Assigned</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-danger">
              {myIssues.filter(i => i.priority === 'Highest' || i.priority === 'High').length}
            </div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">High Prio</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Mentions</div>
         </div>
      </div>

      {/* Assigned to me */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Assigned to Me</h2>
          <button className="text-sm text-primary font-medium hover:underline">View all</button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {myIssues.length > 0 ? myIssues.map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onClick={() => onOpenIssue(issue)}
            />
          )) : (
            <div className="text-center py-10 bg-white rounded border border-gray-200 text-gray-500">
               No work assigned. Enjoy your coffee! ☕
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects (Shortcuts) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Recent Projects</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           {['WEB', 'MOB', 'MKT'].map(key => (
             <div key={key} onClick={() => navigate('/projects/p1')} className="min-w-[140px] h-[100px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-4 flex flex-col justify-between text-white shadow hover:shadow-lg transition-shadow cursor-pointer">
                <span className="font-bold text-xl opacity-90">{key}</span>
                <span className="text-xs opacity-75">Software Project</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
