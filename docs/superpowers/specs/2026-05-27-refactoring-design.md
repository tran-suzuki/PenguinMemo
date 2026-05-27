# PenguinMemo リファクタリング設計

- **日付**: 2026-05-27
- **目的**: 保守性・可読性の向上 + 型安全性の確立
- **進め方**: 段階的・優先度順（各フェーズは独立して価値があり、途中で止めても動作する）

## 背景

PenguinMemo は React 19 + Electron + Vite + Zustand + TypeScript のSSH/サーバー管理デスクトップアプリ。機能追加を重ねた結果、以下の保守性・型安全性の課題が蓄積している。

| # | 課題 | 箇所 | 影響度 |
|---|------|------|--------|
| 1 | 巨大コンポーネント。5つの viewMode を1ファイルで管理（分岐が 388〜839 行に散在） | `components/ServerDetail.tsx` (982行) | 🔴 高 |
| 2 | IPC ハンドラが全て1ファイルに集中 | `electron/main.ts` (394行) | 🔴 高 |
| 3 | `window.electronAPI` の型が `any` 含み、preload/main/`.d.ts` で型が二重管理 | `electron/` | 🔴 高 |
| 4 | フォームロジックの肥大化 | `components/ServerModal.tsx` (595行) | 🟡 中 |
| 5 | パスワード表示切替などの重複ロジック | 複数 | 🟢 低 |
| 6 | `useServerStore` に WebApp/Domain が混在、storage 設定の不統一 | `features/` | 🟢 低 |
| 7 | ルート直下のデバッグ残骸、空の `stores/` | ルート | 🟢 低 |

## 技術判断

### 判断A: IPC の型共有 — 単一の共有型ファイル

`shared/ipc.ts` を新設し、全 IPC チャンネル名・引数（payload）・戻り値（result）を1箇所で定義する。`electron/main.ts`・`electron/preload.ts`・`electron/electron-env.d.ts` はすべてこの型から導出する。

- **採用理由**: 型の二重管理を解消し `any` を排除できる。追加依存なし。
- **不採用**: tRPC 等の型安全IPCライブラリ → 依存追加・学習コストが目的に対して過剰（YAGNI）。

### 判断B: ServerDetail 分割後の状態共有 — Context + カスタムフック

ServerDetail スコープの React Context と `useServerDetailState` カスタムフックを導入。viewMode ごとの子コンポーネントは必要な状態だけを購読する。

- **採用理由**: 5タブへの props 素通し（drilling）を回避しつつ、グローバル化しすぎない。既存 Zustand と共存可能。
- **不採用**: 純粋な props drilling（5タブで深くなる）、全 Zustand ストア化（画面ローカル状態をグローバルに置くのは過剰）。

## フェーズ構成

各フェーズ完了時に `npm run build`（tsc + vite ビルド）で検証し、主要動作を手動確認しながら進める。

### Phase 0 — ベースライン確保（前提整備・低リスク）
- 未コミットの作業ツリー変更を確認しコミット（リファクタの起点を明確化）
- ルートのデバッグ残骸を削除: `reproduce_delete_issue.ts`, `reproduce_issue.ts`, `verify_fixes.ts`, `test_import.ts`
- 空の `stores/` ディレクトリがあれば除去
- リファクタ用ブランチを作成

### Phase 1 — 型安全性の土台（最優先）🔴
- `shared/ipc.ts` に全 IPC チャンネルの型を定義（payload / result）
- `preload.ts` を共有型で実装し直し（`config: any`, `callback: (data: any)` 等を排除）
- `electron-env.d.ts` を共有型から導出し、`window.electronAPI` を完全型付け
- **成果**: 以降のコンポーネント分割が型で守られる

### Phase 2 — electron/main.ts の分割 🔴
- `electron/handlers/{ssh,sftp,dialog,gemini,shell}.ts` にハンドラを責務ごとに抽出
- `main.ts` は「ウィンドウ起動 + ハンドラ登録」の薄い層にする
- Phase 1 の共有型でハンドラ登録を型安全化

### Phase 3 — ServerDetail.tsx の分割（最大の保守性改善）🔴
- viewMode ごとに `components/server-detail/views/{LogsView,ConfigsView,WebAppsView,TerminalView,FilesView}.tsx` を抽出
- 判断B の `useServerDetailState` + Context を導入
- ServerDetail 本体はタブ切替 + レイアウトの薄いシェルに（目標 200 行以下）

### Phase 4 — ServerModal.tsx と共通フック 🟡
- `usePasswordVisibility` フックでパスワード表示切替の重複を統一
- フォームをセクション単位（接続情報 / 認証 / タグ / ユーザー）のコンポーネントに分割

### Phase 5 — ストア・重複ロジック整理（任意）🟢
- `useServerStore` から WebApp/Domain を独立ストアへ分離
- storage 設定の統一（`useCommandStore` を他ストアと同じ `idbStorage` に揃える）
- 正規表現パース・reorder ロジックの共通化

## スコープ外

- テスト基盤（Vitest 等）の導入 — 今回の主目的外。必要なら Phase 1.5 として別途追加可能。
- 新機能の追加、UI/UX の変更 — 本リファクタは外部から見た挙動を変えない。

## 検証方針

- 各フェーズ完了時に `npm run build` でコンパイル・型エラーがないことを確認
- SSH 接続 / SFTP 操作 / ログ・設定・WebApp 表示 / ターミナル の主要フローを手動確認
- 挙動を変えないこと（リファクタの不変条件）を各フェーズで担保
