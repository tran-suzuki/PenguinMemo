/// <reference types="vite/client" />

declare const __BUILD_TIME__: string;

interface Window {
    electronAPI: {
        on: (channel: string, callback: (data: any) => void) => () => void;
        off: (channel: string, listener: (...args: any[]) => void) => void;
        connectSSH: (config: any) => Promise<boolean>;
        disconnectSSH: (id: string) => void;
        sftpList: (id: string, path: string) => Promise<any[]>;
        sftpUpload: (id: string, localPath: string, remotePath: string) => Promise<boolean>;
        sftpDownload: (id: string, remotePath: string, localPath: string) => Promise<boolean>;
        showOpenDialog: () => Promise<string | null>;
        showSaveDialog: (defaultPath: string) => Promise<string | null>;
        sendSSHData: (id: string, data: string) => void;
        resizeSSH: (id: string, cols: number, rows: number) => void;
        openGemini: () => void;
        resizeGemini: (bounds: { x: number, y: number, width: number, height: number }) => void;
        closeGemini: () => void;
    }
}
