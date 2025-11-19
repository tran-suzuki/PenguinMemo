import React, { useState } from 'react';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { generateLinuxCommand } from '../../services/geminiService';

interface LogInputAreaProps {
  onAddLog: (command: string, output: string) => void;
}

export const LogInputArea: React.FC<LogInputAreaProps> = ({ onAddLog }) => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onAddLog(command, output);
      setCommand('');
      setOutput('');
      setAiPrompt('');
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-6 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-10">
      <div className="max-w-4xl mx-auto space-y-4">

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
        
        {/* Command Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">コマンド <span className="text-red-400">*</span></label>
          <div className="relative">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="実行したコマンド..."
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-sm text-green-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder-slate-600/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        {/* Output Input */}
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