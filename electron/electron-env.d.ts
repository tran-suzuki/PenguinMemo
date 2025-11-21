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
        sendSSHData: (id: string, data: string) => void;
        resizeSSH: (id: string, cols: number, rows: number) => void;
    }
}
