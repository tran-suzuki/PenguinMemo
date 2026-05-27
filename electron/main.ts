import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import { registerSSHHandlers, getConnection } from './handlers/ssh'
import { registerSFTPHandlers } from './handlers/sftp'
import { registerDialogHandlers } from './handlers/dialog'
import { registerShellHandlers } from './handlers/shell'
import { registerGeminiHandlers } from './handlers/gemini'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logPath = path.join(app.getPath('userData'), 'electron-debug.log');

function logToFile(message: string) {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
}

// The built directory structure
//
// ├─┬─ dist
// │ ├─┬─ electron
// │ │ ├── main.js
// │ │ └── preload.js
// │ ├── index.html
// │ ├── ...other-static-files-from-public
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    logToFile('Main Process: Creating window...');
    logToFile(`Main Process: Preload path: ${path.join(__dirname, 'preload.js')}`);
    logToFile(`Main Process: User Data path: ${app.getPath('userData')}`);

    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST, 'index.html'))
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// --- Window Open Handler ---
// Allow window.open to create new windows (for "Open in App")
app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => {
        // Allow all internal window opens
        return { action: 'allow' };
    });
});

app.whenReady().then(() => {
    createWindow();

    // Register IPC handlers, injecting shared dependencies
    const getWin = () => win;
    registerSSHHandlers(getWin);
    registerSFTPHandlers(getConnection);
    registerDialogHandlers(getWin);
    registerShellHandlers();
    registerGeminiHandlers(getWin);
})
