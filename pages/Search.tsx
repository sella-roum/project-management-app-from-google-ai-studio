import React, { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, Filter, XCircle } from 'lucide-react';
import { getIssues, CURRENT_USER_ID } from '../services/mockData';
import { IssueCard } from '../components/Common/IssueCard';
import { Issue } from '../types';
import { useLocation } from 'react-router-dom';

export const Search = ({ onOpenIssue }: { onOpenIssue: (i: Issue) => void }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const allIssues = getIssues();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.filter) {
      setActiveFilter(location.state.filter);
      // Clear state so it doesn't persist on refresh if not desired, 
      // but keeping it is fine for this SPA.
    }
  }, [location.state]);

  const filteredIssues = useMemo(() => {
    let result = allIssues;

    // Apply Quick Filters
    if (activeFilter === 'assigned') {
      result = result.filter(i => i.assigneeId === CURRENT_USER_ID);
    } else if (activeFilter === 'reported') {
      result = result.filter(i => i.reporterId === CURRENT_USER_ID);
    } else if (activeFilter === 'recent') {
      // Mock recent: Sort by updatedAt
      result = [...result].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    }

    // Apply Text Search
    if (query) {
      const lowerQ = query.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(lowerQ) || 
        i.key.toLowerCase().includes(lowerQ)
      );
    }

    return result;
  }, [query, activeFilter, allIssues]);

  const FilterButton = ({ id, label }: { id: string, label: string }) => (
    <button 
      onClick={() => setActiveFilter(activeFilter === id ? null : id)}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        activeFilter === id 
        ? 'bg-secondary text-white' 
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-full">
      <h1 className="text-2xl font-bold text-secondary mb-6">検索</h1>
      
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="課題キー、要約で検索..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-base"
          autoFocus
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
         <FilterButton id="assigned" label="割り当てられた課題" />
         <FilterButton id="reported" label="報告した課題" />
         <FilterButton id="recent" label="最近更新した課題" />
      </div>

      <div className="space-y-3">
        {query === '' && !activeFilter ? (
          <div className="text-center py-12 text-gray-400">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>キーワードを入力して検索を開始してください</p>
          </div>
        ) : filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <IssueCard key={issue.id} issue={issue} onClick={() => onOpenIssue(issue)} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
             条件に一致する課題は見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
};
