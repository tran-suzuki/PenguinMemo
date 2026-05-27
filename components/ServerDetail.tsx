import React, { useState, useEffect, useRef } from 'react';
import { ServerItem, ServerThread, ServerCommandLog } from '../types';
import { Terminal } from 'lucide-react';
import { useLogStore } from '../features/command-logs/stores/useLogStore';
import { useConfigStore } from '../features/configs/stores/useConfigStore';
import { useUIStore } from '../features/ui/stores/useUIStore';
import { ThreadList } from './server-detail/ThreadList';
import { BulkLogImportModal } from './server-detail/BulkLogImportModal';
import { BulkConfigImportModal } from './server-detail/BulkConfigImportModal';
import { LinkOpenConfirmModal } from './LinkOpenConfirmModal';
import { ImportToLogsModal } from './server-detail/ImportToLogsModal';
import { ConfigList } from './server-detail/ConfigList';
import { SFTPFileManager } from './server-detail/SFTPFileManager';
import { TerminalManager } from './server-detail/TerminalManager';
import { TerminalSidebar } from './server-detail/TerminalSidebar';
import { v4 as uuidv4 } from 'uuid';
import { exportThreadToMarkdown, exportThreadToCsv } from '../services/storageService';
import { ServerDetailProvider, ServerViewMode } from './server-detail/ServerDetailContext';
import { ServerDetailHeader } from './server-detail/ServerDetailHeader';
import { GeminiSidebar } from './server-detail/GeminiSidebar';
import { useGeminiSidebar } from './server-detail/useGeminiSidebar';
import { LogsView } from './server-detail/views/LogsView';
import { ConfigsView } from './server-detail/views/ConfigsView';
import { WebAppsView } from './server-detail/views/WebAppsView';

interface ServerDetailProps {
  server: ServerItem;
  onBack: () => void;
  onUpdate: (updates: Partial<ServerItem>) => void;
}

