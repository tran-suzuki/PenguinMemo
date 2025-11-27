import React, { useState, useMemo } from 'react';
import { ServerItem } from '../../types';
import { useCommandStore } from '../../features/commands/stores/useCommandStore';
import { useUIStore } from '../../features/ui/stores/useUIStore';
import { Search, Plus, Terminal, Copy, Command } from 'lucide-react';

interface TerminalSidebarProps {
    server: ServerItem;
}

interface TerminalSidebarProps {
    server: ServerItem;
    activeTerminalId: string | null;
}

export const TerminalSidebar: React.FC<TerminalSidebarProps> = ({ server, activeTerminalId }) => {
    const { commands } = useCommandStore();
    const { openCommandModal } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCommands = useMemo(() => {
        if (!searchQuery.trim()) return commands;
        const query = searchQuery.toLowerCase();
        return commands.filter(cmd =>
            cmd.command.toLowerCase().includes(query) ||
            cmd.description.toLowerCase().includes(query) ||
            cmd.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }, [commands, searchQuery]);

    const handleExecute = (command: string) => {
        if (window.electronAPI && activeTerminalId) {
            window.electronAPI.sendSSHData(activeTerminalId, command + '\n');
        }
    };

    const handleCopy = (e: React.MouseEvent, command: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(command);
    };

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Command size={14} className="text-blue-400" />
                    Quick Commands
                </span>
                <button
                    onClick={() => openCommandModal()}
                    className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                    title="Add Command"
                >
                    <Plus size={14} />
                </button>
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
                {filteredCommands.map(cmd => (
                    <div
                        key={cmd.id}
                        onClick={() => handleExecute(cmd.command)}
                        className="group bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded p-2 cursor-pointer transition-all"
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-300 line-clamp-1 group-hover:text-white transition-colors">
                                {cmd.description || cmd.command}
                            </span>
                            <button
                                onClick={(e) => handleCopy(e, cmd.command)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-all"
                                title="Copy to clipboard"
                            >
                                <Copy size={10} />
                            </button>
                        </div>
                        <code className="block text-[10px] text-slate-500 font-mono bg-slate-950/50 rounded px-1.5 py-1 truncate group-hover:text-slate-400 transition-colors">
                            {cmd.command}
                        </code>
                    </div>
                ))}
                {filteredCommands.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-xs">
                        No commands found
                    </div>
                )}
            </div>
        </div>
    );
};
