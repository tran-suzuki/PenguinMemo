import React, { useMemo } from 'react';
import { Terminal, Folder, Wifi, Cpu, Users, Archive, Info, Package, Box, Layers, Server, HardDrive, Database, Settings } from 'lucide-react';
import { Category } from '../types';
import { useUIStore } from '../stores/useUIStore';
import { useCommandStore } from '../stores/useCommandStore';
import { useServerStore } from '../stores/useServerStore';

const categoryIcons: Record<Category, React.ReactNode> = {
  [Category.FILE_SYSTEM]: <Folder size={18} />,
  [Category.NETWORK]: <Wifi size={18} />,
  [Category.PROCESS]: <Cpu size={18} />,
  [Category.USER_MGMT]: <Users size={18} />,
  [Category.ARCHIVE]: <Archive size={18} />,
  [Category.SYSTEM_INFO]: <Info size={18} />,
  [Category.PACKAGE_MGMT]: <Package size={18} />,
  [Category.OTHER]: <Box size={18} />,
};

export const Sidebar: React.FC = () => {
  // UI Store
  const { viewMode, setViewMode, openSettingsModal } = useUIStore();
  
  // Command Store
  const { commands, selectedCategory, setCategory } = useCommandStore();
  
  // Server Store
  const { servers, selectedProject, setProjectFilter } = useServerStore();

  // Derived Data
  const uniqueProjects = useMemo<string[]>(() => {
    return Array.from(new Set(servers.map(s => s.project))).sort();
  }, [servers]);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Terminal className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight">PenguinMemo</h1>
          <p className="text-xs text-slate-400">DevOps Keeper</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="px-4 mb-4">
        <div className="bg-slate-950 p-1 rounded-lg grid grid-cols-2 gap-1 border border-slate-800">
          <button
            onClick={() => setViewMode('commands')}
            className={`text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${
              viewMode === 'commands' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal size={14} />
            Commands
          </button>
          <button
            onClick={() => setViewMode('servers')}
            className={`text-xs font-medium py-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${
              viewMode === 'servers' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Server size={14} />
            Servers
          </button>
        </div>
      </div>

      {viewMode === 'commands' ? (
        /* Command Categories */
        <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-1 scrollbar-thin">
          <div className="px-2 mb-2 flex items-center justify-between">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Library</span>
          </div>

          <button
            onClick={() => setCategory('All')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedCategory === 'All'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers size={18} />
              <span className="text-sm font-medium">すべて</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
              {commands.length}
            </span>
          </button>

          <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            カテゴリー
          </div>

          {Object.values(Category).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span className={`${selectedCategory === cat ? 'text-blue-400' : 'text-slate-500'}`}>
                {categoryIcons[cat]}
              </span>
              <span className="text-sm">{cat}</span>
            </button>
          ))}
        </nav>
      ) : (
        /* Server Projects */
        <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-1 scrollbar-thin">
           <div className="px-2 mb-2 flex items-center justify-between">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory</span>
          </div>

          <button
            onClick={() => setProjectFilter('All')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedProject === 'All'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive size={18} />
              <span className="text-sm font-medium">全サーバー</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
              {servers.length}
            </span>
          </button>

          <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            プロジェクト
          </div>

          {uniqueProjects.length > 0 ? (
            uniqueProjects.map((proj) => (
              <button
                key={proj}
                onClick={() => setProjectFilter(proj)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                  selectedProject === proj
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span className={`${selectedProject === proj ? 'text-blue-400' : 'text-slate-500'}`}>
                  <Database size={18} />
                </span>
                <span className="text-sm truncate">{proj}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-xs text-slate-600 italic">
              プロジェクトがありません
            </div>
          )}
        </nav>
      )}

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={openSettingsModal}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">設定・データ管理</span>
        </button>
      </div>
    </aside>
  );
};