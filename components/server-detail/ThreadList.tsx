import React, { useState } from 'react';
import { Plus, Hash, Trash2 } from 'lucide-react';
import { ServerThread } from '../../types';

interface ThreadListProps {
  threads: ServerThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (title: string) => void;
  onDeleteThread: (id: string) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({ 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onCreateThread, 
  onDeleteThread 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreateThread(newTitle);
      setNewTitle('');
      setIsCreating(false);
    }
  };

  const sortedThreads = [...threads].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-925 flex flex-col">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">スレッド一覧</span>
        <button 
          onClick={() => setIsCreating(true)}
          className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-400/10 rounded transition-colors"
          title="新規スレッド"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {isCreating && (
        <form onSubmit={handleSubmit} className="p-2 border-b border-slate-800 bg-slate-900">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="スレッド名..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            onBlur={() => !newTitle && setIsCreating(false)}
          />
        </form>
      )}

      <div className="overflow-y-auto flex-1 py-2">
        {sortedThreads.length === 0 && !isCreating && (
          <div className="px-4 py-8 text-center text-slate-600 text-xs">
            スレッドがありません。<br/>+ボタンで作成してください。
          </div>
        )}
        {sortedThreads.map(thread => (
          <div 
            key={thread.id}
            className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg mb-1 cursor-pointer transition-colors ${
              activeThreadId === thread.id 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            onClick={() => onSelectThread(thread.id)}
          >
            <div className="flex items-center gap-2 truncate">
              <Hash size={14} className={activeThreadId === thread.id ? 'text-blue-500' : 'text-slate-600'} />
              <span className="text-sm font-medium truncate">{thread.title}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if(window.confirm('スレッドを削除しますか？')) onDeleteThread(thread.id); }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};