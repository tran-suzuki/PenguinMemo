import React from 'react';
import { ServerConfig } from '../../types';
import { FileCode, Folder, Calendar, Database, Server, Settings, Terminal, Code, Shield, Clock } from 'lucide-react';

interface ConfigSearchResultsProps {
    results: ServerConfig[];
    onSelect: (id: string) => void;
}

export const ConfigSearchResults: React.FC<ConfigSearchResultsProps> = ({ results, onSelect }) => {
    // Sort by directory hierarchy (path)
    const sortedResults = [...results].sort((a, b) => a.path.localeCompare(b.path));

    const getIcon = (type: string) => {
        switch (type) {
            case 'nginx':
            case 'apache':
                return <Server size={16} className="text-green-400" />;
            case 'cron':
                return <Clock size={16} className="text-blue-400" />;
            case 'systemd':
                return <Settings size={16} className="text-orange-400" />;
            case 'docker':
            case 'k8s':
                return <Server size={16} className="text-blue-300" />;
            case 'sql':
            case 'db':
                return <Database size={16} className="text-yellow-400" />;
            case 'shell':
                return <Terminal size={16} className="text-slate-300" />;
            case 'python':
            case 'js':
            case 'ts':
                return <Code size={16} className="text-yellow-300" />;
            case 'ssh':
                return <Shield size={16} className="text-purple-400" />;
            case 'env':
            case 'ini':
            case 'toml':
            case 'json':
            case 'yaml':
                return <Settings size={16} className="text-slate-400" />;
            default:
                return <FileCode size={16} className="text-slate-500" />;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (results.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <p>一致する設定ファイルが見つかりませんでした</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-blue-400" />
                    検索結果: {results.length} 件
                </h2>

                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3 w-1/3">名前</th>
                                <th className="px-4 py-3 w-1/2">フォルダ</th>
                                <th className="px-4 py-3">更新日時</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sortedResults.map((config) => {
                                const lastSlashIndex = config.path.lastIndexOf('/');
                                const name = lastSlashIndex >= 0 ? config.path.substring(lastSlashIndex + 1) : config.path;
                                const folder = lastSlashIndex >= 0 ? config.path.substring(0, lastSlashIndex) : '/';

                                return (
                                    <tr
                                        key={config.id}
                                        onClick={() => onSelect(config.id)}
                                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {getIcon(config.type)}
                                                <span className="text-slate-200 font-medium group-hover:text-blue-400 transition-colors">
                                                    {name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Folder size={14} className="text-slate-600" />
                                                {folder}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                                            {formatDate(config.updatedAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
