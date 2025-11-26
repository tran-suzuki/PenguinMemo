import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { ServerItem } from '../../types';
import { AlertTriangle, Loader2, Edit, Copy, Clipboard } from 'lucide-react';
import { useUIStore } from '../../features/ui/stores/useUIStore';

interface SSHTerminalProps {
    server: ServerItem;
}

export const SSHTerminal: React.FC<SSHTerminalProps> = ({ server }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const openServerModal = useUIStore(state => state.openServerModal);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const isConnectedRef = useRef(false);

    useEffect(() => {
        if (!terminalRef.current || !window.electronAPI) return;

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#0f172a', // slate-900
                foreground: '#e2e8f0', // slate-200
            }
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(terminalRef.current);

        // Initial fit
        setTimeout(() => {
            fitAddon.fit();
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Handle input
        term.onData((data) => {
            if (isConnectedRef.current) {
                window.electronAPI?.sendSSHData(server.id, data);
            }
        });

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
            if (isConnectedRef.current) {
                window.electronAPI?.resizeSSH(server.id, term.cols, term.rows);
            }
        };

        window.addEventListener('resize', handleResize);

        // Connect to SSH
        const connect = async () => {
            setIsConnecting(true);
            setError(null);
            isConnectedRef.current = false;
            term.write('\r\nConnecting to ' + server.host + '...\r\n');

            try {
                await window.electronAPI?.connectSSH({
                    id: server.id,
                    host: server.host,
                    port: server.port || 22,
                    username: server.username,
                    password: server.password,
                    privateKey: server.authType === 'key' ? server.authValue : undefined
                });

                setIsConnected(true);
                isConnectedRef.current = true;
                setIsConnecting(false);
                term.write('\r\nConnected!\r\n');

                // Initial resize sync
                window.electronAPI?.resizeSSH(server.id, term.cols, term.rows);

            } catch (err: any) {
                console.error('SSH Connection failed:', err);
                setError(err.toString());
                setIsConnecting(false);
                isConnectedRef.current = false;
                term.write('\r\nConnection failed: ' + err.toString() + '\r\n');
            }
        };

        connect();

        // Listen for data from main process
        const cleanupDataListener = window.electronAPI.on(`ssh-data-${server.id}`, (data: string) => {
            term.write(data);
        });

        const cleanupCloseListener = window.electronAPI.on(`ssh-closed-${server.id}`, () => {
            setIsConnected(false);
            isConnectedRef.current = false;
            term.write('\r\nConnection closed.\r\n');
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            cleanupDataListener();
            cleanupCloseListener();
            window.electronAPI?.disconnectSSH(server.id);
            term.dispose();
            isConnectedRef.current = false;
        };
    }, [server]);

    // Re-fit on container resize (using ResizeObserver)
    useEffect(() => {
        if (!terminalRef.current || !fitAddonRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            fitAddonRef.current?.fit();
            if (xtermRef.current && isConnected) {
                window.electronAPI?.resizeSSH(server.id, xtermRef.current.cols, xtermRef.current.rows);
            }
        });

        resizeObserver.observe(terminalRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isConnected, server.id]);

    // Handle Context Menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleCopy = () => {
        if (xtermRef.current) {
            const selection = xtermRef.current.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection);
            }
        }
        setContextMenu(null);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && isConnectedRef.current) {
                window.electronAPI.sendSSHData(server.id, text);
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
        setContextMenu(null);
    };

    return (
        <div
            className="flex-1 flex flex-col h-full bg-slate-900 relative overflow-hidden"
            onContextMenu={handleContextMenu}
        >
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{error}</span>
                    <button
                        onClick={() => openServerModal(server.id)}
                        className="ml-2 bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                        <Edit size={12} /> Edit Connection
                    </button>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 hover:bg-white/20 rounded p-0.5"
                    >
                        ×
                    </button>
                </div>
            )}

            {isConnecting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-400" />
                        <span className="text-slate-300 font-medium">Connecting to {server.host}...</span>
                    </div>
                </div>
            )}

            <div ref={terminalRef} className="flex-1 w-full h-full" />

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 w-32"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onClick={handleCopy}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Copy size={14} /> Copy
                    </button>
                    <button
                        onClick={handlePaste}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Clipboard size={14} /> Paste
                    </button>
                </div>
            )}
        </div>
    );
};
