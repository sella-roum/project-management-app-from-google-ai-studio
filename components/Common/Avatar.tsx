import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/mockData';

interface AvatarProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
  'bg-rose-500'
];

export const Avatar: React.FC<AvatarProps> = ({ userId, size = 'md', showName = false }) => {
  const user = useLiveQuery(() => userId ? db.users.get(userId) : undefined, [userId]);
  
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  };

  if (!userId || !user) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center text-white font-bold`}>
        ?
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} rounded-full ${getColor(user.id)} flex items-center justify-center text-white font-bold shadow-sm border border-white/20`}>
        {getInitials(user.name)}
      </div>
      {showName && <span className="text-sm font-medium text-gray-700">{user.name}</span>}
    </div>
  );
};