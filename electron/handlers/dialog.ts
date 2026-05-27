import { ipcMain, dialog, BrowserWindow } from 'electron'

export function registerDialogHandlers(getWin: () => BrowserWindow | null) {
    ipcMain.handle('dialog:open-file', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(getWin()!, {
            properties: ['openFile']
        });
        if (canceled) {
            return null;
        } else {
            return filePaths[0];
        }
    });

    ipcMain.handle('dialog:save-file', async (_event, { defaultPath }) => {
        const { canceled, filePath } = await dialog.showSaveDialog(getWin()!, {
            defaultPath
        });
        if (canceled) {
            return null;
        } else {
            return filePath;
        }
    });
}
