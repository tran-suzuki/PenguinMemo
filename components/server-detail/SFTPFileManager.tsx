import React, { useState, useEffect, useRef } from 'react';
import { ServerItem, SFTPFile } from '../../types';
import { Folder, File, RefreshCw, Upload, Download, ArrowLeft, Home, HardDrive, ChevronRight, Loader2, FolderPlus, Edit2 } from 'lucide-react';
import { Toast, ToastType } from '../Toast';

interface SFTPFileManagerProps {
    server: ServerItem;
}

export const SFTPFileManager: React.FC<SFTPFileManagerProps> = ({ server }) => {
    const [currentPath, setCurrentPath] = useState('.');
    const [files, setFiles] = useState<SFTPFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SFTPFile | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: '',
        type: 'success'
    });


    const connectionId = `sftp-${server.id}`;
    const [isConnected, setIsConnected] = useState(false);

    // Establish SSH Connection for SFTP
    useEffect(() => {
        let mounted = true;

        const connect = async () => {
            if (!window.electronAPI) return;
            setIsLoading(true);
            try {
                await window.electronAPI.connectSSH({
                    id: connectionId,
                    host: server.host,
                    port: server.port || 22,
                    username: server.username,
                    password: server.password,
                    privateKey: server.authType === 'key' ? server.authValue : undefined
                });
                if (mounted) {
                    setIsConnected(true);
                    loadFiles('.');
                }
            } catch (error: any) {
                if (mounted) {
                    setToast({
                        visible: true,
                        message: `SFTP Connection failed: ${error}`,
                        type: 'error'
                    });
                    setIsLoading(false);
                }
            }
        };

        connect();

        return () => {
            mounted = false;
            window.electronAPI?.disconnectSSH(connectionId);
        };
    }, [server.id, connectionId]);

    const loadFiles = async (path: string) => {
        if (!window.electronAPI) return;
        setIsLoading(true);
        try {
            const list = await window.electronAPI.sftpList(connectionId, path);
            // Sort: Directories first, then files. Both alphabetical.
            const sorted = list.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
            setFiles(sorted);
            setCurrentPath(path);
            setSelectedFile(null);
        } catch (error: any) {
            setToast({
                visible: true,
                message: `Failed to load files: ${error}`,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        loadFiles(path);
    };

    const handleFileClick = (file: SFTPFile) => {
        setSelectedFile(file);
    };

    const handleFileDoubleClick = (file: SFTPFile) => {
        if (file.isDirectory) {
            const newPath = currentPath === '.' ? file.name : `${currentPath}/${file.name}`;
            handleNavigate(newPath);
        }
    };

    const handleUpDir = () => {
        if (currentPath === '.' || currentPath === '/') return;
        const parts = currentPath.split('/');
        parts.pop();
        const newPath = parts.length === 0 ? '/' : parts.join('/') || '/';
        handleNavigate(newPath);
    };

    const handleRefresh = () => {
        loadFiles(currentPath);
    };

    const handleUpload = async () => {
        if (!window.electronAPI) return;

        try {
            const localPath = await window.electronAPI.showOpenDialog();
            if (!localPath) return; // Canceled

            // Extract filename from local path for remote path
            // Simple extraction for Windows/Unix paths
            const filename = localPath.split(/[/\\]/).pop();
            if (!filename) return;

            const remotePath = currentPath === '.' ? filename : `${currentPath}/${filename}`;

            setIsLoading(true);
            await window.electronAPI.sftpUpload(connectionId, localPath, remotePath);
            setToast({ visible: true, message: `Uploaded ${filename}`, type: 'success' });
            loadFiles(currentPath);
        } catch (error: any) {
            setToast({ visible: true, message: `Upload failed: ${error}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedFile || selectedFile.isDirectory || !window.electronAPI) return;

        try {
            const defaultPath = selectedFile.name;
            const localPath = await window.electronAPI.showSaveDialog(defaultPath);
            if (!localPath) return; // Canceled

            setIsLoading(true);
            const remotePath = currentPath === '.' ? selectedFile.name : `${currentPath}/${selectedFile.name}`;

            await window.electronAPI.sftpDownload(connectionId, remotePath, localPath);
            setToast({ visible: true, message: `Downloaded ${selectedFile.name}`, type: 'success' });
        } catch (error: any) {
            setToast({ visible: true, message: `Download failed: ${error}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMkdir = async () => {
        if (!window.electronAPI) return;
        const name = prompt('Enter folder name:');
        if (!name) return;

        try {
            setIsLoading(true);
            const path = currentPath === '.' ? name : `${currentPath}/${name}`;
            await window.electronAPI.sftpMkdir(connectionId, path);
            setToast({ visible: true, message: `Created folder ${name}`, type: 'success' });
            loadFiles(currentPath);
        } catch (error: any) {
            setToast({ visible: true, message: `Failed to create folder: ${error}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRename = async () => {
        if (!selectedFile || !window.electronAPI) return;
        const newName = prompt('Enter new name:', selectedFile.name);
        if (!newName || newName === selectedFile.name) return;

        try {
            setIsLoading(true);
            const oldPath = currentPath === '.' ? selectedFile.name : `${currentPath}/${selectedFile.name}`;
            const newPath = currentPath === '.' ? newName : `${currentPath}/${newName}`;
            await window.electronAPI.sftpRename(connectionId, oldPath, newPath);
            setToast({ visible: true, message: `Renamed to ${newName}`, type: 'success' });
            loadFiles(currentPath);
        } catch (error: any) {
            setToast({ visible: true, message: `Rename failed: ${error}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (ms: number) => {
        return new Date(ms).toLocaleString();
    };

    const renderPermissions = (perms: string) => {
        // d rwx r-x r-x
        const type = perms.charAt(0);
        const user = perms.slice(1, 4);
        const group = perms.slice(4, 7);
        const other = perms.slice(7, 10);

        return (
            <span className="font-mono">
                <span className={type === 'd' ? 'text-blue-400' : 'text-slate-500'}>{type}</span>
                <span className="text-green-400">{user}</span>
                <span className="text-yellow-400">{group}</span>
                <span className="text-red-400">{other}</span>
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0c] text-slate-300">
            <Toast
                isVisible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Toolbar */}
            <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/50">
                <button
                    onClick={handleUpDir}
                    disabled={currentPath === '/' || currentPath === '.'}
                    className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <button
                    onClick={() => handleNavigate('.')}
                    className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                    title="Home"
                >
                    <Home size={18} />
                </button>

                <div className="flex-1 mx-2 bg-slate-950 border border-slate-700 rounded flex items-center px-3 py-1.5">
                    <span className="text-slate-500 mr-2">/</span>
                    <input
                        type="text"
                        value={currentPath}
                        onChange={(e) => setCurrentPath(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigate(currentPath)}
                        className="bg-transparent border-none outline-none flex-1 text-sm font-mono text-slate-200"
                    />
                </div>

                <button
                    onClick={handleRefresh}
                    className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                    title="Refresh"
                >
                    <RefreshCw size={18} />
                </button>

                <div className="w-px h-6 bg-slate-800 mx-1" />

                <button
                    onClick={handleMkdir}
                    className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                    title="New Folder"
                >
                    <FolderPlus size={18} />
                </button>

                <button
                    onClick={handleRename}
                    disabled={!selectedFile}
                    className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-400 hover:text-white"
                    title="Rename"
                >
                    <Edit2 size={18} />
                </button>

                <div className="w-px h-6 bg-slate-800 mx-1" />

                <button
                    onClick={handleUpload}
                    className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                    <Upload size={16} />
                    Upload
                </button>
                <button
                    onClick={handleDownload}
                    disabled={!selectedFile || selectedFile.isDirectory}
                    className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    <Download size={16} />
                    Download
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-2 border-b border-slate-800 w-8"></th>
                            <th className="px-4 py-2 border-b border-slate-800">Name</th>
                            <th className="px-4 py-2 border-b border-slate-800 w-24 text-right">Size</th>
                            <th className="px-4 py-2 border-b border-slate-800 w-32">Owner</th>
                            <th className="px-4 py-2 border-b border-slate-800 w-40">Date</th>
                            <th className="px-4 py-2 border-b border-slate-800 w-24">Perms</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-mono">
                        {files.map((file, i) => (
                            <tr
                                key={file.name + i}
                                onClick={() => handleFileClick(file)}
                                onDoubleClick={() => handleFileDoubleClick(file)}
                                className={`cursor-pointer transition-colors ${selectedFile === file ? 'bg-blue-900/30' : 'hover:bg-slate-800/50'
                                    }`}
                            >
                                <td className="px-4 py-2 border-b border-slate-800/50 text-slate-400">
                                    {file.isDirectory ? <Folder size={16} className="text-blue-400" /> : <File size={16} />}
                                </td>
                                <td className="px-4 py-2 border-b border-slate-800/50">
                                    <span className={`${file.isDirectory ? 'text-blue-400 font-bold' : 'text-slate-200'} ${file.name.startsWith('.') ? 'opacity-70' : ''}`}>
                                        {file.name}
                                    </span>
                                </td>
                                <td className="px-4 py-2 border-b border-slate-800/50 text-right text-slate-500">
                                    {file.isDirectory ? '-' : formatSize(file.size)}
                                </td>
                                <td className="px-4 py-2 border-b border-slate-800/50 text-slate-400 text-xs">
                                    {file.owner} {file.group && <span className="text-slate-600">:{file.group}</span>}
                                </td>
                                <td className="px-4 py-2 border-b border-slate-800/50 text-slate-500">
                                    {formatDate(file.modifyTime)}
                                </td>
                                <td className="px-4 py-2 border-b border-slate-800/50 text-xs">
                                    {renderPermissions(file.permissions)}
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                    No files found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
