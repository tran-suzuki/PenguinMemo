// ターミナル出力からプロンプト行を検出するための正規表現。
// configParser と BulkLogImportModal で同一定義が重複していたため共通化する。
// いずれも g フラグなし(.match で stateless に使用)のため共有インスタンスで安全。

// 標準プロンプト: [user@host dir]$ command
export const STANDARD_PROMPT_REGEX = /^\[?([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+(?:\s+|:)([^\]\$#]+)\]?[\$#]\s+(.*)$/;

// 複数行コンテキスト: [user@host dir][branch]
export const CONTEXT_LINE_REGEX = /^\[([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+\s+([^\]]+)\](?:\[.*\])?$/;

// 複数行コマンド: > command
export const COMMAND_LINE_REGEX = /^>\s+(.*)$/;
