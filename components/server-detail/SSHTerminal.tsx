import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { ServerItem } from '../../types';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
            if (isConnected) {
                window.electronAPI?.sendSSHData(server.id, data);
            }
        });

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
            if (isConnected) {
                window.electronAPI?.resizeSSH(server.id, term.cols, term.rows);
            }
        };

        window.addEventListener('resize', handleResize);

        // Connect to SSH
        const connect = async () => {
            setIsConnecting(true);
            setError(null);
            term.write('\r\nConnecting to ' + server.host + '...\r\n');

            try {
                await window.electronAPI?.connectSSH({
                    id: server.id,
                    host: server.host,
                    port: server.port || 22,
                    username: server.username,
                    password: server.password,
                    privateKey: server.privateKey
                });

                setIsConnected(true);
                setIsConnecting(false);
                term.write('\r\nConnected!\r\n');

                // Initial resize sync
                window.electronAPI?.resizeSSH(server.id, term.cols, term.rows);

            } catch (err: any) {
                console.error('SSH Connection failed:', err);
                setError(err.toString());
                setIsConnecting(false);
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
            term.write('\r\nConnection closed.\r\n');
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            cleanupDataListener();
            cleanupCloseListener();
            window.electronAPI?.disconnectSSH(server.id);
            term.dispose();
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

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900 relative overflow-hidden">
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{error}</span>
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
        </div>
    );
};
