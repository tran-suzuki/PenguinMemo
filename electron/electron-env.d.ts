/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
    interface ProcessEnv {
        DIST: string
        VITE_PUBLIC: string
    }
}
/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
    interface ProcessEnv {
        DIST: string
        VITE_PUBLIC: string
    }
}

interface Window {
    electronAPI?: {
        on: (channel: string, callback: (data: any) => void) => () => void;
        off: (channel: string, listener: (...args: any[]) => void) => void;
        connectSSH: (config: any) => Promise<void>;
        disconnectSSH: (id: string) => void;
        sftpList: (id: string, path: string) => Promise<import('../types').SFTPFile[]>;
        sftpUpload: (id: string, localPath: string, remotePath: string) => Promise<void>;
        sftpDownload: (id: string, remotePath: string, localPath: string) => Promise<void>;
        showOpenDialog: () => Promise<string | null>;
        showSaveDialog: (defaultPath: string) => Promise<string | null>;
        sendSSHData: (id: string, data: string) => void;
        resizeSSH: (id: string, cols: number, rows: number) => void;
    }
}
