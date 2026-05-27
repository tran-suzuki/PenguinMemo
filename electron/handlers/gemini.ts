import { ipcMain, BrowserView, BrowserWindow } from 'electron'

let geminiView: BrowserView | null = null;

export function registerGeminiHandlers(getWin: () => BrowserWindow | null) {
    ipcMain.on('gemini:open', () => {
        if (geminiView) return; // Already open

        const win = getWin();
        if (!win) return;

        geminiView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        win.setBrowserView(geminiView);
        geminiView.webContents.loadURL('https://gemini.google.com/app');

        // Initial bounds - will be updated by resize event immediately
        geminiView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    });

    ipcMain.on('gemini:resize', (_event, bounds) => {
        if (geminiView) {
            geminiView.setBounds(bounds);
        }
    });

    ipcMain.on('gemini:close', () => {
        const win = getWin();
        if (geminiView && win) {
            win.removeBrowserView(geminiView);
            // geminiView.webContents.destroy(); // Optional: destroy if you want to clear state
            geminiView = null;
        }
    });
}
