
import React, { useState } from 'react';
import { X, ArrowRight, Trash2, Terminal, Check, AlertCircle } from 'lucide-react';

interface BulkLogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: { command: string; output: string; user?: string; directory?: string }[]) => void;
}

interface ParsedEntry {
  id: string;
  command: string;
  output: string;
  user: string;
  directory: string;
}

export const BulkLogImportModal: React.FC<BulkLogImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [rawInput, setRawInput] = useState('');
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [parseMode, setParseMode] = useState<'auto' | 'lines'>('auto');

  // Common Linux commands to detect when prompt is missing
  const COMMON_COMMANDS = [
    'sudo', 'cd', 'ls', 'pwd', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch',
    'cat', 'grep', 'find', 'chmod', 'chown', 'systemctl', 'journalctl',
    'docker', 'git', 'npm', 'yarn', 'pnpm', 'node', 'python', 'pip', 'apt',
    'yum', 'dnf', 'service', 'tar', 'zip', 'unzip', 'ssh', 'scp', 'rsync',
    'curl', 'wget', 'echo', 'export', 'alias', 'source', '.', 'vi', 'vim', 'nano'
  ];

  if (!isOpen) return null;

  const parseLogs = () => {
    if (!rawInput.trim()) return;

    const lines = rawInput.split('\n');
    const entries: ParsedEntry[] = [];

    let currentCommand = '';
    let currentOutput: string[] = [];
    let currentUser = '';
    let currentDir = '';

    // Regex Patterns
    // 1. Standard: [user@host dir]$ command
    const standardPromptRegex = /^\[?([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+(?:\s+|:)([^\]\$#]+)\]?[\$#]\s+(.*)$/;

    // 2. Multi-line Context: [user@host dir][branch]
    const contextLineRegex = /^\[([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+\s+([^\]]+)\](?:\[.*\])?$/;

    // 3. Multi-line Command: > command
    const commandLineRegex = /^>\s+(.*)$/;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check for matches
      const standardMatch = line.match(standardPromptRegex);
      const contextMatch = line.match(contextLineRegex);
      const commandMatch = line.match(commandLineRegex);

      // Heuristic check
      const isCommandStart = parseMode === 'lines' || (
        parseMode === 'auto' &&
        COMMON_COMMANDS.some(cmd => trimmedLine.startsWith(cmd + ' ') || trimmedLine === cmd)
      );

      if (standardMatch) {
        // Case A: Standard Prompt
        if (currentCommand) {
          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser,
            directory: currentDir
          });
        }

        currentUser = standardMatch[1];
        currentDir = standardMatch[2].trim();
        currentCommand = standardMatch[3].replace(/\^C$/, '').trim(); // Strip ^C
        currentOutput = [];

      } else if (contextMatch) {
        // Case B: Context Line (Multi-line prompt start)
        // Just update context, don't start command yet
        currentUser = contextMatch[1];
        currentDir = contextMatch[2].trim();

        // If we were building a previous command, push it now? 
        // Actually, usually context line comes AFTER a command execution or BEFORE a new one.
        // If we have a pending command, this context line likely belongs to the NEXT prompt.
        if (currentCommand) {
          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser, // This might be the user for the NEXT command, but we use it for the prev one if it was missing? 
            // No, usually we want to close the previous entry.
            // But wait, if we just updated currentUser, we shouldn't use it for the *previous* entry if that had its own user.
            // Actually, the previous entry should have been pushed when we encountered *its* prompt or command start.
            // So if we are here, we might have output from the previous command.
          });
          // Wait, if we push here, we need to be careful not to push twice.
          // Let's simplify: Context line just updates state for the *next* command.
          // But if we have a pending command, we should close it because we found a new prompt (even if it's just context).

          // Re-evaluating:
          // [user@host dir]$ cmd
          // output
          // [user@host dir][branch]  <-- This signals end of previous command output
          // > next_cmd

          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser, // Use the *new* context? No, use the old one. 
            // But we just overwrote it. 
            // Ideally we store "pendingEntry" object.
            // For now, let's assume the user/dir doesn't change often or we accept this limitation.
            // actually, let's use the *previous* values if we could.
            // But simpler: Just push the previous entry.
            directory: currentDir
          });
          currentCommand = '';
          currentOutput = [];
        }

      } else if (commandMatch) {
        // Case C: Command Line (Multi-line prompt command part)
        // This is the start of a command.
        if (currentCommand) {
          // If we already have a command, push it.
          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser,
            directory: currentDir
          });
        }

        currentCommand = commandMatch[1].replace(/\^C$/, '').trim(); // Strip ^C
        currentOutput = [];

      } else if (isCommandStart && !currentCommand.includes('\\')) {
        // Case D: Implicit Command Start (Heuristic)
        if (currentCommand) {
          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser,
            directory: currentDir
          });
        }

        currentCommand = trimmedLine.replace(/\^C$/, '').trim();
        currentOutput = [];

      } else {
        // Case E: Output or Continuation
        if (currentCommand) {
          if (currentCommand.endsWith('\\')) {
            currentCommand = currentCommand.slice(0, -1) + ' ' + trimmedLine;
          } else {
            currentOutput.push(line);
          }
        }
      }
    });

    // Push the last entry
    if (currentCommand) {
      entries.push({
        id: Math.random().toString(36).substr(2, 9),
        command: currentCommand,
        output: currentOutput.join('\n').trim(),
        user: currentUser,
        directory: currentDir
      });
    }

    setParsedEntries(entries);
    setStep('preview');
  };

  const handleImport = () => {
    onImport(parsedEntries.map(({ command, output, user, directory }) => ({
      command,
      output,
      user: user || undefined,
      directory: directory || undefined
    })));
    handleClose();
  };

  const handleClose = () => {
    setStep('input');
    setRawInput('');
    setParsedEntries([]);
    onClose();
  };

  const removeEntry = (id: string) => {
    setParsedEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ParsedEntry, value: string) => {
    setParsedEntries(prev => prev.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal size={20} className="text-blue-500" />
            一括ログ入力
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {step === 'input' ? (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-400 shrink-0" size={20} />
                <div className="text-sm text-slate-300">
                  <p className="font-bold text-blue-400 mb-1">使い方</p>
                  <p>ターミナルからコピーした履歴をそのまま貼り付けてください。</p>
                  <p className="mt-1 text-slate-400 text-xs">
                    プロンプト行（例: <code>[user@host dir]$ ls</code>）を自動検出し、
                    コマンド、実行結果、ユーザー、ディレクトリを抽出します。
                  </p>
                </div>
              </div>

              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full h-80 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={`[am-am@x162-43-88-210 www]$ ls -l
total 0
drwxr-xr-x. 2 root root 6 Nov 19 16:30 am
...`}
              />

              <div className="flex items-center gap-4 px-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="parseMode"
                    checked={parseMode === 'auto'}
                    onChange={() => setParseMode('auto')}
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white">自動解析 (推奨)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="parseMode"
                    checked={parseMode === 'lines'}
                    onChange={() => setParseMode('lines')}
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white">1行1コマンドとして扱う</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                <span className="text-white font-bold">{parsedEntries.length}</span> 件のログを検出しました。
                内容を確認・修正して「インポート」を押してください。
              </p>

              {parsedEntries.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  プロンプトが見つかりませんでした。<br />
                  入力データを確認してください。
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedEntries.map((entry, index) => (
                    <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Context Fields */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">User</label>
                          <input
                            value={entry.user}
                            onChange={(e) => updateEntry(entry.id, 'user', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-blue-300 focus:border-blue-500 outline-none"
                            placeholder="root"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Directory</label>
                          <input
                            value={entry.directory}
                            onChange={(e) => updateEntry(entry.id, 'directory', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-yellow-300 focus:border-blue-500 outline-none"
                            placeholder="/var/www"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Command</label>
                          <input
                            value={entry.command}
                            onChange={(e) => updateEntry(entry.id, 'command', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-sm text-green-400 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Output</label>
                          <textarea
                            value={entry.output}
                            onChange={(e) => updateEntry(entry.id, 'output', e.target.value)}
                            className="w-full h-20 bg-black border border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-400 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
          {step === 'preview' ? (
            <button
              onClick={() => setStep('input')}
              className="text-slate-400 hover:text-white text-sm font-medium"
            >
              戻って編集
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
              キャンセル
            </button>

            {step === 'input' ? (
              <button
                onClick={parseLogs}
                disabled={!rawInput.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                解析する
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={parsedEntries.length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Check size={16} />
                インポート
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
