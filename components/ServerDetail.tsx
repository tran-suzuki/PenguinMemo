
import React, { useState, useEffect, useRef } from 'react';
import { ServerItem, ServerThread, ServerCommandLog } from '../types';
import { ArrowLeft, Terminal, Download, FileText, Table, ChevronUp, Plus, ListPlus } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { ThreadList } from './server-detail/ThreadList';
import { LogStream } from './server-detail/LogStream';
import { LogInputArea } from './server-detail/LogInputArea';
import { BulkLogImportModal } from './server-detail/BulkLogImportModal';
import { exportThreadToMarkdown, exportThreadToCsv } from '../services/storageService';

interface ServerDetailProps {
  server: ServerItem;
  onBack: () => void;
}

export const ServerDetail: React.FC<ServerDetailProps> = ({ server, onBack }) => {
  // Connect to Server Store
  const { threads, logs, addThread, deleteThread, addLog, addLogs, deleteLog } = useServerStore();
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Filter data for this server
  const serverThreads = threads.filter(t => t.serverId === server.id);
  
  // Initialize active thread
  useEffect(() => {
    if (serverThreads.length > 0 && !activeThreadId) {
      setActiveThreadId(serverThreads[0].id);
    }
  }, [server.id, activeThreadId]); 

  // Handle outside click to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLogs = activeThreadId 
    ? logs.filter(l => l.threadId === activeThreadId).sort((a, b) => a.createdAt - b.createdAt)
    : [];

  const activeThread = serverThreads.find(t => t.id === activeThreadId);

  const handleAddLog = (command: string, output: string, user?: string, directory?: string) => {
    if (activeThreadId) {
      addLog(activeThreadId, command, output, user, directory);
    }
  };

  const handleBulkImport = (entries: { command: string; output: string; user?: string; directory?: string }[]) => {
    if (activeThreadId) {
      addLogs(activeThreadId, entries);
    }
  };

  const handleExport = (format: 'md' | 'csv') => {
    if (!activeThread) return;
    
    if (format === 'md') {
      exportThreadToMarkdown(server, activeThread, activeLogs);
    } else {
      exportThreadToCsv(server, activeThread, activeLogs);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-blue-400" />
              {server.name}
            </h2>
            <div className="text-xs text-slate-500 font-mono">{server.username}@{server.host}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
            {server.project}
          </span>

          {activeThread && (
            <>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
                title="ターミナルログを一括入力"
              >
                <ListPlus size={16} />
                一括入力
              </button>

              {/* Export Menu */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
                >
                  <Download size={14} />
                  エクスポート
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wide">
                      形式を選択
                    </div>
                    <button
                      onClick={() => handleExport('md')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <FileText size={14} className="text-blue-400" />
                      Markdown (.md)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Table size={14} className="text-green-400" />
                      CSV (.csv)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Thread List Sidebar */}
        <ThreadList 
          threads={serverThreads}
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
          onCreateThread={(title) => addThread(server.id, title)}
          onDeleteThread={deleteThread}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-[#0c0c0c] relative">
          {!activeThreadId ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
               <Terminal size={48} className="opacity-20 mb-4" />
               <p>スレッドを選択または作成してください</p>
             </div>
          ) : (
            <>
              <LogStream 
                logs={activeLogs}
                sessionStartTime={serverThreads.find(t => t.id === activeThreadId)?.createdAt}
                onDeleteLog={deleteLog}
              />
              
              {isInputOpen ? (
                <LogInputArea onAddLog={handleAddLog} onClose={() => setIsInputOpen(false)} />
              ) : (
                <div className="border-t border-slate-800 bg-slate-900 p-2 shrink-0 flex justify-center z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                  <button 
                    onClick={() => setIsInputOpen(true)}
                    className="w-full max-w-4xl mx-auto flex items-center justify-center gap-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 py-2 rounded-lg transition-all font-medium text-sm"
                  >
                    <ChevronUp size={16} />
                    コマンド入力を開く
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <BulkLogImportModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
};
