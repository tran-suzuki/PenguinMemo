import React, { useState, useEffect } from 'react';
import { ServerConfig } from '../../types';
import { Save, Copy, FileDiff, Type, Check } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { DiffViewer } from './LogItem';

interface ConfigEditorProps {
    config: ServerConfig | null;
    onSave: (path: string, content: string, type: string) => void;
    isNew: boolean;
}

const COMMON_TYPES = [
    { value: 'nginx', label: 'Nginx' },
    { value: 'apache', label: 'Apache' },
    { value: 'cron', label: 'Crontab' },
    { value: 'systemd', label: 'Systemd' },
    { value: 'docker', label: 'Docker' },
    { value: 'k8s', label: 'Kubernetes' },
    { value: 'env', label: 'Env File' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'toml', label: 'TOML' },
    { value: 'ini', label: 'INI' },
    { value: 'shell', label: 'Shell Script' },
    { value: 'python', label: 'Python' },
    { value: 'js', label: 'JavaScript' },
    { value: 'sql', label: 'SQL' },
    { value: 'ssh', label: 'SSH Config' },
    { value: 'other', label: 'Other' },
];

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ config, onSave, isNew }) => {
    const [path, setPath] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<string>('other');
    const [fontSize, setFontSize] = useState(14);
    const [showDiff, setShowDiff] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (config) {
            setPath(config.path);
            setContent(config.content);
            setType(config.type);
        } else if (isNew) {
            setPath('');
            setContent('');
            setType('other');
        }
        setShowDiff(false);
    }, [config, isNew]);

    // Auto-detect type from path
    useEffect(() => {
        if (!isNew) return;
        const lowerPath = path.toLowerCase();
        if (lowerPath.includes('nginx')) setType('nginx');
        else if (lowerPath.includes('apache') || lowerPath.includes('httpd')) setType('apache');
        else if (lowerPath.includes('cron') || lowerPath.endsWith('crontab')) setType('cron');
        else if (lowerPath.includes('systemd') || lowerPath.endsWith('.service')) setType('systemd');
        else if (lowerPath.includes('docker') || lowerPath.endsWith('Dockerfile')) setType('docker');
        else if (lowerPath.endsWith('.yml') || lowerPath.endsWith('.yaml')) setType('yaml');
        else if (lowerPath.endsWith('.json')) setType('json');
        else if (lowerPath.endsWith('.env')) setType('env');
        else if (lowerPath.endsWith('.sh')) setType('shell');
        else if (lowerPath.endsWith('.py')) setType('python');
        else if (lowerPath.endsWith('.js') || lowerPath.endsWith('.ts')) setType('js');
        else if (lowerPath.endsWith('.sql')) setType('sql');
        else if (lowerPath.includes('ssh_config') || lowerPath.includes('sshd_config')) setType('ssh');
    }, [path, isNew]);

    const handleSave = () => {
        if (!path.trim()) return;
        onSave(path, content, type);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!config && !isNew) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-[#0c0c0c]">
                <SettingsIcon size={48} className="opacity-20 mb-4" />
                <p>設定ファイルを選択するか、新規作成してください</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#0c0c0c] h-full">
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="/etc/nginx/sites-available/default"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={COMMON_TYPES.some(t => t.value === type) ? type : 'other'}
                            onChange={(e) => setType(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none pr-8"
                        >
                            {COMMON_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Font Size Control */}
                    <div className="flex items-center bg-slate-900 rounded border border-slate-700 mr-2">
                        <button
                            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="フォントサイズを小さく"
                        >
                            <Type size={12} />
                        </button>
                        <span className="text-xs font-mono w-6 text-center text-slate-300">{fontSize}</span>
                        <button
                            onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="フォントサイズを大きく"
                        >
                            <Type size={14} />
                        </button>
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded transition-colors"
                        title="内容をコピー"
                    >
                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>

                    {/* Diff Toggle */}
                    {!isNew && (
                        <button
                            onClick={() => setShowDiff(!showDiff)}
                            className={`p-2 rounded transition-colors flex items-center gap-2 ${showDiff ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            title={showDiff ? "エディタに戻る" : "変更差分を表示"}
                        >
                            <FileDiff size={18} />
                            <span className="text-xs font-medium hidden sm:inline">Diff</span>
                        </button>
                    )}

                    <div className="w-px h-6 bg-slate-800 mx-2" />

                    <button
                        onClick={handleSave}
                        disabled={!path.trim()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <Save size={16} />
                        保存
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {showDiff && config ? (
                    <div className="absolute inset-0 overflow-auto bg-[#0c0c0c] p-4">
                        <DiffViewer
                            before={config.content}
                            after={content}
                            fontSize={fontSize}
                        />
                    </div>
                ) : (
                    <CodeEditor
                        value={content}
                        onChange={setContent}
                        language={type === 'other' ? 'plaintext' : type}
                        fontSize={fontSize}
                        className="h-full"
                    />
                )}
            </div>
        </div>
    );
};

const SettingsIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
