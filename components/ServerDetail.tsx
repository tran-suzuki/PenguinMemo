
import React, { useState, useEffect, useRef } from 'react';
import { ServerItem, ServerThread, ServerCommandLog } from '../types';
import { ArrowLeft, Terminal, Download, FileText, Table, ChevronUp, Plus, ListPlus, PanelLeft, Sparkles, X, ExternalLink, Search } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { ThreadList } from './server-detail/ThreadList';
import { LogStream } from './server-detail/LogStream';
import { LogInputArea } from './server-detail/LogInputArea';
import { BulkLogImportModal } from './server-detail/BulkLogImportModal';
import { SearchResults } from './server-detail/SearchResults';
import { ConfigList } from './server-detail/ConfigList';
import { ConfigEditor } from './server-detail/ConfigEditor';
import { exportThreadToMarkdown, exportThreadToCsv } from '../services/storageService';

interface ServerDetailProps {
  server: ServerItem;
  onBack: () => void;
}

export const ServerDetail: React.FC<ServerDetailProps> = ({ server, onBack }) => {
  // Connect to Server Store
  const {
    threads, logs, configs,
    addThread, deleteThread,
    addLog, addLogs, deleteLog,
    addConfig, updateConfig, deleteConfig
  } = useServerStore();

  const [viewMode, setViewMode] = useState<'logs' | 'configs'>('logs');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Filter data for this server
  const serverThreads = threads.filter(t => t.serverId === server.id);
  const serverConfigs = configs ? configs.filter(c => c.serverId === server.id) : [];

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

  // Search Logic
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return serverThreads.map(thread => {
      const threadLogs = logs.filter(l => l.threadId === thread.id);
      const matchingLogs = threadLogs.filter(log =>
        log.command.toLowerCase().includes(query) ||
        (log.output && log.output.toLowerCase().includes(query)) ||
        (log.note && log.note.toLowerCase().includes(query))
      ).sort((a, b) => (a.order || 0) - (b.order || 0));

      return {
        thread,
        logs: matchingLogs
      };
    }).filter(group => group.logs.length > 0);
  }, [searchQuery, serverThreads, logs]);

  const activeThread = serverThreads.find(t => t.id === activeThreadId);

  const handleAddLog = (command: string, output: string, user?: string, directory?: string) => {
    if (activeThreadId) {
      addLog(activeThreadId, command, output, user, directory);

      // Auto-update PWD if command is 'cd'
      if (command.trim().startsWith('cd ')) {
        const newDir = command.trim().split(/\s+/)[1];
        if (newDir) {
          // Simple resolution (doesn't handle .. or relative paths perfectly, but good enough for logs)
          setCurrentDirectory(newDir);
        }
      } else if (directory) {
        // Update current directory if explicitly provided
        setCurrentDirectory(directory);
      }
    }
  };

  const handleBulkImport = (entries: { command: string; output: string; user?: string; directory?: string }[]) => {
    if (activeThreadId) {
      addLogs(activeThreadId, entries);
    }
  };

  const handleSaveConfig = (path: string, content: string, type: string) => {
    if (isCreatingConfig) {
      addConfig(server.id, path, content, type);
      setIsCreatingConfig(false);
      // Ideally select the new config, but we'd need the ID. 
      // For now, just reset creation state.
    } else if (activeConfigId) {
      updateConfig(activeConfigId, { path, content, type });
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
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`text-slate-400 hover:text-white transition-colors ${!isSidebarOpen ? 'text-slate-600' : ''}`}
            title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          >
            <PanelLeft size={20} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('logs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Logs
            </button>
            <button
              onClick={() => setViewMode('configs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'configs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Configs
            </button>
          </div>

          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-blue-400" />
              {server.name}
            </h2>
            <div className="text-xs text-slate-500 font-mono">{server.username}@{server.host}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="すべてのスレッドから検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
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

          <button
            onClick={() => setIsGeminiOpen(!isGeminiOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${isGeminiOpen
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            title="Geminiを開く"
          >
            <Sparkles size={16} />
            <span className="text-xs font-medium hidden sm:inline">Gemini</span>
          </button>
        </div>
      </header >

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          viewMode === 'logs' ? (
            <ThreadList
              threads={serverThreads}
              activeThreadId={activeThreadId}
              onSelectThread={setActiveThreadId}
              onCreateThread={(title) => addThread(server.id, title)}
              onDeleteThread={deleteThread}
            />
          ) : (
            <ConfigList
              configs={serverConfigs}
              activeConfigId={isCreatingConfig ? null : activeConfigId}
              onSelectConfig={(id) => {
                setActiveConfigId(id);
                setIsCreatingConfig(false);
              }}
              onCreateConfig={() => {
                setIsCreatingConfig(true);
                setActiveConfigId(null);
              }}
              onDeleteConfig={deleteConfig}
            />
          )
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-[#0c0c0c] relative overflow-hidden">
          {viewMode === 'configs' ? (
            <ConfigEditor
              config={activeConfigId ? serverConfigs.find(c => c.id === activeConfigId) || null : null}
              onSave={handleSaveConfig}
              isNew={isCreatingConfig}
            />
          ) : searchQuery ? (
            <SearchResults
              results={searchResults}
              onSelectThread={(id) => {
                setActiveThreadId(id);
                setSearchQuery('');
              }}
            />
          ) : !activeThreadId ? (
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
                <div className="overflow-x-hidden w-full">
                  <LogInputArea
                    onAddLog={handleAddLog}
                    onClose={() => setIsInputOpen(false)}
                    initialDirectory={currentDirectory}
                  />
                </div>
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

        {/* Gemini Sidebar */}
        {isGeminiOpen && (
          <aside className="w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 transition-all duration-300">
            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                Gemini
              </span>
              <button
                onClick={() => setIsGeminiOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center text-center border-t border-slate-800">
              <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-lg shadow-blue-900/10">
                <Sparkles size={32} className="text-blue-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Gemini</h3>
              <p className="text-slate-400 text-xs mb-6 max-w-[240px] leading-relaxed">
                Googleのセキュリティ制限により、Geminiをこの画面内に直接表示することはできません。
              </p>
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                別ウィンドウで開く
                <ExternalLink size={14} />
              </a>
            </div>
          </aside>
        )}
      </div>

      <BulkLogImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
      />
    </div >
  );
};
