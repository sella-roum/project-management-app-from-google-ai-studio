
import React, { useState, useEffect } from 'react';
import { getCurrentUser, getIssuesForUser, getUnreadMentionCount, getCurrentUserId, updateIssueStatus, getRecentIssues } from '../services/mockData';
import { IssueCard } from '../components/Common/IssueCard';
import { IssueSkeleton } from '../components/Common/Skeleton';
import { useNavigate } from 'react-router-dom';
import { Issue, IssueStatus } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, CheckCircle, Clock, MoreVertical, Zap, RefreshCw, History, Check } from 'lucide-react';

export const Home = ({ onOpenIssue }: { onOpenIssue: (i: Issue) => void }) => {
  const user = useLiveQuery(() => getCurrentUser());
  const myIssues = useLiveQuery(() => getIssuesForUser(getCurrentUserId())) || [];
  const unreadMentions = useLiveQuery(() => getUnreadMentionCount()) || 0;
  const recentIssues = useLiveQuery(() => getRecentIssues()) || [];
  
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [quickActionIssue, setQuickActionIssue] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    await updateIssueStatus(issueId, status);
    setQuickActionIssue(null);
    setSwipedId(null);
  };

  if (!user && !loading) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary tracking-tight">
            {loading ? '読み込み中...' : `こんにちは、${user?.name.split(' ')[0]}さん`}
          </h1>
          <p className="text-gray-500 mt-1">今日のやるべきことはこちらです。</p>
        </div>
        <div className="flex items-center gap-2">
           <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
         {[
           { val: myIssues.length, label: '自分の課題' },
           { val: myIssues.filter(i => i.priority === 'Highest' || i.priority === 'High').length, label: '高優先度' },
           { val: unreadMentions, label: '未読通知' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
              {loading ? <div className="h-6 w-10 bg-gray-100 rounded mx-auto animate-pulse" /> : <div className="text-xl font-black text-secondary">{stat.val}</div>}
              <div className="text-[9px] text-gray-400 uppercase font-black mt-1 tracking-tighter">{stat.label}</div>
           </div>
         ))}
      </div>

      {recentIssues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
             <History size={14} /> 最近見た項目
          </h2>
          <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2 px-1">
            {recentIssues.map(issue => (
              <div key={issue.id} className="min-w-[200px] hover:scale-[1.02] transition-transform">
                <IssueCard issue={issue} onClick={() => onOpenIssue(issue)} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <Zap size={14} className="text-amber-500" /> あなたの作業
          </h2>
          <button onClick={() => navigate('/search', { state: { filter: 'assigned' } })} className="text-[10px] text-primary font-black uppercase">すべて</button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <IssueSkeleton key={i} />)
          ) : myIssues.length > 0 ? (
            myIssues.slice(0, 10).map(issue => (
              <div key={issue.id} className="relative group overflow-hidden rounded-xl">
                 {/* Swipe Action Background */}
                 <div className="absolute inset-0 bg-green-500 flex items-center justify-end px-6 text-white font-bold text-xs gap-2">
                    <Check size={20} /> 完了にする
                 </div>
                 
                 <div 
                   className={`relative bg-white transition-transform duration-300 ${swipedId === issue.id ? '-translate-x-full' : 'translate-x-0'}`}
                   onTouchStart={(e) => { (window as any)._startX = e.touches[0].clientX; }}
                   onTouchEnd={(e) => {
                      const diff = (window as any)._startX - e.changedTouches[0].clientX;
                      if (diff > 100) handleStatusChange(issue.id, 'Done');
                   }}
                 >
                    <IssueCard issue={issue} onClick={() => onOpenIssue(issue)} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setQuickActionIssue(quickActionIssue === issue.id ? null : issue.id); }}
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {quickActionIssue === issue.id && (
                      <div className="absolute top-12 right-2 bg-white border border-gray-100 shadow-2xl rounded-xl p-1 z-20 min-w-[120px] animate-slideInRight">
                         <button onClick={() => handleStatusChange(issue.id, 'In Progress')} className="w-full text-left px-3 py-2 text-[10px] font-black text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2">
                            <Play size={12} className="text-blue-500" /> 進行中
                         </button>
                         <button onClick={() => handleStatusChange(issue.id, 'Done')} className="w-full text-left px-3 py-2 text-[10px] font-black text-gray-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                            <CheckCircle size={12} className="text-green-500" /> 完了
                         </button>
                      </div>
                    )}
                 </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
               <p className="text-xs font-bold uppercase tracking-widest">すべて完了しました！ ☕</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
