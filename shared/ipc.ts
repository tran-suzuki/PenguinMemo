// Electron main <-> renderer 間の IPC 契約を一元定義する。
// main.ts / preload.ts / electron-env.d.ts はすべてここから型を導出する。
import type { SFTPFile } from '../types';

export interface SSHConnectConfig {
  id: string;
  host: string;
  port: number | string; // main 側で parseInt される
  username: string;
  password?: string;
  privateKey?: string;
}

export interface GeminiBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// invoke 系（Promise を返す）
export interface IpcInvokeMap {
  'ssh-connect': { payload: SSHConnectConfig; result: boolean };
  'sftp-list': { payload: { id: string; path: string }; result: SFTPFile[] };
  'sftp-upload': { payload: { id: string; localPath: string; remotePath: string }; result: boolean };
  'sftp-download': { payload: { id: string; remotePath: string; localPath: string }; result: boolean };
  'sftp-mkdir': { payload: { id: string; path: string }; result: boolean };
  'sftp-rename': { payload: { id: string; oldPath: string; newPath: string }; result: boolean };
  'dialog:open-file': { payload: void; result: string | null };
  'dialog:save-file': { payload: { defaultPath: string }; result: string | null };
  'shell:open-external': { payload: { url: string }; result: void };
}

// send 系（戻り値なし）
export interface IpcSendMap {
  'ssh-data': { id: string; data: string };
  'ssh-resize': { id: string; cols: number; rows: number };
  'ssh-disconnect': { id: string };
  'gemini:open': void;
  'gemini:resize': GeminiBounds;
  'gemini:close': void;
}

// renderer 側に公開する API（preload で実装、window.electronAPI 経由で参照）
export interface ElectronAPI {
  // channel ごとに payload が異なるため、購読側でジェネリックに型を指定できるようにする
  on: <T = unknown>(channel: string, callback: (data: T) => void) => () => void;
  off: (channel: string, listener: (...args: unknown[]) => void) => void;
  connectSSH: (config: SSHConnectConfig) => Promise<boolean>;
  disconnectSSH: (id: string) => void;
  sftpList: (id: string, path: string) => Promise<SFTPFile[]>;
  sftpUpload: (id: string, localPath: string, remotePath: string) => Promise<boolean>;
  sftpDownload: (id: string, remotePath: string, localPath: string) => Promise<boolean>;
  showOpenDialog: () => Promise<string | null>;
  showSaveDialog: (defaultPath: string) => Promise<string | null>;
  sendSSHData: (id: string, data: string) => void;
  resizeSSH: (id: string, cols: number, rows: number) => void;
  openGemini: () => void;
  resizeGemini: (bounds: GeminiBounds) => void;
  closeGemini: () => void;
  openExternal: (url: string) => Promise<void>;
}
