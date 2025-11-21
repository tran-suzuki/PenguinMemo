import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel: string, callback: (data: any) => void) => {
        const subscription = (_event: any, ...args: any[]) => (callback as any)(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },
    off: (channel: string, listener: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, listener);
    },
    connectSSH: (config: any) => ipcRenderer.invoke('ssh-connect', config),
    disconnectSSH: (id: string) => ipcRenderer.send('ssh-disconnect', { id }),
    sendSSHData: (id: string, data: string) => ipcRenderer.send('ssh-data', { id, data }),
    resizeSSH: (id: string, cols: number, rows: number) => ipcRenderer.send('ssh-resize', { id, cols, rows }),
})
