import React, { useState, useEffect } from 'react';
import { ServerItem, ServerThread, ServerCommandLog } from '../types';
import { ArrowLeft, Terminal } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { ThreadList } from './server-detail/ThreadList';
import { LogStream } from './server-detail/LogStream';
import { LogInputArea } from './server-detail/LogInputArea';

interface ServerDetailProps {
  server: ServerItem;
  onBack: () => void;
}

export const ServerDetail: React.FC<ServerDetailProps> = ({ server, onBack }) => {
  // Connect to Server Store
  const { threads, logs, addThread, deleteThread, addLog, deleteLog } = useServerStore();
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Filter data for this server
  const serverThreads = threads.filter(t => t.serverId === server.id);
  
  // Initialize active thread
  useEffect(() => {
    if (serverThreads.length > 0 && !activeThreadId) {
      setActiveThreadId(serverThreads[0].id);
    }
  }, [server.id, activeThreadId]); // Depends on server.id to reset if server changes (though component might remount)

  const activeLogs = activeThreadId 
    ? logs.filter(l => l.threadId === activeThreadId).sort((a, b) => a.createdAt - b.createdAt)
    : [];

  const handleAddLog = (command: string, output: string) => {
    if (activeThreadId) {
      addLog(activeThreadId, command, output);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0">
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
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            {server.project}
          </span>
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
              
              <LogInputArea onAddLog={handleAddLog} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};