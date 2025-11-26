import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { Client } from 'ssh2'
import fs from 'fs'

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
        icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
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

app.whenReady().then(createWindow)

// --- SSH Implementation ---

const sshConnections = new Map<string, Client>();

ipcMain.handle('ssh-connect', async (event, { id, host, port, username, password, privateKey }) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', () => {
            console.log(`SSH Client :: ready (${id})`);

            conn.shell((err, stream) => {
                if (err) {
                    reject(err.message);
                    return;
                }

                sshConnections.set(id, conn);

                // Handle output from server
                stream.on('data', (data: Buffer) => {
                    win?.webContents.send(`ssh-data-${id}`, data.toString());
                });

                stream.on('close', () => {
                    console.log(`SSH Client :: stream closed (${id})`);
                    conn.end();
                    sshConnections.delete(id);
                    win?.webContents.send(`ssh-closed-${id}`);
                });

                // Store stream for writing
                (conn as any)._stream = stream;

                resolve(true);
            });
        }).on('error', (err) => {
            console.error(`SSH Client :: error (${id})`, err);
            reject(err.message);
        }).connect({
            host,
            port: parseInt(port) || 22,
            username,
            password,
            privateKey
        });
    });
});

ipcMain.on('ssh-data', (event, { id, data }) => {
    const conn = sshConnections.get(id);
    if (conn && (conn as any)._stream) {
        (conn as any)._stream.write(data);
    }
});

ipcMain.on('ssh-resize', (event, { id, cols, rows }) => {
    const conn = sshConnections.get(id);
    if (conn && (conn as any)._stream) {
        (conn as any)._stream.setWindow(rows, cols, 0, 0);
    }
});

ipcMain.on('ssh-disconnect', (event, { id }) => {
    const conn = sshConnections.get(id);
    if (conn) {
        conn.end();
        sshConnections.delete(id);
    }
});

// --- SFTP Implementation ---

ipcMain.handle('sftp-list', async (event, { id, path: remotePath }) => {
    return new Promise((resolve, reject) => {
        const conn = sshConnections.get(id);
        if (!conn) {
            reject('Connection not found');
            return;
        }

        conn.sftp((err, sftp) => {
            if (err) {
                reject(err.message);
                return;
            }

            sftp.readdir(remotePath, (err, list) => {
                sftp.end();
                if (err) {
                    reject(err.message);
                    return;
                }

                const files = list.map(item => ({
                    name: item.filename,
                    isDirectory: item.longname.startsWith('d'),
                    size: item.attrs.size,
                    modifyTime: item.attrs.mtime * 1000,
                    permissions: item.longname.split(' ')[0]
                }));

                resolve(files);
            });
        });
    });
});

ipcMain.handle('sftp-upload', async (event, { id, localPath, remotePath }) => {
    return new Promise((resolve, reject) => {
        const conn = sshConnections.get(id);
        if (!conn) {
            reject('Connection not found');
            return;
        }

        conn.sftp((err, sftp) => {
            if (err) {
                reject(err.message);
                return;
            }

            sftp.fastPut(localPath, remotePath, (err) => {
                sftp.end();
                if (err) {
                    reject(err.message);
                } else {
                    resolve(true);
                }
            });
        });
    });
});

ipcMain.handle('sftp-download', async (event, { id, remotePath, localPath }) => {
    return new Promise((resolve, reject) => {
        const conn = sshConnections.get(id);
        if (!conn) {
            reject('Connection not found');
            return;
        }

        conn.sftp((err, sftp) => {
            if (err) {
                reject(err.message);
                return;
            }

            sftp.fastGet(remotePath, localPath, (err) => {
                sftp.end();
                if (err) {
                    reject(err.message);
                } else {
                    resolve(true);
                }
            });
        });
    });
});

// --- Dialog Handlers ---

ipcMain.handle('dialog:open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
        properties: ['openFile']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('dialog:save-file', async (event, { defaultPath }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(win!, {
        defaultPath
    });
    if (canceled) {
        return null;
    } else {
        return filePath;
    }
});
