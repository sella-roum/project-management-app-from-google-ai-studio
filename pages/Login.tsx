
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsUser, registerUser, checkIfDatabaseIsSeeded } from '../services/mockData';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkIfDatabaseIsSeeded().then(seeded => setIsDemoMode(seeded));
  }, []);

  const performLogin = (userId: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUserId', userId);
    // Don't force 'hasSetup' here. Welcome screen or Setup Wizard handles it.
    navigate('/');
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('メールアドレスを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      // Check for existing user (Mock or Created)
      const existingUser = await loginAsUser(email);
      if (existingUser) {
        performLogin(existingUser.id);
      } else {
        // Register as new user
        const name = email.split('@')[0];
        const newUser = await registerUser(email, name);
        performLogin(newUser.id);
      }
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = () => {
    // Login as Alice (u1) - Only available in Demo Mode
    performLogin('u1');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-primary text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto shadow-xl">J</div>
          <h1 className="text-3xl font-extrabold text-secondary tracking-tight">JiraMobile</h1>
          <p className="text-gray-500 font-medium">作業を円滑に。どこにいても。</p>
        </div>

        <form onSubmit={handleStandardLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div className="text-left space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">メールアドレス</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              placeholder="name@company.com"
            />
          </div>
          <div className="text-left space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">パスワード (任意)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white p-4 rounded-lg font-bold shadow-lg hover:bg-primaryHover transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? '処理中...' : 'ログイン / 新規登録'}
          </button>
        </form>

        {isDemoMode && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">デモ用</span>
              </div>
            </div>

            <button 
              onClick={handleTestLogin}
              className="w-full bg-secondary text-white p-3 rounded-lg font-bold shadow-md hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              テストアカウント (Alice) でログイン
            </button>
          </>
        )}

        <p className="text-[10px] text-gray-400 pt-8">
          続行することで、利用規約およびプライバシーポリシーに同意したことになります。<br/>
          ※これはデモアプリです。パスワードは保存されません。
        </p>
      </div>
    </div>
  );
};
