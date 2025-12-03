import React from 'react';
import { ExternalLink, AppWindow, X } from 'lucide-react';

interface LinkOpenConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    onConfirm: (mode: 'app' | 'browser') => void;
}

export const LinkOpenConfirmModal: React.FC<LinkOpenConfirmModalProps> = ({ isOpen, onClose, url, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">リンクを開く</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-slate-400 mb-2">以下のリンクを開こうとしています:</p>
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 break-all text-blue-400 text-sm font-mono">
                            {url}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onConfirm('app')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all group"
                        >
                            <div className="p-3 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 rounded-full transition-colors">
                                <AppWindow size={24} />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold text-slate-200 group-hover:text-white">アプリで開く</div>
                                <div className="text-[10px] text-slate-500 mt-1">新しいウィンドウ</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onConfirm('browser')}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 rounded-xl transition-all group"
                        >
                            <div className="p-3 bg-green-500/10 text-green-400 group-hover:bg-green-500/20 rounded-full transition-colors">
                                <ExternalLink size={24} />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold text-slate-200 group-hover:text-white">ブラウザで開く</div>
                                <div className="text-[10px] text-slate-500 mt-1">規定のブラウザ</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
