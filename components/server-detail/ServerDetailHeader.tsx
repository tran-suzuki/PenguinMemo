import React from 'react';
import { ServerThread } from '../../types';
import { ArrowLeft, Terminal, Download, FileText, Table, ListPlus, PanelLeft, Sparkles, X, ExternalLink, Search, Globe } from 'lucide-react';
import { useServerDetailContext } from './ServerDetailContext';
import { ServerCredentialsPopover } from './ServerCredentialsPopover';

interface ServerDetailHeaderProps {
  onBack: () => void;
  activeThread: ServerThread | undefined;
  onOpenBulkModal: () => void;
  onOpenBulkConfigModal: () => void;
  showExportMenu: boolean;
  onToggleExportMenu: () => void;
  onExport: (format: 'md' | 'csv') => void;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  onOpenLink: (url: string) => void;
}

/**
 * ServerDetail 上部のヘッダ。viewMode 切替・検索・各操作ボタン・資格情報を表示する。
 * 横断的な状態は ServerDetailContext から取得する。
 */
export const ServerDetailHeader: React.FC<ServerDetailHeaderProps> = ({
  onBack,
  activeThread,
  onOpenBulkModal,
  onOpenBulkConfigModal,
  showExportMenu,
  onToggleExportMenu,
  onExport,
  exportMenuRef,
  onOpenLink,
}) => {
  const {
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
  } = useServerDetailContext();

  return (
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
            <div className="w-[1px] h-3 bg-slate-700 mx-1"></div>
            <div className="text-[10px] text-slate-600 font-mono" title="Server ID">ID: {server.id}</div>
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
              onClick={onOpenBulkModal}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
              title="ターミナルログを一括入力"
            >
              <ListPlus size={16} />
              一括入力
            </button>

            {/* Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={onToggleExportMenu}
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
                    onClick={() => onExport('md')}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileText size={14} className="text-blue-400" />
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => onExport('csv')}
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
            onClick={onOpenBulkConfigModal}
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

        <ServerCredentialsPopover server={server} onOpenLink={onOpenLink} />
      </div>
    </header>
  );
};
