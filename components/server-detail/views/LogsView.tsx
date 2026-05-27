import React from 'react';
import { Terminal, ChevronUp } from 'lucide-react';
import { ServerThread, ServerCommandLog } from '../../../types';
import { LogStream } from '../LogStream';
import { LogInputArea } from '../LogInputArea';
import { SearchResults } from '../SearchResults';

interface LogsViewProps {
  searchQuery: string;
  searchResults: { thread: ServerThread; logs: ServerCommandLog[] }[];
  onSelectThread: (id: string) => void;
  activeThreadId: string | null;
  activeLogs: ServerCommandLog[];
  sessionStartTime?: number;
  onDeleteLog: (id: string) => void;
  isInputOpen: boolean;
  onAddLog: (command: string, output: string, user?: string, directory?: string) => void;
  onCloseInput: () => void;
  onOpenInput: () => void;
  currentDirectory: string;
}

/**
 * logs ビューのメインコンテンツ。検索結果 / 空状態 / ログストリーム + 入力欄を出し分ける。
 */
export const LogsView: React.FC<LogsViewProps> = ({
  searchQuery,
  searchResults,
  onSelectThread,
  activeThreadId,
  activeLogs,
  sessionStartTime,
  onDeleteLog,
  isInputOpen,
  onAddLog,
  onCloseInput,
  onOpenInput,
  currentDirectory,
}) => {
  if (searchQuery) {
    return (
      <SearchResults
        results={searchResults}
        onSelectThread={onSelectThread}
      />
    );
  }

  if (!activeThreadId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
        <Terminal size={48} className="opacity-20 mb-4" />
        <p>スレッドを選択または作成してください</p>
      </div>
    );
  }

  return (
    <>
      <LogStream
        logs={activeLogs}
        sessionStartTime={sessionStartTime}
        onDeleteLog={onDeleteLog}
      />

      {isInputOpen ? (
        <div className="overflow-x-hidden w-full">
          <LogInputArea
            onAddLog={onAddLog}
            onClose={onCloseInput}
            initialDirectory={currentDirectory}
          />
        </div>
      ) : (
        <div className="border-t border-slate-800 bg-slate-900 p-2 shrink-0 flex justify-center z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
          <button
            onClick={onOpenInput}
            className="w-full max-w-4xl mx-auto flex items-center justify-center gap-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 py-2 rounded-lg transition-all font-medium text-sm"
          >
            <ChevronUp size={16} />
            コマンド入力を開く
          </button>
        </div>
      )}
    </>
  );
};
