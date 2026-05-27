import { ipcMain } from 'electron'
import type { Client } from 'ssh2'

export function registerSFTPHandlers(getConn: (id: string) => Client | undefined) {
    ipcMain.handle('sftp-list', async (_event, { id, path: remotePath }) => {
        return new Promise((resolve, reject) => {
            const conn = getConn(id);
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

                    const files = list.map(item => {
                        // Parse longname for owner/group
                        // Format: -rw-r--r-- 1 owner group size date time name
                        const parts = item.longname.split(/\s+/);
                        const owner = parts.length > 2 ? parts[2] : '';
                        const group = parts.length > 3 ? parts[3] : '';

                        return {
                            name: item.filename,
                            isDirectory: item.longname.startsWith('d'),
                            size: item.attrs.size,
                            modifyTime: item.attrs.mtime * 1000,
                            permissions: item.longname.split(' ')[0],
                            owner,
                            group
                        };
                    });

                    resolve(files);
                });
            });
        });
    });

    ipcMain.handle('sftp-upload', async (_event, { id, localPath, remotePath }) => {
        return new Promise((resolve, reject) => {
            const conn = getConn(id);
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

    ipcMain.handle('sftp-download', async (_event, { id, remotePath, localPath }) => {
        return new Promise((resolve, reject) => {
            const conn = getConn(id);
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

    ipcMain.handle('sftp-mkdir', async (_event, { id, path: remotePath }) => {
        return new Promise((resolve, reject) => {
            const conn = getConn(id);
            if (!conn) {
                reject('Connection not found');
                return;
            }

            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err.message);
                    return;
                }

                sftp.mkdir(remotePath, (err) => {
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

    ipcMain.handle('sftp-rename', async (_event, { id, oldPath, newPath }) => {
        return new Promise((resolve, reject) => {
            const conn = getConn(id);
            if (!conn) {
                reject('Connection not found');
                return;
            }

            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err.message);
                    return;
                }

                sftp.rename(oldPath, newPath, (err) => {
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
}
