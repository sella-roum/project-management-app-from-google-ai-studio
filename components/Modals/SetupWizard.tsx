
import React, { useState } from 'react';
import { X, Rocket, Layout, ListTodo, ChevronRight } from 'lucide-react';
import { setupInitialProject } from '../../services/mockData';

export const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<'Scrum' | 'Kanban'>('Kanban');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await setupInitialProject(name, key || name.substring(0,3).toUpperCase(), type);
    setLoading(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-primary flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="p-8 space-y-8">
          {step === 1 ? (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                 <Rocket size={40} />
              </div>
              <h1 className="text-3xl font-extrabold text-secondary">JiraCloneへようこそ</h1>
              <p className="text-gray-500">まずは、最初のチームプロジェクトを作成しましょう。名前とキーを入力してください。</p>
              <div className="space-y-4 text-left">
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="プロジェクト名 (例: 開発チーム)"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none text-lg transition-all"
                />
                <input 
                  type="text" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="キー (例: DEV)"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none font-mono text-lg transition-all"
                  maxLength={5}
                />
              </div>
              <button 
                onClick={() => setStep(2)} disabled={!name}
                className="w-full bg-primary text-white p-5 rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                次へ <ChevronRight size={20}/>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-secondary">テンプレートの選択</h2>
              <p className="text-gray-500">チームの働き方に合わせて、最適なテンプレートを選んでください。</p>
              <div className="grid grid-cols-1 gap-4">
                 <button 
                   onClick={() => setType('Kanban')}
                   className={`p-6 border-2 rounded-3xl flex items-center gap-6 text-left transition-all ${type === 'Kanban' ? 'border-primary bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                 >
                    <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center text-blue-500"><Layout size={24}/></div>
                    <div className="flex-1">
                       <div className="font-bold text-gray-800">カンバン (Kanban)</div>
                       <div className="text-xs text-gray-400">継続的な作業の可視化と流れの管理に最適です。</div>
                    </div>
                 </button>
                 <button 
                   onClick={() => setType('Scrum')}
                   className={`p-6 border-2 rounded-3xl flex items-center gap-6 text-left transition-all ${type === 'Scrum' ? 'border-primary bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                 >
                    <div className="w-12 h-12 bg-white rounded-xl shadow flex items-center justify-center text-green-500"><ListTodo size={24}/></div>
                    <div className="flex-1">
                       <div className="font-bold text-gray-800">スクラム (Scrum)</div>
                       <div className="text-xs text-gray-400">スプリントを使用した計画的な増分開発に最適です。</div>
                    </div>
                 </button>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setStep(1)} className="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">戻る</button>
                 <button onClick={handleFinish} className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2">
                   {loading ? '作成中...' : '開始する'}
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