export const ServerDetail: React.FC<ServerDetailProps> = ({ server, onBack, onUpdate }) => {
  // Connect to Server Store
  const {
    threads, logs,
    addThread, deleteThread,
    addLog, addLogs, deleteLog
  } = useLogStore();

  const {
    configs,
    addConfig, updateConfig, deleteConfig
  } = useConfigStore();

  const [viewMode, setViewMode] = useState<ServerViewMode>('logs');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkConfigModalOpen, setIsBulkConfigModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkToOpen, setLinkToOpen] = useState<string | null>(null);

  // Manual Import State
  const [isImportLogsModalOpen, setIsImportLogsModalOpen] = useState(false);
  const [importLogContent, setImportLogContent] = useState('');
  const [importLogCommand, setImportLogCommand] = useState('');
  // ターミナルの「Import to Configs」で一括インポートモーダルに渡す初期内容
  const [bulkConfigInitialContent, setBulkConfigInitialContent] = useState('');

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Gemini Sidebar (modal が開いている間は BrowserView を隠す)
  const { isServerModalOpen, isCommandModalOpen, isSettingsModalOpen } = useUIStore();
  const modalsOpen = isServerModalOpen || isCommandModalOpen || isSettingsModalOpen || isBulkModalOpen || isBulkConfigModalOpen;
  const { sidebarRef, sidebarWidth, startResize } = useGeminiSidebar(isGeminiOpen, modalsOpen);

  // Terminal State
  const [terminalTabs, setTerminalTabs] = useState<{ id: string; title: string }[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  const handleAddTerminalTab = () => {
    const newTabId = uuidv4();
    const newTab = { id: newTabId, title: `Terminal ${terminalTabs.length + 1}` };
    setTerminalTabs([...terminalTabs, newTab]);
    setActiveTerminalId(newTabId);
  };

  const handleCloseTerminalTab = (id: string) => {
    const newTabs = terminalTabs.filter(t => t.id !== id);
    setTerminalTabs(newTabs);
    if (activeTerminalId === id) {
      setActiveTerminalId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

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

  // Config Search Logic
  const filteredConfigs = React.useMemo(() => {
    if (!searchQuery.trim()) return serverConfigs;
    const query = searchQuery.toLowerCase();
    return serverConfigs.filter(config =>
      config.path.toLowerCase().includes(query) ||
      config.content.toLowerCase().includes(query)
    );
  }, [searchQuery, serverConfigs]);

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

  const handleBulkConfigImport = (entries: { path: string; content: string; type: string }[]) => {
    entries.forEach(entry => {
      addConfig(server.id, entry.path, entry.content, entry.type);
    });
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

  const handleManualImportLogs = (content: string) => {
    // 改行コードを正規化（Windows由来のCRLFで \r が混入するのを防ぐ）
    content = content.replace(/\r\n|\r/g, '\n');
    // Try to parse command from content
    // Heuristic: Look for lines starting with prompts like $, #, >, or user@host
    const lines = content.split('\n');
    let command = '';
    let output = content;

    // Simple heuristic: if the first line looks like a prompt, extract the command
    const firstLine = lines[0].trim();
    // Regex for common prompts:
    // [user@host ~]$ command
    // user@host:~$ command
    // $ command
    // > command
    const promptRegex = /^(\[?[\w@:.~-]+\]?[$#>]|\$|>) (.*)/;
    const match = firstLine.match(promptRegex);

    if (match) {
      command = match[2];
      // Remove the first line from output if it's just the command
      if (lines.length > 1) {
        output = lines.slice(1).join('\n');
      } else {
        output = ''; // Command only?
      }
    } else {
      // Fallback: Use first line as command if it's short, otherwise "Manual Import"
      if (firstLine.length < 50 && lines.length > 1) {
        command = firstLine;
        output = lines.slice(1).join('\n');
      } else {
        command = 'Manual Import';
      }
    }

    setImportLogContent(output);
    setImportLogCommand(command);
    setIsImportLogsModalOpen(true);
  };

  const handleManualImportConfigs = (content: string) => {
    // 選択テキストを一括インポートモーダルに渡して開く。
    // ユーザーが内容を確認し「解析する」で pwd/cat 形式を抽出できる。
    setBulkConfigInitialContent(content);
    setIsBulkConfigModalOpen(true);
  };

  const handleConfirmImportLogs = (threadId: string, command: string, content: string, newThreadTitle?: string) => {
    let targetThreadId = threadId;

    if (threadId === 'new' && newThreadTitle) {
      targetThreadId = addThread(server.id, newThreadTitle);
      setActiveThreadId(targetThreadId);
    } else {
      setActiveThreadId(threadId);
    }

    addLog(
      targetThreadId,
      command,
      content,
      'User'
    );

    setIsImportLogsModalOpen(false);
  };

  return (
    <ServerDetailProvider
      value={{
        server,
        onUpdate,
        viewMode,
        setViewMode,
        searchQuery,
        setSearchQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        isGeminiOpen,
        setIsGeminiOpen,
      }}
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-200">
        <ServerDetailHeader
          onBack={onBack}
          activeThread={activeThread}
          onOpenBulkModal={() => setIsBulkModalOpen(true)}
          onOpenBulkConfigModal={() => { setBulkConfigInitialContent(''); setIsBulkConfigModalOpen(true); }}
          showExportMenu={showExportMenu}
          onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
          onExport={handleExport}
          exportMenuRef={exportMenuRef}
          onOpenLink={setLinkToOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {isSidebarOpen && (
            viewMode === 'configs' ? (
              <ConfigList
                configs={filteredConfigs}
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
                isSearching={!!searchQuery}
              />
            ) : viewMode === 'terminal' ? (
              <TerminalSidebar server={server} activeTerminalId={activeTerminalId} />
            ) : (
              <ThreadList
                threads={serverThreads}
                activeThreadId={activeThreadId}
                onSelectThread={setActiveThreadId}
                onCreateThread={(title) => addThread(server.id, title)}
                onDeleteThread={deleteThread}
              />
            )
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-[#0c0c0c] relative overflow-hidden">
            {/* Terminal View (Always rendered to persist connection) */}
            <div className={`flex-1 flex flex-col h-full ${viewMode === 'terminal' ? 'block' : 'hidden'}`}>
              {window.electronAPI ? (
                <TerminalManager
                  server={server}
                  tabs={terminalTabs}
                  activeTabId={activeTerminalId}
                  onAddTab={handleAddTerminalTab}
                  onCloseTab={handleCloseTerminalTab}
                  onSelectTab={setActiveTerminalId}
                  onImportLogs={handleManualImportLogs}
                  onImportConfigs={handleManualImportConfigs}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 max-w-md">
                    <Terminal size={48} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Desktop App Required</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      SSH terminal functionality is only available in the desktop version of PenguinMemo.
                    </p>
                    <div className="text-xs text-slate-600 bg-slate-950 p-3 rounded border border-slate-800 font-mono">
                      npm run electron:dev
                    </div>
                  </div>
                </div>
              )}
            </div>

            {viewMode === 'files' && (
              <SFTPFileManager server={server} />
            )}

            {/* Other Views */}
            {viewMode === 'configs' ? (
              <ConfigsView
                searchQuery={searchQuery}
                filteredConfigs={filteredConfigs}
                serverConfigs={serverConfigs}
                activeConfigId={activeConfigId}
                isCreatingConfig={isCreatingConfig}
                onSelectSearchResult={(id) => {
                  setActiveConfigId(id);
                  setSearchQuery('');
                }}
                onSaveConfig={handleSaveConfig}
                onDeleteActiveConfig={activeConfigId ? () => {
                  deleteConfig(activeConfigId);
                  setActiveConfigId(null);
                } : undefined}
              />
            ) : viewMode === 'webapps' ? (
              <WebAppsView serverId={server.id} webApps={server.webApps || []} />
            ) : viewMode === 'logs' ? (
              <LogsView
                searchQuery={searchQuery}
                searchResults={searchResults}
                onSelectThread={(id) => {
                  setActiveThreadId(id);
                  setSearchQuery('');
                }}
                activeThreadId={activeThreadId}
                activeLogs={activeLogs}
                sessionStartTime={serverThreads.find(t => t.id === activeThreadId)?.createdAt}
                onDeleteLog={deleteLog}
                isInputOpen={isInputOpen}
                onAddLog={handleAddLog}
                onCloseInput={() => setIsInputOpen(false)}
                onOpenInput={() => setIsInputOpen(true)}
                currentDirectory={currentDirectory}
              />
            ) : null}
          </main>

          {/* Gemini Sidebar */}
          {isGeminiOpen && (
            <GeminiSidebar
              sidebarRef={sidebarRef}
              width={sidebarWidth}
              onStartResize={startResize}
              onClose={() => setIsGeminiOpen(false)}
            />
          )}
        </div>

        <BulkLogImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onImport={handleBulkImport}
        />

        <BulkConfigImportModal
          isOpen={isBulkConfigModalOpen}
          onClose={() => setIsBulkConfigModalOpen(false)}
          onImport={handleBulkConfigImport}
          initialContent={bulkConfigInitialContent}
        />

        <LinkOpenConfirmModal
          isOpen={!!linkToOpen}
          onClose={() => setLinkToOpen(null)}
          url={linkToOpen || ''}
          onConfirm={(mode) => {
            if (linkToOpen) {
              if (mode === 'app') {
                window.open(linkToOpen, '_blank', 'width=1200,height=800');
              } else {
                if (window.electronAPI) {
                  window.electronAPI.openExternal(linkToOpen);
                } else {
                  window.open(linkToOpen, '_blank');
                }
              }
              setLinkToOpen(null);
            }
          }}
        />

        {isImportLogsModalOpen && (
          <ImportToLogsModal
            isOpen={isImportLogsModalOpen}
            onClose={() => setIsImportLogsModalOpen(false)}
            initialContent={importLogContent}
            initialCommand={importLogCommand}
            threads={serverThreads}
            onImport={handleConfirmImportLogs}
          />
        )}
      </div>
    </ServerDetailProvider>
  );
};
