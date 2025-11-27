import React, { useState, useEffect, useRef } from 'react';
import { ServerItem, ServerThread, ServerCommandLog } from '../types';
import { ArrowLeft, Terminal, Download, FileText, Table, ChevronUp, Plus, ListPlus, PanelLeft, Sparkles, X, ExternalLink, Search, Copy, Eye, EyeOff, Globe, Users } from 'lucide-react';
import { useLogStore } from '../features/command-logs/stores/useLogStore';
import { useConfigStore } from '../features/configs/stores/useConfigStore';
import { ThreadList } from './server-detail/ThreadList';
import { LogStream } from './server-detail/LogStream';
import { LogInputArea } from './server-detail/LogInputArea';
import { BulkLogImportModal } from './server-detail/BulkLogImportModal';
import { BulkConfigImportModal } from './server-detail/BulkConfigImportModal';
import { SearchResults } from './server-detail/SearchResults';
import { ConfigList } from './server-detail/ConfigList';
import { ConfigEditor } from './server-detail/ConfigEditor';
import { ConfigSearchResults } from './server-detail/ConfigSearchResults';
import { WebAppList } from './server-detail/WebAppList';
import { SSHTerminal } from './server-detail/SSHTerminal';
import { SFTPFileManager } from './server-detail/SFTPFileManager';
import { TerminalManager } from './server-detail/TerminalManager';
import { TerminalSidebar } from './server-detail/TerminalSidebar';
import { v4 as uuidv4 } from 'uuid';
import { exportThreadToMarkdown, exportThreadToCsv } from '../services/storageService';

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

  const [viewMode, setViewMode] = useState<'logs' | 'configs' | 'webapps' | 'terminal' | 'files'>('logs');
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
  const [showPassword, setShowPassword] = useState(false);


  // Gemini Sidebar State
  const [geminiSidebarWidth, setGeminiSidebarWidth] = useState(400);
  const [isResizingGemini, setIsResizingGemini] = useState(false);
  const geminiSidebarRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Handle Gemini Sidebar Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingGemini) return;

      const newWidth = document.body.clientWidth - e.clientX;
      // Limit width between 300px and 800px (or 50% of screen)
      const clampedWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.6));
      setGeminiSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingGemini(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingGemini) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizingGemini]);

  // Sync Gemini BrowserView with Sidebar
  useEffect(() => {
    if (!isGeminiOpen || !window.electronAPI) {
      window.electronAPI?.closeGemini();
      return;
    }

    const updateGeminiBounds = () => {
      if (geminiSidebarRef.current) {
        const rect = geminiSidebarRef.current.getBoundingClientRect();
        // Account for high DPI if necessary, but usually Electron handles logical pixels
        // We need to pass the bounds relative to the window
        window.electronAPI.resizeGemini({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    // Open Gemini
    window.electronAPI.openGemini();

    // Initial resize
    // Small delay to ensure layout is computed
    setTimeout(updateGeminiBounds, 50);

    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      updateGeminiBounds();
    });

    if (geminiSidebarRef.current) {
      resizeObserver.observe(geminiSidebarRef.current);
    }

    window.addEventListener('resize', updateGeminiBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateGeminiBounds);
      window.electronAPI.closeGemini();
    };
  }, [isGeminiOpen, geminiSidebarWidth]); // Re-run when open state or width changes


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

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header
        className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0 z-20"
        style={{ borderBottomColor: server.themeColor ? `${server.themeColor}40` : undefined }}
      >
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
              style={viewMode === 'logs' && server.themeColor ? { backgroundColor: server.themeColor } : {}}
            >
              Logs
            </button>
            <button
              onClick={() => setViewMode('configs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'configs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              style={viewMode === 'configs' && server.themeColor ? { backgroundColor: server.themeColor } : {}}
            >
              Configs
            </button>
            <button
              onClick={() => setViewMode('webapps')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'webapps'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              style={viewMode === 'webapps' && server.themeColor ? { backgroundColor: server.themeColor } : {}}
            >
              Web Apps
            </button>
            <button
              onClick={() => setViewMode('terminal')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'terminal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              style={viewMode === 'terminal' && server.themeColor ? { backgroundColor: server.themeColor } : {}}
            >
              Terminal
            </button>
            <button
              onClick={() => setViewMode('files')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'files'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              style={viewMode === 'files' && server.themeColor ? { backgroundColor: server.themeColor } : {}}
            >
              Files
            </button>
          </div>

          <div>
            <h2 className="font-bold text-white flex items-center gap-2 group relative">
              <div className="relative">
                <Terminal size={18} style={{ color: server.themeColor || '#60a5fa' }} />
                <input
                  type="color"
                  value={server.themeColor || '#60a5fa'}
                  onChange={(e) => onUpdate({ themeColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="テーマカラーを変更"
                />
              </div>
              {server.name}
            </h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 font-mono">{server.username}@{server.host}</div>
              {server.envInfo && server.envInfo.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-[1px] h-3 bg-slate-700 mx-1"></div>
                  {server.envInfo.slice(0, 3).map((env, i) => (
                    <span key={i} className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded border border-slate-700/50">
                      {env.key}: {env.value}
                    </span>
                  ))}
                  {server.envInfo.length > 3 && (
                    <span className="text-[10px] text-slate-600">...</span>
                  )}
                </div>
              )}
              {server.domains && server.domains.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-[1px] h-3 bg-slate-700 mx-1"></div>
                  <Globe size={12} className="text-slate-500" />
                  {server.domains.slice(0, 2).map((domain, i) => (
                    <a
                      key={i}
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 bg-slate-800 px-1 rounded border border-slate-700/50 flex items-center gap-1 transition-colors"
                      title={domain.note}
                    >
                      {domain.domain}
                      <ExternalLink size={8} className="opacity-50" />
                    </a>
                  ))}
                  {server.domains.length > 2 && (
                    <span className="text-[10px] text-slate-600">+{server.domains.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder={viewMode === 'logs' ? "すべてのスレッドから検索..." : viewMode === 'configs' ? "設定ファイルを検索 (パス・内容)..." : "Webアプリを検索..."}
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

          {viewMode === 'logs' && activeThread && (
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

          {viewMode === 'configs' && (
            <button
              onClick={() => setIsBulkConfigModalOpen(true)}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
              title="設定ファイルを一括インポート"
            >
              <ListPlus size={16} />
              一括インポート
            </button>
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

          {server.controlPanelUrl && (
            <div className="relative group">
              <a
                href={server.controlPanelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
                title="コントロールパネルを開く"
              >
                <ExternalLink size={16} />
                <span className="text-xs font-medium hidden sm:inline">Console</span>
              </a>

              {/* Hover Card for Credentials */}
              {(server.controlPanelUser || server.controlPanelPassword) && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 hidden group-hover:block">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 border-b border-slate-800 pb-1">Login Info</div>
                  <div className="space-y-2">
                    {server.controlPanelUser && (
                      <div>
                        <div className="text-[10px] text-slate-500">User</div>
                        <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1">
                          <code className="text-xs text-blue-300 font-mono">{server.controlPanelUser}</code>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(server.controlPanelUser!);
                            }}
                            className="text-slate-500 hover:text-white"
                            title="Copy User"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    {server.controlPanelPassword && (
                      <div>
                        <div className="text-[10px] text-slate-500">Password</div>
                        <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1 gap-2">
                          <code className="text-xs text-slate-400 font-mono flex-1 truncate">
                            {showPassword ? server.controlPanelPassword : '••••••••'}
                          </code>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setShowPassword(!showPassword);
                              }}
                              className="text-slate-500 hover:text-white"
                              title={showPassword ? "Hide Password" : "Show Password"}
                            >
                              {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(server.controlPanelPassword!);
                              }}
                              className="text-slate-500 hover:text-white"
                              title="Copy Password"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Root Password & Additional Users Display */}
          {(server.rootPassword || (server.additionalUsers && server.additionalUsers.length > 0)) && (
            <div className="relative group ml-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-slate-800">
                <Users size={16} />
                <span className="text-xs font-medium hidden sm:inline">Users</span>
              </button>

              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 hidden group-hover:block">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 border-b border-slate-800 pb-1">Server Credentials</div>
                <div className="space-y-3">
                  {server.rootPassword && (
                    <div>
                      <div className="text-[10px] text-red-400 font-bold mb-1">Root Password</div>
                      <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1 gap-2">
                        <code className="text-xs text-slate-400 font-mono flex-1 truncate">
                          {showPassword ? server.rootPassword : '••••••••'}
                        </code>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setShowPassword(!showPassword);
                            }}
                            className="text-slate-500 hover:text-white"
                            title={showPassword ? "Hide Password" : "Show Password"}
                          >
                            {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(server.rootPassword!);
                            }}
                            className="text-slate-500 hover:text-white"
                            title="Copy Password"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {server.additionalUsers && server.additionalUsers.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold mb-1">Additional Users</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {server.additionalUsers.map((user, idx) => (
                          <div key={idx} className="bg-slate-950 rounded p-2 border border-slate-800/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-blue-300 font-mono">{user.username}</span>
                              {user.note && <span className="text-[10px] text-slate-600">{user.note}</span>}
                            </div>
                            {user.password && (
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-xs text-slate-500 font-mono flex-1 truncate">
                                  {showPassword ? user.password : '••••••••'}
                                </code>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigator.clipboard.writeText(user.password!);
                                    }}
                                    className="text-slate-600 hover:text-white"
                                    title="Copy Password"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header >

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
            searchQuery ? (
              <ConfigSearchResults
                results={filteredConfigs}
                onSelect={(id) => {
                  setActiveConfigId(id);
                  setSearchQuery('');
                }}
              />
            ) : (
              <ConfigEditor
                config={activeConfigId ? serverConfigs.find(c => c.id === activeConfigId) || null : null}
                onSave={handleSaveConfig}
                onDelete={activeConfigId ? () => {
                  deleteConfig(activeConfigId);
                  setActiveConfigId(null);
                } : undefined}
                isNew={isCreatingConfig}
              />
            )
          ) : viewMode === 'webapps' ? (
            <div className="flex-1 overflow-y-auto p-6">
              <WebAppList serverId={server.id} webApps={server.webApps || []} />
            </div>
          ) : viewMode === 'logs' ? (
            searchQuery ? (
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
            )
          ) : null}
        </main>

        {/* Gemini Sidebar */}
        {isGeminiOpen && (
          <aside
            ref={geminiSidebarRef}
            style={{ width: geminiSidebarWidth }}
            className="border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 transition-none relative"
          >
            {/* Resize Handle */}
            <div
              className="absolute -left-3 top-0 bottom-0 w-4 cursor-col-resize z-50 group"
              onMouseDown={() => setIsResizingGemini(true)}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/50 transition-colors" />
            </div>

            <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0">
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

            {/* Content Area - Only visible in Web/PWA or if Electron API is missing */}
            {!window.electronAPI && (
              <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center text-center border-t border-slate-800">
                <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-lg shadow-blue-900/10">
                  <Sparkles size={32} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Gemini</h3>
                <p className="text-slate-400 text-xs mb-6 max-w-[240px] leading-relaxed">
                  Googleのセキュリティ制限により、Web版ではGeminiをこの画面内に直接表示することはできません。
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
            )}
          </aside>
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
      />
    </div >
  );
};
