import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    isVisible,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={18} className="text-green-400" />;
            case 'error': return <X size={18} className="text-red-400" />;
            case 'warning': return <AlertCircle size={18} className="text-yellow-400" />;
            case 'info': return <Info size={18} className="text-blue-400" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-slate-900 border-green-500/30';
            case 'error': return 'bg-slate-900 border-red-500/30';
            case 'warning': return 'bg-slate-900 border-yellow-500/30';
            case 'info': return 'bg-slate-900 border-blue-500/30';
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl shadow-black/50 animate-in slide-in-from-bottom-2 fade-in duration-300 ${getBgColor()}`}>
            {getIcon()}
            <span className="text-sm font-medium text-slate-200">{message}</span>
            <button onClick={onClose} className="ml-2 text-slate-500 hover:text-white transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};
