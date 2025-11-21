import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-sm animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-medium text-slate-200 mb-1">
                        {offlineReady ? '準備完了' : '新しいバージョンがあります'}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {offlineReady
                            ? 'アプリはオフラインで使用できます。'
                            : 'クリックして更新してください。'}
                    </p>
                </div>
                <button
                    onClick={close}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {needRefresh && (
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                    <RefreshCw size={16} />
                    更新してリロード
                </button>
            )}
        </div>
    );
}
