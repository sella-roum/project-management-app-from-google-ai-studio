import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-primary">
            <RefreshCcw size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            アプリを再読み込み中...
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            問題が発生したため、アプリケーションをリセットしています。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primaryHover transition-all active:scale-95"
          >
            今すぐ再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
