import React, { useState, useMemo } from 'react';
import { ServerItem } from '../../types';
import { useCommandStore } from '../../features/commands/stores/useCommandStore';
import { useUIStore } from '../../features/ui/stores/useUIStore';
import { Search, Plus, Copy, Command, Edit2, Trash2, Globe, Server } from 'lucide-react';

interface TerminalSidebarProps {
    server: ServerItem;
    activeTerminalId: string | null;
}

type ScopeFilter = 'all' | 'common' | 'server';

export const TerminalSidebar: React.FC<TerminalSidebarProps> = ({ server, activeTerminalId }) => {
    const { commands, deleteCommand } = useCommandStore();
    const { openCommandModal } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [scope, setScope] = useState<ScopeFilter>('all');

    const filteredCommands = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return commands.filter(cmd => {
            // このサーバーで使えるのは共通コマンドとこのサーバー専用コマンドのみ
            const isCommon = !cmd.serverId;
            const isThisServer = cmd.serverId === server.id;
            if (!isCommon && !isThisServer) return false;

            // スコープフィルタ
            if (scope === 'common' && !isCommon) return false;
            if (scope === 'server' && !isThisServer) return false;

            // 検索フィルタ
            if (!query) return true;
            return (
                cmd.command.toLowerCase().includes(query) ||
                cmd.description.toLowerCase().includes(query) ||
                cmd.tags.some(tag => tag.toLowerCase().includes(query))
            );
        });
    }, [commands, searchQuery, scope, server.id]);

    const handleExecute = (command: string) => {
        if (window.electronAPI && activeTerminalId) {
            window.electronAPI.sendSSHData(activeTerminalId, command + '\n');
        }
    };

    const handleCopy = (e: React.MouseEvent, command: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(command);
    };

    const handleEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        openCommandModal(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteCommand(id);
    };

    const scopeTabs: { key: ScopeFilter; label: string }[] = [
        { key: 'all', label: 'すべて' },
        { key: 'common', label: '共通' },
        { key: 'server', label: 'このサーバー' },
    ];

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Command size={14} className="text-blue-400" />
                    Quick Commands
                </span>
                <button
                    onClick={() => openCommandModal(undefined, server.id)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                    title="このサーバー専用コマンドを追加"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Scope Filter */}
            <div className="px-2 pt-2 flex gap-1">
                {scopeTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setScope(tab.key)}
                        className={`flex-1 text-[10px] font-medium py-1 rounded transition-colors ${
                            scope === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="p-2 border-b border-slate-800">
                <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search commands..."
                        className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredCommands.map(cmd => {
                    const isServerScoped = cmd.serverId === server.id;
                    return (
                        <div
                            key={cmd.id}
                            onClick={() => handleExecute(cmd.command)}
                            className="group bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded p-2 cursor-pointer transition-all"
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                                    {cmd.description || cmd.command}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <button
                                        onClick={(e) => handleCopy(e, cmd.command)}
                                        className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-all"
                                        title="クリップボードにコピー"
                                    >
                                        <Copy size={10} />
                                    </button>
                                    <button
                                        onClick={(e) => handleEdit(e, cmd.id)}
                                        className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-blue-400 transition-all"
                                        title="編集"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, cmd.id)}
                                        className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-all"
                                        title="削除"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                            <code className="block text-[10px] text-slate-500 font-mono bg-slate-950/50 rounded px-1.5 py-1 truncate group-hover:text-slate-400 transition-colors">
                                {cmd.command}
                            </code>
                            <div className="mt-1 flex items-center gap-1">
                                {isServerScoped ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400/80">
                                        <Server size={9} /> このサーバー専用
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-500">
                                        <Globe size={9} /> 共通
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredCommands.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs">
                        No commands found
                    </div>
                )}
            </div>
        </div>
    );
};
