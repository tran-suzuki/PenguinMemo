# PenguinMemo リファクタリング実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存挙動を変えずに、保守性・可読性と型安全性を段階的に改善する。

**Architecture:** IPC の型を `shared/ipc.ts` に一元化して `electron` 境界の `any` を排除（判断A）。`electron/main.ts` をハンドラ別ファイルに分割。巨大コンポーネント `ServerDetail.tsx` を viewMode 別の子コンポーネント + ServerDetail スコープの Context/フックに分割（判断B）。

**Tech Stack:** React 19, Electron 39, Vite 6, Zustand 5, TypeScript 5.8, ssh2。

**検証方針（TDD の代替）:** 本プロジェクトにはテスト基盤がなく、導入はスコープ外。各タスクは挙動を変えないリファクタなので、検証は以下で行う:
- 型チェック: `npx tsc --noEmit`（`tsconfig.json` は `noEmit: true`、electron 含む全 .ts/.tsx 対象）
- ビルド: `npm run build`（vite が renderer + electron をビルド）
- 手動スモーク: 各フェーズ末尾に確認項目を明記

各タスク完了ごとにコミット。コミットメッセージは `<type>: <description>` 形式。

---

## ファイル構成（変更マップ）

**新規作成:**
- `shared/ipc.ts` — IPC チャンネル名・payload・result・`ElectronAPI` 型の単一定義
- `electron/handlers/ssh.ts` — SSH 接続/データ/リサイズ/切断ハンドラ登録
- `electron/handlers/sftp.ts` — SFTP list/upload/download/mkdir/rename ハンドラ登録
- `electron/handlers/dialog.ts` — open-file/save-file ハンドラ登録
- `electron/handlers/shell.ts` — shell:open-external ハンドラ登録
- `electron/handlers/gemini.ts` — Gemini BrowserView open/resize/close ハンドラ登録 + 状態
- `components/server-detail/ServerDetailHeader.tsx` — ヘッダ（viewMode 切替・検索・操作ボタン）
- `components/server-detail/ServerCredentialsPopover.tsx` — コントロールパネル/root/追加ユーザーの資格情報ポップオーバー
- `components/server-detail/GeminiSidebar.tsx` — Gemini サイドバー UI
- `components/server-detail/useGeminiSidebar.ts` — Gemini 開閉・リサイズロジック（フック）
- `components/server-detail/views/LogsView.tsx` — logs ビュー本体
- `components/server-detail/views/ConfigsView.tsx` — configs ビュー本体
- `components/server-detail/views/WebAppsView.tsx` — webapps ビュー本体
- `hooks/usePasswordVisibility.ts` — パスワード表示トグル共通フック

**変更:**
- `electron/preload.ts` — `shared/ipc.ts` の型で再実装、`any` 排除
- `electron/electron-env.d.ts` — `ElectronAPI` を `shared/ipc.ts` から導出
- `electron/main.ts` — 起動 + ハンドラ登録の薄い層に縮小
- `components/ServerDetail.tsx` — 薄いシェルに縮小（状態・ハンドラ・タブ切替のみ）
- `components/ServerModal.tsx` — `usePasswordVisibility` 利用 + セクション分割

**削除（Phase 0）:**
- `reproduce_delete_issue.ts`, `reproduce_issue.ts`, `verify_fixes.ts`, `test_import.ts`

---

## Phase 0 — ベースライン確保

### Task 0.1: 作業ツリーの確認とデバッグ残骸の削除

**Files:**
- Delete: `reproduce_delete_issue.ts`, `reproduce_issue.ts`, `verify_fixes.ts`, `test_import.ts`

- [ ] **Step 1: 現状確認**

Run: `git status`
Expected: `refactor/maintainability-typesafety` ブランチ。未コミットの変更（components/ServerDetail.tsx 他）と未追跡のデバッグスクリプトが見える。

- [ ] **Step 2: 既存の未コミット変更をコミット（ベースライン化）**

```bash
git add -A -- ":!reproduce_delete_issue.ts" ":!reproduce_issue.ts" ":!verify_fixes.ts" ":!test_import.ts"
git commit -m "chore: リファクタ着手前の作業ツリーをベースライン化"
```

- [ ] **Step 3: デバッグ残骸を削除**

