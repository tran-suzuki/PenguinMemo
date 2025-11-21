import React, { useState } from 'react';
import { X, ArrowRight, Trash2, FileText, Check, AlertCircle, Folder } from 'lucide-react';

interface BulkConfigImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (entries: { path: string; content: string; type: string }[]) => void;
}

interface ParsedConfig {
    id: string;
    path: string;
    content: string;
    type: string;
}

export const BulkConfigImportModal: React.FC<BulkConfigImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [rawInput, setRawInput] = useState('');
    const [parsedConfigs, setParsedConfigs] = useState<ParsedConfig[]>([]);

    if (!isOpen) return null;

    const detectType = (path: string): string => {
        const lowerPath = path.toLowerCase();
        if (lowerPath.includes('nginx')) return 'nginx';
        if (lowerPath.includes('apache') || lowerPath.includes('httpd')) return 'apache';
        if (lowerPath.includes('cron') || lowerPath.endsWith('crontab')) return 'cron';
        if (lowerPath.includes('systemd') || lowerPath.endsWith('.service')) return 'systemd';
        if (lowerPath.includes('docker') || lowerPath.endsWith('Dockerfile')) return 'docker';
        if (lowerPath.endsWith('.yml') || lowerPath.endsWith('.yaml')) return 'yaml';
        if (lowerPath.endsWith('.json')) return 'json';
        if (lowerPath.endsWith('.env')) return 'env';
        if (lowerPath.endsWith('.sh')) return 'shell';
        if (lowerPath.endsWith('.py')) return 'python';
        if (lowerPath.endsWith('.js') || lowerPath.endsWith('.ts')) return 'js';
        if (lowerPath.endsWith('.sql')) return 'sql';
        if (lowerPath.includes('ssh_config') || lowerPath.includes('sshd_config')) return 'ssh';
        return 'other';
    };

    const parseConfigs = () => {
        if (!rawInput.trim()) return;

        const lines = rawInput.split('\n');
        const configs: ParsedConfig[] = [];

        let currentDir = '';
        let currentFile: string | null = null;
        let currentContent: string[] = [];

        // Regex to detect prompt lines
        // Standard: [user@host dir]$ command
        const standardPromptRegex = /^\[?([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+(?:\s+|:)([^\]\$#]+)\]?[\$#]\s+(.*)$/;

        // Multi-line context: [user@host dir][branch]
        const contextLineRegex = /^\[([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+\s+([^\]]+)\](?:\[.*\])?$/;

        // Multi-line command: > command
        const commandLineRegex = /^>\s+(.*)$/;

        // State flags
        let expectingPwdOutput = false;

        const saveCurrentFile = () => {
            if (currentFile && currentContent.length > 0) {
                // Resolve path
                let fullPath = currentFile;
                if (!currentFile.startsWith('/') && currentDir) {
                    fullPath = `${currentDir.replace(/\/$/, '')}/${currentFile}`;
                }

                configs.push({
                    id: Math.random().toString(36).substr(2, 9),
                    path: fullPath,
                    content: currentContent.join('\n').trim(),
                    type: detectType(fullPath)
                });
            }
            currentFile = null;
            currentContent = [];
        };

        lines.forEach((line) => {
            const trimmedLine = line.trim();

            // 1. Check for Standard Prompt
            const standardMatch = line.match(standardPromptRegex);

            // 2. Check for Context Line (Multi-line prompt)
            const contextMatch = line.match(contextLineRegex);

            // 3. Check for Command Line (Multi-line prompt)
            const commandMatch = line.match(commandLineRegex);

            let command = '';

            if (standardMatch) {
                // Standard Prompt detected
                command = standardMatch[3].trim();

                if (currentFile) saveCurrentFile();

                const promptDir = standardMatch[2].trim();
                if (promptDir && promptDir !== '~' && promptDir.startsWith('/')) {
                    currentDir = promptDir;
                }

            } else if (contextMatch) {
                // Context line detected, just update dir and wait for next line
                if (currentFile) saveCurrentFile();

                const promptDir = contextMatch[2].trim();
                if (promptDir && promptDir !== '~' && promptDir.startsWith('/')) {
                    currentDir = promptDir;
                }
                return; // Skip processing this line further

            } else if (commandMatch) {
                // Command line detected (> command)
                command = commandMatch[1].trim();
                if (currentFile) saveCurrentFile();

            } else {
                // No prompt, check heuristics
                if (trimmedLine === 'pwd') {
                    command = 'pwd';
                    if (currentFile) saveCurrentFile();
                } else if (trimmedLine.startsWith('cat ')) {
                    command = trimmedLine;
                    if (currentFile) saveCurrentFile();
                }
            }

            // Process Command or Content
            if (command) {
                // It's a command line
                if (command === 'pwd') {
                    expectingPwdOutput = true;
                } else if (command.startsWith('cat ')) {
                    expectingPwdOutput = false;
                    const args = command.split(/\s+/);
                    if (args.length >= 2) {
                        currentFile = args[1];
                    }
                } else {
                    // Other command, stop reading file
                    expectingPwdOutput = false;
                    if (currentFile) saveCurrentFile();
                }
            } else {
                // It's output or content
                if (expectingPwdOutput) {
                    if (trimmedLine.startsWith('/')) {
                        currentDir = trimmedLine;
                    }
                    expectingPwdOutput = false;
                } else if (currentFile) {
                    currentContent.push(line);
                }
            }
        });

        // Save last file
        if (currentFile) {
            saveCurrentFile();
        }

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
