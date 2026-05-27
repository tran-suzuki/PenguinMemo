import { ipcMain, shell } from 'electron'

export function registerShellHandlers() {
    ipcMain.handle('shell:open-external', async (_event, { url }) => {
        await shell.openExternal(url);
    });
}
