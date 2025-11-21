import React, { useState, useMemo } from 'react';
import { ServerConfig } from '../../types';
import { File, Folder, FolderOpen, Plus, Trash2, FileCode, Settings, Clock, Server, Database, Terminal, Code, Shield } from 'lucide-react';

interface ConfigListProps {
    configs: ServerConfig[];
    activeConfigId: string | null;
    onSelectConfig: (id: string) => void;
    onCreateConfig: () => void;
    onDeleteConfig: (id: string) => void;
    isSearching?: boolean;
}

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: TreeNode[];
    configId?: string;
    configType?: string;
}

export const ConfigList: React.FC<ConfigListProps> = ({
    configs,
    activeConfigId,
    onSelectConfig,
    onCreateConfig,
    onDeleteConfig,
    isSearching
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Build Tree Structure
    const tree = useMemo(() => {
        const root: TreeNode[] = [];

        configs.forEach(config => {
            const parts = config.path.split('/').filter(Boolean);
            let currentLevel = root;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                const existingNode = currentLevel.find(node => node.name === part);

                if (existingNode) {
                    if (isFile) {
                        // Should not happen if paths are unique, but handle gracefully
                        existingNode.configId = config.id;
                        existingNode.configType = config.type;
                    } else {
                        currentLevel = existingNode.children!;
                    }
                } else {
                    const newNode: TreeNode = {
                        name: part,
                        path: '/' + parts.slice(0, index + 1).join('/'),
                        type: isFile ? 'file' : 'folder',
                        children: isFile ? undefined : [],
                        configId: isFile ? config.id : undefined,
                        configType: isFile ? config.type : undefined
                    };
                    currentLevel.push(newNode);
                    if (!isFile) {
                        currentLevel = newNode.children!;
                    }
                }
            });
        });

        // Sort: Folders first, then files, alphabetically
        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });
            nodes.forEach(node => {
                if (node.children) sortNodes(node.children);
            });
        };

        sortNodes(root);
        return root;
    }, [configs]);

    // Auto-expand when searching
    React.useEffect(() => {
        if (isSearching) {
            const getAllFolderPaths = (nodes: TreeNode[]): string[] => {
                let paths: string[] = [];
                nodes.forEach(node => {
                    if (node.type === 'folder') {
                        paths.push(node.path);
                        if (node.children) {
                            paths = [...paths, ...getAllFolderPaths(node.children)];
                        }
                    }
                });
                return paths;
            };
            setExpandedFolders(new Set(getAllFolderPaths(tree)));
        }
    }, [tree, isSearching]);

    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'nginx':
            case 'apache':
                return <Server size={14} className="text-green-400" />;
            case 'cron':
                return <Clock size={14} className="text-blue-400" />;
            case 'systemd':
                return <Settings size={14} className="text-orange-400" />;
            case 'docker':
            case 'k8s':
                return <Server size={14} className="text-blue-300" />;
            case 'sql':
            case 'db':
                return <Database size={14} className="text-yellow-400" />;
            case 'shell':
                return <Terminal size={14} className="text-slate-300" />;
            case 'python':
            case 'js':
            case 'ts':
                return <Code size={14} className="text-yellow-300" />;
            case 'ssh':
                return <Shield size={14} className="text-purple-400" />;
            case 'env':
            case 'ini':
            case 'toml':
            case 'json':
            case 'yaml':
                return <Settings size={14} className="text-slate-400" />;
            default:
                return <FileCode size={14} className="text-slate-500" />;
        }
    };

    // Sort configs for list view
    const sortedConfigs = useMemo(() => {
        return [...configs].sort((a, b) => a.path.localeCompare(b.path));
    }, [configs]);

    const renderNode = (node: TreeNode, level: number) => {
        const isExpanded = expandedFolders.has(node.path);
        const isActive = node.configId === activeConfigId;

        return (
            <div key={node.path}>
                <div
                    className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors group ${isActive ? 'bg-blue-900/30 text-blue-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            toggleFolder(node.path);
                        } else if (node.configId) {
                            onSelectConfig(node.configId);
                        }
                    }}
                >
                    {node.type === 'folder' ? (
                        <>
                            {isExpanded ? <FolderOpen size={14} className="text-yellow-500" /> : <Folder size={14} className="text-yellow-500" />}
                            <span className="text-xs truncate">{node.name}</span>
                        </>
                    ) : (
                        <>
                            {getIcon(node.configType || 'other')}
                            <span className="text-xs truncate flex-1">{node.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('本当に削除しますか？')) {
                                        if (node.configId) onDeleteConfig(node.configId);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                </div>
                {node.type === 'folder' && isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isSearching ? 'Search Results' : 'Configs'}
                </span>
                {!isSearching && (
                    <button
                        onClick={onCreateConfig}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors"
                        title="新規設定ファイル"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {configs.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <Settings size={24} className="mx-auto text-slate-700 mb-2" />
                        <p className="text-xs text-slate-600">
                            {isSearching ? '見つかりませんでした' : '設定ファイルがありません'}
                        </p>
                        {!isSearching && (
                            <button
                                onClick={onCreateConfig}
                                className="mt-2 text-xs text-blue-500 hover:text-blue-400"
                            >
                                作成する
                            </button>
                        )}
                    </div>
                ) : (
                    tree.map(node => renderNode(node, 0))
                )}
            </div>
        </aside>
    );
};
