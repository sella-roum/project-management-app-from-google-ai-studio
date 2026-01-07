
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getCurrentUser, updateUser, getUserStats, getCurrentUserId } from '../services/mockData';
import { resetApp } from '../services/appReset';
import { useConfirm } from '../providers/ConfirmProvider';
import { LogOut, Bell, HelpCircle, ChevronRight, Save, Edit2, Languages, Camera, RefreshCcw } from 'lucide-react';

const MenuItem = ({ 
  icon: Icon, 
  label, 
  danger = false, 
  toggle = false, 
  active = false, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  danger?: boolean, 
  toggle?: boolean, 
  active?: boolean, 
  onClick?: () => void 
}) => {
  return (
    <button 
      type="button"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={danger ? "text-red-500" : "text-gray-500"} />
        <span className={`text-sm font-medium ${danger ? "text-red-600" : "text-gray-700"}`}>{label}</span>
      </div>
      {toggle ? (
        <div className={`w-10 h-6 rounded-full transition-colors relative ${active ? 'bg-primary' : 'bg-gray-200'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'left-5' : 'left-1'}`} />
        </div>
      ) : (
        <ChevronRight size={16} className="text-gray-400" />
      )}
    </button>
  );
};

export const Profile = () => {
  const user = useLiveQuery(() => getCurrentUser());
  const stats = useLiveQuery(() => getUserStats(getCurrentUserId()));
  const { confirm } = useConfirm();

  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email || 'user@example.com');
      setEditAvatar(user.avatarUrl || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    await updateUser(user.id, { name: editName, avatarUrl: editAvatar });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'ログアウト',
      message: 'ログアウトしてもよろしいですか？\n次回利用時は再ログインが必要です。',
      confirmText: 'ログアウト',
      isDestructive: true
    });

    if (isConfirmed) {
      // Set processing to true to prevent rendering the UI that depends on the DB
      setIsProcessing(true); 
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUserId');
      window.location.reload();
    }
  };

  const handleResetApp = async () => {
    const isConfirmed = await confirm({
      title: 'アプリの初期化',
      message: '【重要】すべてのプロジェクト、課題、設定が完全に削除されます。\nこの操作は取り消せません。本当によろしいですか？',
      confirmText: '初期化する',
      isDestructive: true
    });

    if (isConfirmed) {
      setIsProcessing(true); // Lock UI
      const success = await resetApp();
      if (success) {
        window.location.reload();
      } else {
        setIsProcessing(false);
        alert('初期化中にエラーが発生しました。');
      }
    }
  };

  // Guard clause: If processing (logging out/resetting) or loading user, show simple loader.
  // This prevents the component from trying to access `user` properties or rendering sub-components 
  // that query the DB while the DB is being closed/deleted.
  if (isProcessing || (!user && !isProcessing)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="p-8 text-center text-gray-400 text-sm font-bold animate-pulse">
          {isProcessing ? '処理中...' : '読み込み中...'}
        </div>
      </div>
    );
  }

  // Double check user existence for TypeScript safety
  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-secondary">マイページ</h1>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
             <Edit2 size={14}/> 編集
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200 transition-colors">
               キャンセル
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg text-xs font-bold text-white shadow-lg hover:bg-primaryHover transition-colors">
               <Save size={14}/> 保存
            </button>
          </div>
        )}
      </div>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center mb-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
         
         <div className="relative group cursor-pointer mb-6">
           <img src={editAvatar || 'https://via.placeholder.com/150'} alt={user.name} className="w-28 h-28 rounded-full border-4 border-gray-50 object-cover shadow-lg" />
           {isEditing && (
             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-100 transition-opacity">
                <Camera size={24} />
             </div>
           )}
         </div>

         {isEditing ? (
           <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">氏名</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">アバターURL</label>
                <input type="text" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-center focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://..." />
              </div>
           </div>
         ) : (
           <div className="text-center">
             <h2 className="text-2xl font-black text-gray-900 leading-tight">{user.name}</h2>
             <p className="text-gray-500 text-sm font-medium mt-1">{editEmail}</p>
           </div>
         )}
      </div>

      {/* ユーザー統計グリッド */}
      <div className="grid grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center shadow-sm">
            <div className="text-xl font-black text-primary">{stats?.assigned || 0}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">担当課題</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center shadow-sm">
            <div className="text-xl font-black text-success">{stats?.reported || 0}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">報告課題</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center shadow-sm">
            <div className="text-xl font-black text-amber-500">{stats?.leading || 0}</div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">リード</div>
         </div>
      </div>

      {/* アプリ設定セクション */}
      <div className="space-y-8">
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">アプリ設定</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <MenuItem 
              icon={Bell} 
              label="通知を有効にする" 
              toggle 
              active={notificationsEnabled} 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)} 
            />
            <MenuItem icon={Languages} label="言語 (日本語)" />
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 text-red-400">アカウント</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <MenuItem icon={LogOut} label="ログアウト" danger onClick={handleLogout} />
            <MenuItem icon={RefreshCcw} label="アプリを初期化" danger onClick={handleResetApp} />
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">サポート</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <MenuItem icon={HelpCircle} label="ヘルプセンター" />
          </div>
        </div>
      </div>
      
      <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-12 pb-12">
        JiraMobile Clone v1.2.1 (Fixes Applied)
      </p>
    </div>
  );
};
