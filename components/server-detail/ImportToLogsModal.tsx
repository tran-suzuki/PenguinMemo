import React, { useState, useEffect } from 'react';
import { ServerThread } from '../../types';
import { X, Plus, Save } from 'lucide-react';

interface ImportToLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialContent: string;
    initialCommand?: string;
    threads: ServerThread[];
    onImport: (threadId: string, command: string, content: string, newThreadTitle?: string) => void;
}

export const ImportToLogsModal: React.FC<ImportToLogsModalProps> = ({
    isOpen,
    onClose,
    initialContent,
    initialCommand = '',
    threads,
    onImport
}) => {
    const [content, setContent] = useState(initialContent);
    const [command, setCommand] = useState(initialCommand);
    const [selectedThreadId, setSelectedThreadId] = useState<string>('');
    const [isNewThread, setIsNewThread] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent);
            setCommand(initialCommand);
            // Default to first thread if available, otherwise new thread
            if (threads.length > 0) {
                setSelectedThreadId(threads[0].id);
                setIsNewThread(false);
            } else {
                setIsNewThread(true);
            }
            setNewThreadTitle('');
        }
    }, [isOpen, initialContent, initialCommand, threads]);

    if (!isOpen) return null;

    const handleImport = () => {
        if (isNewThread && !newThreadTitle.trim()) {
            alert('Please enter a thread title');
            return;
        }
        if (!isNewThread && !selectedThreadId) {
            alert('Please select a thread');
            return;
        }
        if (!command.trim()) {
            alert('Please enter a command');
            return;
        }

        onImport(
            isNewThread ? 'new' : selectedThreadId,
            command,
            content,
            isNewThread ? newThreadTitle : undefined
        );
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Import to Logs</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Thread Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">Target Thread</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsNewThread(false)}
                                disabled={threads.length === 0}
                                className={`px-4 py-3 rounded-lg border text-left transition-all ${!isNewThread
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    } ${threads.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="font-medium mb-1">Existing Thread</div>
                                <div className="text-xs opacity-70">Add to an existing conversation</div>
                            </button>

                            <button
                                onClick={() => setIsNewThread(true)}
                                className={`px-4 py-3 rounded-lg border text-left transition-all ${isNewThread
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="font-medium mb-1 flex items-center gap-2">
                                    <Plus size={14} />
                                    New Thread
                                </div>
                                <div className="text-xs opacity-70">Create a new conversation</div>
                            </button>
                        </div>

                        {isNewThread ? (
                            <input
                                type="text"
                                value={newThreadTitle}
                                onChange={(e) => setNewThreadTitle(e.target.value)}
                                placeholder="Enter thread title..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                autoFocus
                            />
                        ) : (
                            <select
                                value={selectedThreadId}
                                onChange={(e) => setSelectedThreadId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                            >
                                {threads.map(thread => (
                                    <option key={thread.id} value={thread.id}>
                                        {thread.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Command Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Command</label>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. ls -la"
                        />
                    </div>

                    {/* Content Preview/Edit */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Log Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            placeholder="Log content..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Save size={16} />
                        Import Log
                    </button>
                </div>
            </div>
        </div>
    );
};
