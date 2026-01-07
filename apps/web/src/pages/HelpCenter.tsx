import React from "react";
import {
  HelpCircle,
  FileText,
  MessageCircle,
  ExternalLink,
  Keyboard,
} from "lucide-react";

export const HelpCenter = () => {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 text-primary rounded-2xl">
          <HelpCircle size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary">ヘルプセンター</h1>
          <p className="text-gray-500 text-sm">
            JiraMobileの利用方法やサポート情報
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">ドキュメント</h3>
          <p className="text-xs text-gray-500 mb-4">
            機能の詳細や設定方法についての公式ドキュメントを参照します。
          </p>
          <span className="text-primary text-xs font-bold flex items-center gap-1">
            詳しく見る <ExternalLink size={12} />
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Keyboard size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">
            キーボードショートカット
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            効率的に操作するためのショートカットキー一覧。
          </p>
          <span className="text-primary text-xs font-bold flex items-center gap-1">
            一覧を表示 <ExternalLink size={12} />
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group md:col-span-2">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">お問い合わせ</h3>
              <p className="text-xs text-gray-500 mb-4">
                問題が発生した場合や機能のリクエストは、サポートチームまでご連絡ください。
                <br />
                通常24時間以内に返信いたします。
              </p>
              <button className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold shadow-lg hover:bg-gray-800">
                サポートに連絡
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mt-12">
        &copy; 2024 JiraMobile Clone. All rights reserved.
      </div>
    </div>
  );
};
