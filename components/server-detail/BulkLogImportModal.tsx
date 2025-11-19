
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

  if (!isOpen) return null;

  const parseLogs = () => {
    if (!rawInput.trim()) return;

    const lines = rawInput.split('\n');
    const entries: ParsedEntry[] = [];
    
    let currentCommand = '';
    let currentOutput: string[] = [];
    let currentUser = '';
    let currentDir = '';

    // Regex to detect prompt lines and extract context
    // Matches patterns like:
    // [user@host dir]$ 
    // user@host:dir$
    // root@host:/path#
    // Group 1: User
    // Group 2: Directory (approximate)
    // Group 3: Command
    const promptRegex = /^\[?([a-zA-Z0-9_\-]+)@[a-zA-Z0-9_\.-]+(?:\s+|:)([^\]\$#]+)\]?[\$#]\s+(.*)$/;

    lines.forEach((line) => {
      const match = line.match(promptRegex);
      
      if (match) {
        // If we have a previous command pending, push it
        if (currentCommand) {
          entries.push({
            id: Math.random().toString(36).substr(2, 9),
            command: currentCommand,
            output: currentOutput.join('\n').trim(),
            user: currentUser,
            directory: currentDir
          });
        }
        
        // Start new entry
        currentUser = match[1];
        currentDir = match[2].trim();
        currentCommand = match[3]; // The part after the prompt
        currentOutput = [];
      } else {
        // If it's not a prompt, it's likely output
        if (currentCommand) {
          currentOutput.push(line);
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
                className="w-full h-96 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={`[am-am@x162-43-88-210 www]$ ls -l
total 0
drwxr-xr-x. 2 root root 6 Nov 19 16:30 am
...`}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                <span className="text-white font-bold">{parsedEntries.length}</span> 件のログを検出しました。
                内容を確認・修正して「インポート」を押してください。
              </p>

              {parsedEntries.length === 0 ? (
                 <div className="text-center py-10 text-slate-500">
                   プロンプトが見つかりませんでした。<br/>
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
