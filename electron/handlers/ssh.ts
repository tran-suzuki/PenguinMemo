import { ipcMain, BrowserWindow } from 'electron'
import { Client } from 'ssh2'
import { convert } from 'ppk-to-openssh'
import type { SSHConnectConfig } from '../../shared/ipc'

const sshConnections = new Map<string, Client>();

export function getConnection(id: string): Client | undefined {
    return sshConnections.get(id);
}

export function registerSSHHandlers(getWin: () => BrowserWindow | null) {
    ipcMain.handle('ssh-connect', async (_event, { id, host, port, username, password, privateKey }: SSHConnectConfig) => {
        return new Promise((resolve, reject) => {
            const conn = new Client();

            let finalPrivateKey = privateKey;
            let finalPassphrase: string | undefined = password;

            // Handle PuTTY Private Key (PPK)
            if (privateKey && privateKey.trim().startsWith('PuTTY-User-Key-File-')) {
                try {
                    // Convert PPK to OpenSSH format
                    // If the key is encrypted, 'password' is used as the passphrase
                    finalPrivateKey = convert(privateKey, password || '') as unknown as string;
                    // After conversion, the key is unencrypted (PEM), so we don't need to pass the passphrase to ssh2
                    finalPassphrase = undefined;
                } catch (err: any) {
                    console.error(`SSH Client :: PPK Conversion Error (${id})`, err);
                    reject(`PPK Conversion Failed: ${err.message}`);
                    return;
                }
            }

            conn.on('ready', () => {
                console.log(`SSH Client :: ready (${id})`);

                conn.shell({ term: 'xterm-256color' }, (err, stream) => {
                    if (err) {
                        reject(err.message);
                        return;
                    }

                    sshConnections.set(id, conn);

                    // Handle output from server
                    stream.on('data', (data: Buffer) => {
                        getWin()?.webContents.send(`ssh-data-${id}`, data.toString());
                    });

                    stream.on('close', () => {
                        console.log(`SSH Client :: stream closed (${id})`);
                        conn.end();
                        sshConnections.delete(id);
                        getWin()?.webContents.send(`ssh-closed-${id}`);
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
                port: parseInt(String(port)) || 22,
                username,
                password: finalPassphrase, // Use original password if no key, or undefined if PPK converted
                privateKey: finalPrivateKey,
                passphrase: finalPassphrase // Use original password as passphrase for standard OpenSSH keys
            });
        });
    });

    ipcMain.on('ssh-data', (_event, { id, data }) => {
        const conn = sshConnections.get(id);
        if (conn && (conn as any)._stream) {
            (conn as any)._stream.write(data);
        }
    });

    ipcMain.on('ssh-resize', (_event, { id, cols, rows }) => {
        const conn = sshConnections.get(id);
        if (conn && (conn as any)._stream) {
            (conn as any)._stream.setWindow(rows, cols, 0, 0);
        }
    });

    ipcMain.on('ssh-disconnect', (_event, { id }) => {
        const conn = sshConnections.get(id);
        if (conn) {
            conn.end();
            sshConnections.delete(id);
        }
    });
}
