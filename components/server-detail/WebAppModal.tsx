import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { ServerWebApp } from '../../types';
import { useServerStore } from '../../features/servers/stores/useServerStore';

interface WebAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
    webApp: ServerWebApp | null;
}

export const WebAppModal: React.FC<WebAppModalProps> = ({ isOpen, onClose, serverId, webApp }) => {
    const { addWebApp, updateWebApp } = useServerStore();

    const [formData, setFormData] = useState({
        name: '',
        url: '',
        username: '',
        password: '',
        note: ''
    });

    useEffect(() => {
        if (webApp) {
            setFormData({
                name: webApp.name,
                url: webApp.url,
                username: webApp.username || '',
                password: webApp.password || '',
                note: webApp.note || ''
            });
        } else {
            setFormData({
                name: '',
                url: '',
                username: '',
                password: '',
                note: ''
            });
        }
    }, [webApp, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (webApp) {
            updateWebApp(serverId, webApp.id, formData);
        } else {
            addWebApp(serverId, formData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="font-medium text-white">
                        {webApp ? 'Edit Web Service' : 'Add Web Service'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Admin Panel"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">URL</label>
                        <input
                            type="url"
                            required
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Username (Optional)</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Password (Optional)</label>
                            <input
                                type="text"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Note (Optional)</label>
                        <textarea
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} />
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
