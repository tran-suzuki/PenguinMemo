import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/ipc'

// --------- Expose some API to the Renderer process ---------
console.log('Preload script executing...');

const api: ElectronAPI = {
    on: (channel, callback) => {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
            (callback as unknown as (...a: unknown[]) => void)(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },
    off: (channel, listener) => {
        ipcRenderer.removeListener(channel, listener as (...args: unknown[]) => void);
    },
    connectSSH: (config) => ipcRenderer.invoke('ssh-connect', config),
    disconnectSSH: (id) => ipcRenderer.send('ssh-disconnect', { id }),

    // SFTP
    sftpList: (id, path) => ipcRenderer.invoke('sftp-list', { id, path }),
    sftpUpload: (id, localPath, remotePath) => ipcRenderer.invoke('sftp-upload', { id, localPath, remotePath }),
    sftpDownload: (id, remotePath, localPath) => ipcRenderer.invoke('sftp-download', { id, remotePath, localPath }),

    // Dialogs
    showOpenDialog: () => ipcRenderer.invoke('dialog:open-file'),
    showSaveDialog: (defaultPath) => ipcRenderer.invoke('dialog:save-file', { defaultPath }),

    sendSSHData: (id, data) => ipcRenderer.send('ssh-data', { id, data }),
    resizeSSH: (id, cols, rows) => ipcRenderer.send('ssh-resize', { id, cols, rows }),

    // Gemini
    openGemini: () => ipcRenderer.send('gemini:open'),
    resizeGemini: (bounds) => ipcRenderer.send('gemini:resize', bounds),
    closeGemini: () => ipcRenderer.send('gemini:close'),

    // Shell
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', { url }),
}

contextBridge.exposeInMainWorld('electronAPI', api)
