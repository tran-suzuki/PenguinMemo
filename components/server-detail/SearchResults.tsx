import React, { useState } from 'react';
import { ServerCommandLog, ServerThread } from '../../types';
import { LogItem } from './LogItem';
import { MessageSquare, ChevronRight, ChevronDown } from 'lucide-react';

interface SearchResultsProps {
    results: {
        thread: ServerThread;
        logs: ServerCommandLog[];
    }[];
    onSelectThread: (threadId: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelectThread }) => {
    const [fontSize, setFontSize] = useState(12);
    const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

    const toggleLog = (id: string) => {
        setExpandedLogIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (results.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <p>一致するコマンドやログは見つかりませんでした。</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300">
                    検索結果: {results.reduce((acc, r) => acc + r.logs.length, 0)} 件
                </h3>
            </div>

            {results.map((group) => (
                <div key={group.thread.id} className="space-y-2">
                    <div
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 cursor-pointer py-1 border-b border-slate-800"
                        onClick={() => onSelectThread(group.thread.id)}
                    >
                        <MessageSquare size={14} />
                        <span className="text-xs font-bold">{group.thread.title}</span>
                        <span className="text-[10px] text-slate-600 ml-auto">
                            {new Date(group.thread.createdAt).toLocaleDateString()}
                        </span>
                        <ChevronRight size={14} />
                    </div>

                    <div className="space-y-4 pl-2">
                        {group.logs.map((log) => (
                            <LogItem
                                key={log.id}
                                log={log}
                                fontSize={fontSize}
                                isExpanded={expandedLogIds.has(log.id)}
                                onToggle={() => toggleLog(log.id)}
                                showThreadInfo={false}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
