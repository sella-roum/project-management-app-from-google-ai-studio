import React from 'react';
import { getCurrentUser, getIssuesForUser, getUnreadMentionCount, getProjects } from '../services/mockData';
import { IssueCard } from '../components/Common/IssueCard';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';

export const Home = ({ onOpenIssue }: { onOpenIssue: (i: Issue) => void }) => {
  const user = getCurrentUser();
  const myIssues = getIssuesForUser(user?.id || '');
  const unreadMentions = getUnreadMentionCount();
  const projects = getProjects().slice(0, 3); // Show top 3 projects
  const navigate = useNavigate();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary">{greeting()}, {user?.name.split(' ')[0]}さん</h1>
        <p className="text-gray-500 mt-1">今日のタスク状況です。</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-800">{myIssues.length}</div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">担当</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-danger">
              {myIssues.filter(i => i.priority === 'Highest' || i.priority === 'High').length}
            </div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">高優先度</div>
         </div>
         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-primary">{unreadMentions}</div>
            <div className="text-xs text-gray-500 uppercase font-semibold mt-1">メンション</div>
         </div>
      </div>

      {/* Assigned to me */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">自分への割り当て</h2>
          <button 
            onClick={() => navigate('/search', { state: { filter: 'assigned' } })}
            className="text-sm text-primary font-medium hover:underline"
          >
            すべて表示
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {myIssues.length > 0 ? myIssues.slice(0, 5).map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onClick={() => onOpenIssue(issue)}
            />
          )) : (
            <div className="text-center py-10 bg-white rounded border border-gray-200 text-gray-500">
               割り当てられた課題はありません。コーヒーでも飲みましょう！ ☕
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects (Shortcuts) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">最近のプロジェクト</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           {projects.map(p => (
             <div 
               key={p.id} 
               onClick={() => navigate(`/projects/${p.id}`)} 
               className="min-w-[140px] h-[100px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-4 flex flex-col justify-between text-white shadow hover:shadow-lg transition-shadow cursor-pointer shrink-0"
             >
                <span className="font-bold text-xl opacity-90">{p.key}</span>
                <span className="text-xs opacity-75 truncate">{p.name}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
