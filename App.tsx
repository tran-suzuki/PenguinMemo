import React from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorModal } from './components/EditorModal';
import { ServerModal } from './components/ServerModal';
import { SettingsModal } from './components/SettingsModal';
import { ServerDetail } from './components/ServerDetail';
import { CommandList } from './components/CommandList';
import { ServerList } from './components/ServerList';

import { Plus, Search } from 'lucide-react';

// Stores
import { useUIStore } from './stores/useUIStore';
import { useCommandStore } from './stores/useCommandStore';
import { useServerStore } from './stores/useServerStore';

export default function App() {
  // UI State
  const { 
    viewMode, 
    searchQuery, 
    setSearchQuery, 
    selectedServerId,
    selectServer,
    isCommandModalOpen,
    closeCommandModal,
    openCommandModal,
    editingCommandId,
    isServerModalOpen,
    closeServerModal,
    openServerModal,
    editingServerId,
    isSettingsModalOpen,
    closeSettingsModal,
    openSettingsModal
  } = useUIStore();

  // Data Actions
  const { addCommand, updateCommand, commands } = useCommandStore();
  const { addServer, updateServer, servers } = useServerStore();

  // Derived Helpers for Modals
  const editingCommand = editingCommandId ? commands.find(c => c.id === editingCommandId) : null;
  const editingServer = editingServerId ? servers.find(s => s.id === editingServerId) : null;
  const activeServer = selectedServerId ? servers.find(s => s.id === selectedServerId) : null;

  // Handlers
  const handleOpenNew = () => {
    if (viewMode === 'commands') openCommandModal();
    else openServerModal();
  };

  // View: Server Detail
  if (activeServer) {
    return (
      <div className="h-screen bg-slate-950 text-slate-200 font-sans">
        <ServerDetail 
          server={activeServer}
          onBack={() => selectServer(null)}
        />
      </div>
    );
  }

  // View: Main Layout
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm z-10">
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={viewMode === 'commands' ? "コマンドを検索..." : "サーバーを検索..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500 text-white"
            />
          </div>
          <button 
            onClick={handleOpenNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            {viewMode === 'commands' ? '新規コマンド' : 'サーバー追加'}
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {viewMode === 'commands' ? (
            <CommandList />
          ) : (
            <ServerList />
          )}
        </div>
      </main>

      {/* Modals */}
      <EditorModal 
        isOpen={isCommandModalOpen} 
        onClose={closeCommandModal} 
        onSave={(draft) => {
          if (editingCommandId) updateCommand(editingCommandId, draft);
          else addCommand(draft);
        }}
        initialData={editingCommand}
      />

      <ServerModal
        isOpen={isServerModalOpen}
        onClose={closeServerModal}
        onSave={(draft) => {
           if (editingServerId) updateServer(editingServerId, draft);
           else addServer(draft);
        }}
        initialData={editingServer}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
      />
    </div>
  );
}