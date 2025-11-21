import React, { useState } from 'react';
import { ServerWebApp } from '../../types';
import { ExternalLink, Edit2, Trash2, Plus, Copy, Check } from 'lucide-react';
import { WebAppModal } from './WebAppModal';
import { useServerStore } from '../../features/servers/stores/useServerStore';

interface WebAppListProps {
    serverId: string;
    webApps: ServerWebApp[];
}

export const WebAppList: React.FC<WebAppListProps> = ({ serverId, webApps }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebApp, setEditingWebApp] = useState<ServerWebApp | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { deleteWebApp } = useServerStore();

    const handleAdd = () => {
        setEditingWebApp(null);
        setIsModalOpen(true);
    };

    const handleEdit = (webApp: ServerWebApp) => {
        setEditingWebApp(webApp);
        setIsModalOpen(true);
    };

    const handleDelete = (webAppId: string) => {
        if (window.confirm('本当に削除しますか？')) {
            deleteWebApp(serverId, webAppId);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-400">Web Services</h3>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <Plus size={14} />
                    Add Service
                </button>
            </div>

            {webApps.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
                    No web services registered
                </div>
            ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {webApps.map((app) => (
                        <div
                            key={app.id}
                            className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-slate-200">{app.name}</h4>
                                    <a
                                        href={app.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-500 hover:text-blue-400 transition-colors"
                                        title="Open URL"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(app)}
                                        className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(app.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {app.username && (
                                    <div className="flex items-center justify-between bg-slate-950/50 rounded px-2 py-1.5">
                                        <span className="text-slate-500 text-xs">User</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300 font-mono">{app.username}</span>
                                            <button
                                                onClick={() => handleCopy(app.username!, `user-${app.id}`)}
                                                className="text-slate-600 hover:text-slate-400"
                                            >
                                                {copiedId === `user-${app.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {app.password && (
                                    <div className="flex items-center justify-between bg-slate-950/50 rounded px-2 py-1.5">
                                        <span className="text-slate-500 text-xs">Pass</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300 font-mono">••••••••</span>
                                            <button
                                                onClick={() => handleCopy(app.password!, `pass-${app.id}`)}
                                                className="text-slate-600 hover:text-slate-400"
                                            >
                                                {copiedId === `pass-${app.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {app.note && (
                                    <div className="mt-2 text-xs text-slate-500 border-t border-slate-800/50 pt-2">
                                        {app.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <WebAppModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serverId={serverId}
                webApp={editingWebApp}
            />
        </div>
    );
};