```bash
git rm reproduce_delete_issue.ts reproduce_issue.ts verify_fixes.ts test_import.ts
```
（未追跡で `git rm` が失敗する場合は `rm` で削除）

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（削除したファイルへの参照がないこと）

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "chore: デバッグ用スクリプトを削除"
```

---

## Phase 1 — 型安全性の土台

### Task 1.1: shared/ipc.ts に IPC 型を定義

**Files:**
- Create: `shared/ipc.ts`

- [ ] **Step 1: 型定義ファイルを作成**

`main.ts`・`preload.ts` の実コードから抽出したチャンネル・payload・result を一元定義する。

```typescript
// shared/ipc.ts
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
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
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
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add shared/ipc.ts
git commit -m "feat: IPC契約の共有型 shared/ipc.ts を追加"
```

### Task 1.2: preload.ts を共有型で再実装

**Files:**
- Modify: `electron/preload.ts`

- [ ] **Step 1: preload を型付きで書き換え**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/ipc'

const api: ElectronAPI = {
    on: (channel, callback) => {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
    },
    off: (channel, listener) => {
        ipcRenderer.removeListener(channel, listener as (...args: unknown[]) => void);
    },
    connectSSH: (config) => ipcRenderer.invoke('ssh-connect', config),
    disconnectSSH: (id) => ipcRenderer.send('ssh-disconnect', { id }),
    sftpList: (id, path) => ipcRenderer.invoke('sftp-list', { id, path }),
    sftpUpload: (id, localPath, remotePath) => ipcRenderer.invoke('sftp-upload', { id, localPath, remotePath }),
    sftpDownload: (id, remotePath, localPath) => ipcRenderer.invoke('sftp-download', { id, remotePath, localPath }),
    showOpenDialog: () => ipcRenderer.invoke('dialog:open-file'),
    showSaveDialog: (defaultPath) => ipcRenderer.invoke('dialog:save-file', { defaultPath }),
    sendSSHData: (id, data) => ipcRenderer.send('ssh-data', { id, data }),
    resizeSSH: (id, cols, rows) => ipcRenderer.send('ssh-resize', { id, cols, rows }),
    openGemini: () => ipcRenderer.send('gemini:open'),
    resizeGemini: (bounds) => ipcRenderer.send('gemini:resize', bounds),
    closeGemini: () => ipcRenderer.send('gemini:close'),
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', { url }),
}

contextBridge.exposeInMainWorld('electronAPI', api)
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add electron/preload.ts
git commit -m "refactor: preload を共有型で再実装し any を排除"
```

### Task 1.3: electron-env.d.ts を共有型から導出

**Files:**
- Modify: `electron/electron-env.d.ts`

- [ ] **Step 1: `ElectronAPI` 重複定義を共有型 import に置換**

`interface ElectronAPI {...}` を削除し、以下に置き換える:

```typescript
/// <reference types="vite-plugin-electron/electron-env" />

import type { ElectronAPI } from '../shared/ipc';

declare namespace NodeJS {
    interface ProcessEnv {
        DIST: string
        VITE_PUBLIC: string
    }
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export {};
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし。`window.electronAPI` 利用箇所（SSHTerminal, SFTPFileManager, ServerDetail 等）で型エラーが出ないこと。出た場合は呼び出し側の引数を共有型に合わせる（挙動は変えない）。

- [ ] **Step 3: コミット**

```bash
git add electron/electron-env.d.ts
git commit -m "refactor: window.electronAPI の型を共有型から導出"
```

**Phase 1 スモーク確認:** `npm run build` 成功。`npm run electron:dev` で起動し SSH 接続・SFTP 一覧・Gemini 開閉が従来通り動く。

---

## Phase 2 — electron/main.ts の分割

各ハンドラファイルは「`registerXxxHandlers(getWin: () => BrowserWindow | null)` をエクスポートし、`ipcMain` 登録を行う」パターンに統一する。`win` と `sshConnections` の共有が必要なため、登録関数に依存を注入する。

### Task 2.1: SSH ハンドラを抽出

**Files:**
- Create: `electron/handlers/ssh.ts`
- Modify: `electron/main.ts`（SSH 該当行 81-169 を移動）

- [ ] **Step 1: ssh.ts を作成**

`main.ts` 79-169 行の SSH 実装（`sshConnections` Map、`ssh-connect`/`ssh-data`/`ssh-resize`/`ssh-disconnect`）をそのまま移植し、登録関数でラップする。`win?.webContents.send` は注入された `getWin()` を使う。

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import { Client } from 'ssh2'
import { convert } from 'ppk-to-openssh'
import type { SSHConnectConfig } from '../../shared/ipc'

const sshConnections = new Map<string, Client>();

export function registerSSHHandlers(getWin: () => BrowserWindow | null) {
    ipcMain.handle('ssh-connect', async (_event, { id, host, port, username, password, privateKey }: SSHConnectConfig) => {
        // main.ts 86-146 のロジックをそのまま移植。
        // win?.webContents.send(...) は getWin()?.webContents.send(...) に置換。
    });

    ipcMain.on('ssh-data', (_event, { id, data }) => { /* main.ts 150-153 */ });
    ipcMain.on('ssh-resize', (_event, { id, cols, rows }) => { /* main.ts 157-160 */ });
    ipcMain.on('ssh-disconnect', (_event, { id }) => { /* main.ts 164-168 */ });
}
```

