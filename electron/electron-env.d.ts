/// <reference types="vite-plugin-electron/electron-env" />

import type { ElectronAPI } from '../shared/ipc';

declare namespace NodeJS {
    interface ProcessEnv {
        DIST: string
        VITE_PUBLIC: string
    }
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export {};
