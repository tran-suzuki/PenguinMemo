import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2, FileText, Check, AlertCircle, Folder } from 'lucide-react';
import { parseConfigsFromOutput, ParsedConfig } from '../../utils/configParser';

interface BulkConfigImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (entries: { path: string; content: string; type: string }[]) => void;
    // ターミナルからの「Import to Configs」で選択テキストを初期表示する
    initialContent?: string;
}

export const BulkConfigImportModal: React.FC<BulkConfigImportModalProps> = ({ isOpen, onClose, onImport, initialContent = '' }) => {
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [rawInput, setRawInput] = useState('');
    const [parsedConfigs, setParsedConfigs] = useState<ParsedConfig[]>([]);

    // 開いたときに初期内容を反映（ヘッダの一括インポートは空、ターミナル選択時は選択内容）
    useEffect(() => {
        if (isOpen) {
            setRawInput(initialContent);
            setStep('input');
            setParsedConfigs([]);
        }
    }, [isOpen, initialContent]);

    if (!isOpen) return null;

    const parseConfigs = () => {
        if (!rawInput.trim()) return;
        const configs = parseConfigsFromOutput(rawInput);
        setParsedConfigs(configs);
        setStep('preview');
    };

    const handleImport = () => {
        onImport(parsedConfigs.map(({ path, content, type }) => ({
            path,
            content,
            type
        })));
        handleClose();
    };

    const handleClose = () => {
        setStep('input');
        setRawInput('');
        setParsedConfigs([]);
        onClose();
    };

    const removeEntry = (id: string) => {
        setParsedConfigs(prev => prev.filter(e => e.id !== id));
    };

    const updateEntry = (id: string, field: keyof ParsedConfig, value: string) => {
        setParsedConfigs(prev => prev.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" />
                        設定ファイル一括インポート
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {step === 'input' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                                <AlertCircle className="text-blue-400 shrink-0" size={20} />
                                <div className="text-sm text-slate-300">
                                    <p className="font-bold text-blue-400 mb-1">使い方</p>
                                    <p><code>pwd</code> と <code>cat</code> コマンドを含むターミナル履歴を貼り付けてください。</p>
                                    <div className="mt-2 bg-black/30 p-2 rounded border border-blue-500/20 font-mono text-xs text-slate-400">
                                        <p>$ pwd</p>
                                        <p>/etc/nginx</p>
                                        <p>$ cat nginx.conf</p>
                                        <p>user nginx;</p>
                                        <p>...</p>
                                    </div>
                                </div>
                            </div>

                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                className="w-full h-80 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder={`[user@host ~]$ pwd
/etc/nginx
[user@host ~]$ cat nginx.conf
...`}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-sm text-slate-400">
                                <span className="text-white font-bold">{parsedConfigs.length}</span> 件のファイルを検出しました。
                            </p>

                            {parsedConfigs.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    ファイルが見つかりませんでした。<br />
                                    <code>pwd</code> や <code>cat</code> コマンドが含まれているか確認してください。
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {parsedConfigs.map((config, index) => (
                                        <div key={config.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                                                    <Folder size={14} className="text-yellow-500" />
                                                    <input
                                                        value={config.path}
                                                        onChange={(e) => updateEntry(config.id, 'path', e.target.value)}
                                                        className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 outline-none text-sm font-mono text-white w-96 transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeEntry(config.id)}
                                                    className="text-slate-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-2">
                                                <textarea
                                                    value={config.content}
                                                    onChange={(e) => updateEntry(config.id, 'content', e.target.value)}
                                                    className="w-full h-32 bg-black border border-slate-800 rounded px-3 py-2 font-mono text-xs text-slate-300 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                    {step === 'preview' ? (
                        <button
                            onClick={() => setStep('input')}
                            className="text-slate-400 hover:text-white text-sm font-medium"
                        >
                            戻って編集
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            キャンセル
                        </button>

                        {step === 'input' ? (
                            <button
                                onClick={parseConfigs}
                                disabled={!rawInput.trim()}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                解析する
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleImport}
                                disabled={parsedConfigs.length === 0}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Check size={16} />
                                インポート
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