実装の中身は `main.ts` の該当行を一字一句移植（`win` → `getWin()` のみ変更）。

- [ ] **Step 2: main.ts から SSH 実装を削除し登録呼び出しに置換**（Task 2.6 でまとめて実施）

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add electron/handlers/ssh.ts
git commit -m "refactor: SSH IPC ハンドラを electron/handlers/ssh.ts に抽出"
```

### Task 2.2: SFTP ハンドラを抽出

**Files:**
- Create: `electron/handlers/sftp.ts`

- [ ] **Step 1:** `main.ts` 173-320 行（list/upload/download/mkdir/rename）を `registerSFTPHandlers(getConn: (id: string) => Client | undefined)` に移植。`sshConnections` は ssh.ts が保持するため、ssh.ts から `getConnection(id)` をエクスポートして注入する。

ssh.ts に追記:
```typescript
export function getConnection(id: string) { return sshConnections.get(id); }
```

sftp.ts:
```typescript
import { ipcMain } from 'electron'
import type { Client } from 'ssh2'

export function registerSFTPHandlers(getConn: (id: string) => Client | undefined) {
    // main.ts 173-320 を移植。sshConnections.get(id) → getConn(id)。
}
```

- [ ] **Step 2: 型チェック** Run: `npx tsc --noEmit` Expected: エラーなし
- [ ] **Step 3: コミット** `git commit -m "refactor: SFTP IPC ハンドラを抽出"`

### Task 2.3: Dialog ハンドラを抽出

**Files:** Create `electron/handlers/dialog.ts`

- [ ] **Step 1:** `main.ts` 324-344 行を `registerDialogHandlers(getWin: () => BrowserWindow | null)` に移植（`win!` → `getWin()!`）。
- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "refactor: Dialog IPC ハンドラを抽出"`

### Task 2.4: Shell ハンドラを抽出

**Files:** Create `electron/handlers/shell.ts`

- [ ] **Step 1:** `main.ts` 346-348 行を `registerShellHandlers()` に移植。
- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "refactor: shell:open-external ハンドラを抽出"`

### Task 2.5: Gemini ハンドラを抽出

**Files:** Create `electron/handlers/gemini.ts`

- [ ] **Step 1:** `main.ts` 359-394 行（`geminiView` 状態 + open/resize/close）を `registerGeminiHandlers(getWin: () => BrowserWindow | null)` に移植。
- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "refactor: Gemini BrowserView ハンドラを抽出"`

### Task 2.6: main.ts を薄い層に縮小

**Files:** Modify `electron/main.ts`

- [ ] **Step 1:** SSH/SFTP/Dialog/Shell/Gemini の実装ブロック（79-394 行のうち抽出済み部分）を削除し、`createWindow` 後に登録呼び出しを追加:

```typescript
import { registerSSHHandlers, getConnection } from './handlers/ssh'
import { registerSFTPHandlers } from './handlers/sftp'
import { registerDialogHandlers } from './handlers/dialog'
import { registerShellHandlers } from './handlers/shell'
import { registerGeminiHandlers } from './handlers/gemini'

const getWin = () => win;

registerSSHHandlers(getWin);
registerSFTPHandlers(getConnection);
registerDialogHandlers(getWin);
registerShellHandlers();
registerGeminiHandlers(getWin);
```

`web-contents-created` の `setWindowOpenHandler`（352-357 行）は main.ts に残す。`logToFile`/`createWindow`/app ライフサイクルも残す。

- [ ] **Step 2: 型チェック + ビルド**

Run: `npx tsc --noEmit && npm run build`
Expected: 両方成功。main.ts は概ね 90 行以下。

