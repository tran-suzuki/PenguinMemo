import React, { useState } from 'react';
import { CommandItem } from '../types';
import { Copy, Check, Trash2, Edit2, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface CommandCardProps {
  item: CommandItem;
  onDelete: (id: string) => void;
  onEdit: (item: CommandItem) => void;
}

export const CommandCard: React.FC<CommandCardProps> = ({ item, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all group flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {item.category}
          </span>
          {item.tags.map((tag, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
            title="編集"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="削除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="relative mb-3 group/code">
        <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto border border-slate-900 font-mono text-sm text-green-400 shadow-inner">
          <code>{item.command}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors shadow-lg border border-slate-700 opacity-0 group-hover/code:opacity-100"
          title="コマンドをコピー"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
        {item.description}
      </p>

      {item.output && (
        <div className="mt-auto">
          <button 
            onClick={() => setShowOutput(!showOutput)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-400 transition-colors py-2"
          >
            {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            実行結果を表示
          </button>
          
          {showOutput && (
            <pre className="bg-black/80 rounded-lg p-3 overflow-x-auto border border-slate-800 font-mono text-xs text-slate-400 shadow-inner whitespace-pre-wrap mt-1 max-h-60 overflow-y-auto">
              {item.output}
            </pre>
          )}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-600 text-right">
        Updated: {new Date(item.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};