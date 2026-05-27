import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ServerDraft } from '../../types';

interface EnvInfoSectionProps {
  draft: ServerDraft;
  setDraft: React.Dispatch<React.SetStateAction<ServerDraft>>;
}

/**
 * ServerModal の環境情報 (OS, ミドルウェア等) 編集セクション。
 */
export const EnvInfoSection: React.FC<EnvInfoSectionProps> = ({ draft, setDraft }) => {
  return (
    <div className="md:col-span-2 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">環境情報 (OS, Middleware...)</h3>
        <button
          type="button"
          onClick={() => setDraft(prev => ({
            ...prev,
            envInfo: [...(prev.envInfo || []), { key: '', value: '' }]
          }))}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Plus size={12} /> 追加
        </button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {(draft.envInfo || []).map((env, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={env.key}
              onChange={(e) => {
                const newEnv = [...(draft.envInfo || [])];
                newEnv[index].key = e.target.value;
                setDraft({ ...draft, envInfo: newEnv });
              }}
              className="w-1/3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Key (e.g. OS)"
              list="env-keys"
            />
            <input
              type="text"
              value={env.value}
              onChange={(e) => {
                const newEnv = [...(draft.envInfo || [])];
                newEnv[index].value = e.target.value;
                setDraft({ ...draft, envInfo: newEnv });
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Value (e.g. Ubuntu 22.04)"
            />
            <button
              type="button"
              onClick={() => {
                const newEnv = (draft.envInfo || []).filter((_, i) => i !== index);
                setDraft({ ...draft, envInfo: newEnv });
              }}
              className="text-slate-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {(!draft.envInfo || draft.envInfo.length === 0) && (
          <div className="text-xs text-slate-600 text-center py-2">
            環境情報がありません
          </div>
        )}
      </div>
      <datalist id="env-keys">
        <option value="OS" />
        <option value="Kernel" />
        <option value="PHP" />
        <option value="MySQL" />
        <option value="PostgreSQL" />
        <option value="Nginx" />
        <option value="Apache" />
        <option value="Node.js" />
        <option value="Python" />
        <option value="Ruby" />
        <option value="Docker" />
      </datalist>
    </div>
  );
};
