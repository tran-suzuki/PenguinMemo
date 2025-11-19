import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Save } from 'lucide-react';
import { CommandDraft, CommandItem, Category } from '../types';
import { generateLinuxCommand } from '../services/geminiService';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: CommandDraft) => void;
  initialData?: CommandItem | null;
}

const emptyDraft: CommandDraft = {
  command: '',
  description: '',
  output: '',
  category: Category.OTHER,
  tags: []
};

export const EditorModal: React.FC<EditorModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [draft, setDraft] = useState<CommandDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(initialData ? { ...initialData, output: initialData.output || '' } : emptyDraft);
      setTagInput('');
      setAiPrompt('');
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateLinuxCommand(aiPrompt);
      setDraft(prev => ({
        ...prev,
        command: result.command,
        description: result.description,
        category: result.category
      }));
    } catch (err) {
      setError('AI生成に失敗しました。APIキーを確認してください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!draft.tags.includes(tagInput.trim())) {
        setDraft(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDraft(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'コマンドを編集' : '新規コマンド追加'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AI Section */}
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
                placeholder="例: ディレクトリ内の全ファイルをサイズ順に並べる"
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

          <form id="command-form" onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">コマンド <span className="text-red-400">*</span></label>
              <textarea 
                required
                value={draft.command}
                onChange={(e) => setDraft({...draft, command: e.target.value})}
                className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-sm text-green-400 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="tar -czvf archive.tar.gz /path/to/folder"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">実行結果 (任意)</label>
              <textarea 
                value={draft.output || ''}
                onChange={(e) => setDraft({...draft, output: e.target.value})}
                className="w-full h-32 bg-black border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                placeholder="実行結果のログをここにペースト..."
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">説明 <span className="text-red-400">*</span></label>
              <textarea 
                required
                value={draft.description}
                onChange={(e) => setDraft({...draft, description: e.target.value})}
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="コマンドの使用方法や注意点を記述"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">カテゴリー</label>
                <select 
                  value={draft.category}
                  onChange={(e) => setDraft({...draft, category: e.target.value as Category})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">タグ (Enterで追加)</label>
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="backup, logs, etc."
                />
              </div>
            </div>

            {draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {draft.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-slate-700 text-slate-200 px-2 py-1 rounded text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400"><X size={12}/></button>
                  </span>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            キャンセル
          </button>
          <button 
            type="submit"
            form="command-form"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Save size={16} />
            保存する
          </button>
        </div>

      </div>
    </div>
  );
};