- [ ] **Step 3: コミット**

```bash
git add electron/main.ts
git commit -m "refactor: main.ts をウィンドウ起動とハンドラ登録のみに縮小"
```

**Phase 2 スモーク確認:** `npm run electron:dev` で SSH 接続・SFTP・ダイアログ（インポート/エクスポートのファイル選択）・外部リンク・Gemini が従来通り動く。

---

## Phase 3 — ServerDetail.tsx の分割

`ServerDetail.tsx` の責務を分解する。状態は ServerDetail に残し、表示用の塊を子コンポーネントへ抽出する（props で受け渡し。判断B の Context は header/credentials が深くならないため、まずは props 渡しで分割し、props が 8 個を超える箇所のみ Context 化を検討する）。

### Task 3.1: usePasswordVisibility フックを抽出

**Files:** Create `hooks/usePasswordVisibility.ts`

- [ ] **Step 1:** 共通フックを作成。

```typescript
import { useState, useCallback } from 'react';

export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial);
  const toggle = useCallback(() => setVisible(v => !v), []);
  return { visible, toggle, setVisible };
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "feat: パスワード表示トグルの共通フックを追加"`

### Task 3.2: ServerCredentialsPopover を抽出

**Files:**
- Create: `components/server-detail/ServerCredentialsPopover.tsx`
- Modify: `components/ServerDetail.tsx`（591-744 行を置換）

- [ ] **Step 1:** コントロールパネル資格情報ポップオーバー（591-661 行）と root/追加ユーザーポップオーバー（663-744 行）を 1 コンポーネントに抽出。`showPassword` ローカル state を `usePasswordVisibility` 内蔵に変更。

Props インターフェース:
```typescript
interface ServerCredentialsPopoverProps {
  server: ServerItem;
  onOpenLink: (url: string) => void; // setLinkToOpen 相当
}
```

ServerDetail 側では `<ServerCredentialsPopover server={server} onOpenLink={setLinkToOpen} />` を 591-744 行の位置に置く。ServerDetail の `showPassword` state（58 行）はこの抽出で不要なら削除。

- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "refactor: 資格情報ポップオーバーを ServerCredentialsPopover に抽出"`

### Task 3.3: ServerDetailHeader を抽出

**Files:**
- Create: `components/server-detail/ServerDetailHeader.tsx`
- Modify: `components/ServerDetail.tsx`（368-746 行を置換）

- [ ] **Step 1:** `<header>...</header>`（368-746 行）を抽出。viewMode 切替・検索バー・一括入力/エクスポート/Gemini/Console ボタン・資格情報を含む。

Props インターフェース:
```typescript
interface ServerDetailHeaderProps {
  server: ServerItem;
  viewMode: 'logs' | 'configs' | 'webapps' | 'terminal' | 'files';
  onChangeViewMode: (m: ServerDetailHeaderProps['viewMode']) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  activeThread: ServerThread | undefined;
  onBack: () => void;
  onUpdate: (updates: Partial<ServerItem>) => void;
  onOpenBulkModal: () => void;
  onOpenBulkConfigModal: () => void;
  isGeminiOpen: boolean;
  onToggleGemini: () => void;
  onOpenLink: (url: string) => void;
  showExportMenu: boolean;
  onToggleExportMenu: () => void;
  onExport: (format: 'md' | 'csv') => void;
  exportMenuRef: React.RefObject<HTMLDivElement>;
}
```

props が 18 個と多いため、この時点で ServerDetail スコープの Context（`ServerDetailContext`）を導入し、`server`/`viewMode`/`onChangeViewMode`/`searchQuery` 等の横断値を Context 経由に切り替える（判断B）。Context は `components/server-detail/ServerDetailContext.tsx` に定義し、`useServerDetailContext()` フックを公開。Header と Credentials はこの Context を購読する。

- [ ] **Step 2:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 3:** `git commit -m "refactor: ヘッダを ServerDetailHeader + Context に抽出"`

### Task 3.4: GeminiSidebar + useGeminiSidebar を抽出

**Files:**
- Create: `components/server-detail/useGeminiSidebar.ts`, `components/server-detail/GeminiSidebar.tsx`
- Modify: `components/ServerDetail.tsx`（73-159 行のロジック、885-935 行の JSX を置換）

- [ ] **Step 1:** リサイズ用 useEffect（73-103 行）・open/close useEffect（105-115 行）・bounds 同期 useEffect（120-159 行）と関連 state（`geminiSidebarWidth`/`isResizingGemini`/`geminiSidebarRef`）を `useGeminiSidebar` フックに移す。

```typescript
export function useGeminiSidebar(isGeminiOpen: boolean, modalsOpen: boolean) {
  // 戻り値: { sidebarRef, sidebarWidth, startResize }
}
```
`modalsOpen` は `isServerModalOpen || isCommandModalOpen || isSettingsModalOpen || isBulkModalOpen || isBulkConfigModalOpen` を集約したもの。

- [ ] **Step 2:** 885-935 行の `<aside>` を `GeminiSidebar` コンポーネント（props: `sidebarRef`, `width`, `onStartResize`, `onClose`）に抽出。
- [ ] **Step 3:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 4:** `git commit -m "refactor: Gemini サイドバーをフックとコンポーネントに抽出"`

### Task 3.5: LogsView / ConfigsView / WebAppsView を抽出

**Files:**
- Create: `components/server-detail/views/LogsView.tsx`, `ConfigsView.tsx`, `WebAppsView.tsx`
- Modify: `components/ServerDetail.tsx`（748-883 行の本体分岐を置換）

- [ ] **Step 1: WebAppsView**（836-838 行）— props `{ serverId: string; webApps: ServerWebApp[] }`。最も小さいので最初に抽出。
- [ ] **Step 2: ConfigsView**（751-765 行のサイドバー + 815-834 行の本体）— configs 用 ConfigList/ConfigEditor/ConfigSearchResults をまとめる。props で `filteredConfigs`, `activeConfigId`, ハンドラ群を受ける。
- [ ] **Step 3: LogsView**（769-776 行サイドバー相当の ThreadList + 839-882 行の本体）— ThreadList/SearchResults/LogStream/LogInputArea をまとめる。
- [ ] **Step 4:** 各抽出後に `npx tsc --noEmit`。3 つ揃ったら `npm run build`。
- [ ] **Step 5:** `git commit -m "refactor: ServerDetail の各ビューを views/ 配下に抽出"`

### Task 3.6: ServerDetail を最終整形

**Files:** Modify `components/ServerDetail.tsx`

- [ ] **Step 1:** 残った ServerDetail が「state + ハンドラ + Context provider + Header + Sidebar/Main の viewMode 分岐 + Gemini + モーダル」だけになっていることを確認。目標 250 行以下。
- [ ] **Step 2:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 3:** `git commit -m "refactor: ServerDetail を薄いシェルに整形"`

**Phase 3 スモーク確認:** logs（追加/検索/一括/エクスポート/手動インポート）、configs（一覧/編集/検索/一括）、webapps、terminal（接続維持）、files、Gemini 開閉・リサイズ、テーマカラー変更が従来通り。

---

## Phase 4 — ServerModal の整理（任意・🟡）

### Task 4.1: ServerModal に usePasswordVisibility を適用

**Files:** Modify `components/ServerModal.tsx`

- [ ] **Step 1:** `showPassword`/`showRootPassword`/`showUserPasswords` 等の重複 state を `usePasswordVisibility` に置換（複数なら配列/Map 管理）。挙動は不変。
- [ ] **Step 2:** `npx tsc --noEmit` → エラーなし
- [ ] **Step 3:** `git commit -m "refactor: ServerModal のパスワード表示を共通フックに統一"`

### Task 4.2: ServerModal をフォームセクションに分割

**Files:**
- Create: `components/server-modal/{ConnectionSection,AuthSection,TagsSection,UsersSection}.tsx`
- Modify: `components/ServerModal.tsx`

- [ ] **Step 1:** フォームを接続情報/認証/タグ/ユーザーのセクションコンポーネントに分割。各セクションは値とハンドラを props で受ける。ServerModal は state 管理 + セクション配置に縮小。
- [ ] **Step 2:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 3:** `git commit -m "refactor: ServerModal をフォームセクションに分割"`

**Phase 4 スモーク確認:** サーバー追加・編集・保存、各パスワード表示トグル、タグ/追加ユーザー編集が従来通り。

---

## Phase 5 — ストア・重複ロジック整理（任意・🟢）

### Task 5.1: useCommandStore の storage を統一

**Files:** Modify `features/commands/stores/useCommandStore.ts`

- [ ] **Step 1:** 他ストア（useLogStore 等）が使う `idbStorage`（`createJSONStorage` + `idb`）に合わせて persist 設定を統一。データ移行が必要なら migrationService を確認。
- [ ] **Step 2:** `npx tsc --noEmit && npm run build` → 成功。`npm run electron:dev` でコマンド永続化を確認。
- [ ] **Step 3:** `git commit -m "refactor: useCommandStore の永続化設定を他ストアと統一"`

### Task 5.2: WebApp/Domain を独立ストアへ分離

**Files:**
- Create: `features/servers/stores/useWebAppStore.ts`（または server 配下の webApps/domains を扱う薄いストア）
- Modify: `features/servers/stores/useServerStore.ts`、利用側（WebAppList 等）

- [ ] **Step 1:** `useServerStore` の `addWebApp/updateWebApp/deleteWebApp/addDomain/updateDomain/deleteDomain` を切り出し。データは現状 `ServerItem.webApps/domains` にネストされているため、ストア分離は「アクションの分離」に留め、データモデルは変えない（挙動不変を優先）。
- [ ] **Step 2:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 3:** `git commit -m "refactor: WebApp/Domain 操作を専用ストアに分離"`

### Task 5.3: 重複ロジックの共通化

**Files:**
- Create: `utils/promptParser.ts`（プロンプト正規表現）
- Modify: `utils/configParser.ts`, `components/server-detail/BulkLogImportModal.tsx`, `components/ServerDetail.tsx`（handleManualImportLogs の promptRegex 305 行）

- [ ] **Step 1:** プロンプト判定正規表現を `utils/promptParser.ts` に集約し、各所から import。
- [ ] **Step 2:** `useLogStore` の `reorderLogs`/`reorderThreads` の共通パターンを `utils/reorder.ts` のヘルパに抽出。
- [ ] **Step 3:** `npx tsc --noEmit && npm run build` → 成功
- [ ] **Step 4:** `git commit -m "refactor: プロンプト解析と並べ替えロジックを共通化"`

**Phase 5 スモーク確認:** コマンド/ログ/設定の永続化、ログ・スレッド並べ替え、一括インポートのパースが従来通り。

---

## 完了条件

- 全フェーズで `npx tsc --noEmit` と `npm run build` が成功
- 各フェーズ末尾のスモーク確認項目が従来通り動作（挙動不変）
- `ServerDetail.tsx` が 250 行以下、`electron/main.ts` が 90 行前後、`window.electronAPI` に `any` がない
- デバッグ残骸が削除されている

---

## 実施結果（2026-05-27）

すべての変更で `npx tsc --noEmit` と `npm run build` が成功（緑）。各コミットは挙動を変えない移植リファクタ。
GUI の手動スモーク確認は本環境（ヘッドレス）では実施できないため、型チェック + ビルドで担保し、各フェーズ末尾のスモーク項目は実機確認を推奨。

| フェーズ | 状態 | 結果 |
|---------|------|------|
| Phase 0 | ✅ 完了 | デバッグ残骸4ファイル削除、ベースライン確立 |
| Phase 1 | ✅ 完了 | `shared/ipc.ts` 新設。electron 境界の `any` をゼロに |
| Phase 2 | ✅ 完了 | `main.ts` 394行 → 100行。ハンドラを5ファイルに分割 |
| Phase 3 | ✅ 完了 | `ServerDetail.tsx` 982行 → 466行（52%減）。Header/Credentials/Gemini/Context/Views 抽出 |
| Phase 4 | ✅ 完了 | `ServerModal.tsx` 595行 → 359行。3セクション抽出 + パスワード表示フック統一 |
| Phase 5.3（正規表現） | ✅ 完了 | プロンプト検出正規表現を `utils/promptPatterns.ts` に共通化 |
| Phase 5.1（storage統一） | ⏸ 見送り | persist のバックエンド変更はユーザーデータ移行リスクがあり、実機テストなしでは安全に実施できないため見送り |
| Phase 5.2（WebApp/Domain ストア分離） | ⏸ 見送り | データモデルは不変のままで価値が低く、優先度🟢のため見送り |
| Phase 5.3（reorder共通化） | ⏸ 見送り | ストアロジックに触れるため、リスク対効果から見送り |

`ServerDetail.tsx` の目標「250行以下」は未達（466行）。ヘッダ抽出で最大の改善は達成したが、残りはハンドラ群が占める。さらなる削減には `useServerDetailController` 等へのハンドラ抽出が必要で、状態結合が強くリスクが高いため今回は見送った。
