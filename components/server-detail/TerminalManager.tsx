import React from 'react';
import { ServerItem } from '../../types';
import { SSHTerminal } from './SSHTerminal';
import { Plus, X, Terminal } from 'lucide-react';

interface TerminalTab {
    id: string;
    title: string;
}

interface TerminalManagerProps {
    server: ServerItem;
    tabs: TerminalTab[];
    activeTabId: string | null;
    onAddTab: () => void;
    onCloseTab: (id: string) => void;
    onSelectTab: (id: string) => void;
}

export const TerminalManager: React.FC<TerminalManagerProps> = ({
    server,
    tabs,
    activeTabId,
    onAddTab,
    onCloseTab,
    onSelectTab
}) => {
    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Tab Bar */}
            <div className="flex items-center bg-slate-900 border-b border-slate-800 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-2 text-xs font-medium border-r border-slate-800 cursor-pointer select-none min-w-[120px] max-w-[200px]
                            ${activeTabId === tab.id
                                ? 'bg-slate-800 text-blue-400 border-b-2 border-b-blue-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-b-2 border-b-transparent'
                            }
                        `}
                    >
                        <Terminal size={12} className={activeTabId === tab.id ? 'text-blue-400' : 'text-slate-500'} />
                        <span className="truncate flex-1">{tab.title}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseTab(tab.id);
                            }}
                            className={`
                                p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all
                                ${activeTabId === tab.id ? 'opacity-100' : ''}
                            `}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={onAddTab}
                    className="flex items-center justify-center w-8 h-full min-h-[34px] text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    title="New Terminal"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-[#0f172a]">
                {tabs.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800 flex flex-col items-center">
                            <Terminal size={48} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-slate-300 mb-2">No Active Terminals</h3>
                            <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
                                Open a new terminal tab to connect to {server.host}
                            </p>
                            <button
                                onClick={onAddTab}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Open Terminal
                            </button>
                        </div>
                    </div>
                ) : (
                    tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`absolute inset-0 w-full h-full ${activeTabId === tab.id ? 'z-10 visible' : 'z-0 invisible'}`}
                        >
                            <SSHTerminal server={server} terminalId={tab.id} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
