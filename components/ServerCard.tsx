
import React, { useState } from 'react';
import { ServerItem } from '../types';
import { Server, Copy, Check, Trash2, Edit2, Terminal, Key, Lock, Eye, EyeOff, Globe, ChevronRight, FileText } from 'lucide-react';

interface ServerCardProps {
  item: ServerItem;
  onDelete: (id: string) => void;
  onEdit: (item: ServerItem) => void;
  onOpenDetail: (item: ServerItem) => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ item, onDelete, onEdit, onOpenDetail }) => {
  const [copiedSsh, setCopiedSsh] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const sshCommand = `ssh -p ${item.port} ${item.username}@${item.host}`;

  const handleCopySsh = async () => {
    try {
      await navigator.clipboard.writeText(sshCommand);
      setCopiedSsh(true);
      setTimeout(() => setCopiedSsh(false), 2000);
    } catch (err) {
      console.error('Failed to copy SSH', err);
    }
  };

  const handleCopyAuth = async () => {
    try {
      await navigator.clipboard.writeText(item.authValue);
      setCopiedAuth(true);
      setTimeout(() => setCopiedAuth(false), 2000);
    } catch (err) {
      console.error('Failed to copy Auth', err);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/30 transition-all group flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {item.project}
            </span>
            {item.tags.map((tag, idx) => (
              <span key={idx} className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Server size={18} className="text-blue-400" />
            {item.name}
          </h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Connection Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <div className="text-slate-500 text-xs mb-0.5 flex items-center gap-1"><Globe size={10} /> Host</div>
          <div className="font-mono text-slate-300 truncate" title={item.host}>{item.host}</div>
        </div>
        <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
          <div className="text-slate-500 text-xs mb-0.5">User</div>
          <div className="font-mono text-slate-300 truncate">{item.username}</div>
        </div>
      </div>

      {/* SSH Action */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
          <Terminal size={12} />
          SSH Connection
        </div>
        <div className="relative group/ssh">
          <div className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-green-400 truncate pr-8">
            {sshCommand}
          </div>
          <button
            onClick={handleCopySsh}
            className="absolute right-1 top-1 p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="SSHコマンドをコピー"
          >
            {copiedSsh ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Auth Info */}
      <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/50 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            {item.authType === 'password' ? <Lock size={12} /> : <Key size={12} />}
            {item.authType === 'password' ? 'Password' : 'Private Key'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowAuth(!showAuth)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showAuth ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              onClick={handleCopyAuth}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="コピー"
            >
              {copiedAuth ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div className={`font-mono text-xs break-all ${showAuth ? 'text-slate-300' : 'text-slate-600 blur-sm select-none'}`}>
          {showAuth ? item.authValue : '•••••••••••••••••••••'}
        </div>
      </div>

      {/* Control Panel Info (Optional) */}
      {(item.controlPanelUrl || item.controlPanelUser || item.controlPanelPassword) && (
        <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/50 mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Globe size={10} /> Control Panel
          </div>

          {item.controlPanelUrl && (
            <a
              href={item.controlPanelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-400 hover:text-blue-300 hover:underline truncate mb-2 flex items-center gap-1"
            >
              {item.controlPanelUrl}
              <Globe size={10} />
            </a>
          )}

          {(item.controlPanelUser || item.controlPanelPassword) && (
            <div className="grid grid-cols-1 gap-2">
              {item.controlPanelUser && (
                <div className="flex items-center justify-between bg-slate-950/50 rounded px-2 py-1">
                  <span className="text-[10px] text-slate-500">User</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-slate-300 font-mono">{item.controlPanelUser}</code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.controlPanelUser!);
                      }}
                      className="text-slate-500 hover:text-white"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
              )}
              {item.controlPanelPassword && (
                <div className="flex items-center justify-between bg-slate-950/50 rounded px-2 py-1">
                  <span className="text-[10px] text-slate-500">Pass</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-slate-300 font-mono">
                      {showAuth ? item.controlPanelPassword : '••••••••'}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.controlPanelPassword!);
                      }}
                      className="text-slate-500 hover:text-white"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Action */}
      <div className="mt-auto pt-2 border-t border-slate-800/50 flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Last update: {new Date(item.updatedAt).toLocaleDateString()}
        </div>
        <button
          onClick={() => onOpenDetail(item)}
          className="text-xs flex items-center gap-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-full transition-all font-medium"
        >
          <FileText size={12} />
          コンソール / ログ
          <ChevronRight size={12} />
        </button>
      </div>

    </div>
  );
};
