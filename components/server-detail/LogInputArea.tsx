
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Save, ChevronDown, FileEdit, Copy, Check } from 'lucide-react';
import { generateLinuxCommand } from '../../services/geminiService';

interface LogInputAreaProps {
  onAddLog: (
    command: string,
    output: string,
    user?: string,
    directory?: string,
    fileContentBefore?: string,
    fileContentAfter?: string
  ) => void;
  onClose: () => void;
  initialDirectory?: string;
}

export const LogInputArea: React.FC<LogInputAreaProps> = ({ onAddLog, onClose, initialDirectory }) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [user, setUser] = useState('');
  const [directory, setDirectory] = useState(initialDirectory || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Edit Mode States
  const [isFileEditMode, setIsFileEditMode] = useState(false);
  const [fileContentBefore, setFileContentBefore] = useState('');
  const [fileContentAfter, setFileContentAfter] = useState('');
  const [targetFilename, setTargetFilename] = useState('');
  const [copiedCat, setCopiedCat] = useState(false);

  useEffect(() => {
    // Detect editor commands (vi, vim, nano, etc.)
    const editorRegex = /^(?:sudo\s+)?(?:vi|vim|nano|emacs|gedit)(?:\s+([^\s]+))?/;
    const match = command.trim().match(editorRegex);

    if (match) {
      setIsFileEditMode(true);
      if (match[1]) {
        setTargetFilename(match[1]);
      }
    } else {
      // Only exit file edit mode if the command is completely cleared or changed to non-editor
      // We allow users to manually toggle it off, or when saved
      if (command.trim() === '') {
        setIsFileEditMode(false);
        setTargetFilename('');
      }
    }
  }, [command]);

  useEffect(() => {
    if (initialDirectory) {
      setDirectory(initialDirectory);
    }
  }, [initialDirectory]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateLinuxCommand(aiPrompt);
      setCommand(result.command);
    } catch (err) {
      setError('AI生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (command.trim()) {
      onAddLog(
        command,
        output,
        user.trim() || undefined,
        directory.trim() || undefined,
        isFileEditMode ? fileContentBefore : undefined,
        isFileEditMode ? fileContentAfter : undefined
      );

      // Reset form
      setCommand('');
      setOutput('');
      setAiPrompt('');
      setFileContentBefore('');
      setFileContentAfter('');
      setIsFileEditMode(false);
      setTargetFilename('');
    }
  };

  const handleCopyCat = (e: React.MouseEvent) => {
    e.preventDefault();
    const catCmd = `cat ${targetFilename}`;
    navigator.clipboard.writeText(catCmd);
    setCopiedCat(true);
    setTimeout(() => setCopiedCat(false), 2000);
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-4 sm:p-6 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-20 relative transition-all">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-3 sm:right-4 text-slate-500 hover:text-slate-300 p-2 hover:bg-slate-800 rounded-lg transition-colors z-50"
        title="閉じる"
      >
        <ChevronDown size={20} />
      </button>

      <div className="max-w-4xl mx-auto space-y-4 pt-2">

        {/* AI Assistant Block */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <label className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Sparkles size={14} />
            AI アシスタント
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="例: ログの最後の100行を表示"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : '生成'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        {/* Context Fields */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-32">
            <label className="block text-xs font-medium text-slate-500 mb-1">User</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="root"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Directory</label>
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/var/www/html"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
        </div>

        {/* Command Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">コマンド <span className="text-red-400">*</span></label>
          <div className="relative">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="実行したコマンド..."
              className="w-full h-16 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-sm text-green-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder-slate-600/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        {/* File Editing Mode vs Standard Output */}
        {isFileEditMode ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
              <FileEdit size={16} />
              <span className="text-xs font-bold">ファイル編集モード (Diff記録)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-400">編集前の内容 (Before)</label>
                  {targetFilename && (
                    <button
                      onClick={handleCopyCat}
                      className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-all"
                      title={`cat ${targetFilename} をコピー`}
                    >
                      {copiedCat ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      cat {targetFilename.split('/').pop()}
                    </button>
                  )}
                </div>
                <textarea
                  value={fileContentBefore}
                  onChange={(e) => setFileContentBefore(e.target.value)}
                  placeholder="編集前のファイル内容をペースト..."
                  className="w-full h-48 bg-black border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed placeholder-slate-800 scrollbar-thin"
                  spellCheck={false}
                />
              </div>

              {/* After */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-400">編集後の内容 (After)</label>
                  {targetFilename && (
                    <button
                      onClick={handleCopyCat}
                      className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-all"
                      title={`cat ${targetFilename} をコピー`}
                    >
                      {copiedCat ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      cat {targetFilename.split('/').pop()}
                    </button>
                  )}
                </div>
                <textarea
                  value={fileContentAfter}
                  onChange={(e) => setFileContentAfter(e.target.value)}
                  placeholder="編集後のファイル内容をペースト..."
                  className="w-full h-48 bg-black border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed placeholder-slate-800 scrollbar-thin"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Standard Output Input */
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">実行結果 (任意)</label>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="実行結果のログをここにペースト..."
              className="w-full h-24 bg-black border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed placeholder-slate-700 scrollbar-thin"
              spellCheck={false}
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!command.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-lg"
          >
            <Save size={16} />
            記録する (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
