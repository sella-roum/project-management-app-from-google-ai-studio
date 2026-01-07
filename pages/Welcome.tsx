
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedDatabase, clearDatabase } from '../services/mockData';
import { Rocket, Trash2, Check, ArrowRight } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDemoMode = async () => {
    setLoading(true);
    await seedDatabase();
    localStorage.setItem('appInitialized', 'true');
    // Demo mode assumes initial setup is done (users/projects exist)
    localStorage.setItem('hasSetup', 'true'); 
    setLoading(false);
    navigate('/login');
  };

  const handleFreshStart = async () => {
    setLoading(true);
    await clearDatabase();
    localStorage.setItem('appInitialized', 'true');
    // Fresh start requires the user to run through the setup wizard after login/reg
    localStorage.removeItem('hasSetup'); 
    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-8 md:p-12 text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight">JiraMobile Clone へようこそ</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            モバイルファーストのプロジェクト管理体験を始めましょう。<br/>
            開始方法を選択してください。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-100 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-8 space-y-6 hover:bg-blue-50/50 transition-colors group">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Rocket size={32} />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-gray-800 mb-2">デモデータで開始</h3>
               <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                 サンプルプロジェクト、課題、ユーザーが含まれた状態で開始します。機能の確認に最適です。
               </p>
               <button 
                 onClick={handleDemoMode} 
                 disabled={loading}
                 className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primaryHover active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? '準備中...' : <>デモモード <ArrowRight size={18}/></>}
               </button>
             </div>
          </div>

          <div className="p-8 space-y-6 hover:bg-orange-50/50 transition-colors group">
             <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Trash2 size={32} />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-gray-800 mb-2">最初から開始</h3>
               <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                 完全に空の状態から開始します。自分自身でアカウントとプロジェクトを作成します。
               </p>
               <button 
                 onClick={handleFreshStart}
                 disabled={loading}
                 className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? '準備中...' : 'フレッシュスタート'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
