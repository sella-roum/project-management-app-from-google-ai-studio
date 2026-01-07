import React from 'react';
import { getUserById } from '../../services/mockData';

interface AvatarProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ userId, size = 'md', showName = false }) => {
  const user = getUserById(userId);
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';
  
  if (!user) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-300 flex items-center justify-center text-gray-500`}>
        ?
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src={user.avatarUrl} 
        alt={user.name} 
        className={`${sizeClass} rounded-full border border-gray-100 object-cover`}
      />
      {showName && <span className="text-sm font-medium text-gray-700">{user.name}</span>}
    </div>
  );
};
