import React from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { ServerDraft } from '../../types';

interface DomainsSectionProps {
  draft: ServerDraft;
  setDraft: React.Dispatch<React.SetStateAction<ServerDraft>>;
}

/**
 * ServerModal のドメイン / サブドメイン編集セクション。
 */
export const DomainsSection: React.FC<DomainsSectionProps> = ({ draft, setDraft }) => {
  return (
    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <Globe size={12} /> ドメイン / サブドメイン
        </h3>
        <button
          type="button"
          onClick={() => setDraft(prev => ({
            ...prev,
            domains: [...(prev.domains || []), { id: crypto.randomUUID(), domain: '', note: '' }]
          }))}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Plus size={12} /> 追加
        </button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {(draft.domains || []).map((domain, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={domain.domain}
              onChange={(e) => {
                const newDomains = [...(draft.domains || [])];
                newDomains[index] = { ...newDomains[index], domain: e.target.value };
                setDraft({ ...draft, domains: newDomains });
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              placeholder="example.com"
            />
            <input
              type="text"
              value={domain.note || ''}
              onChange={(e) => {
                const newDomains = [...(draft.domains || [])];
                newDomains[index] = { ...newDomains[index], note: e.target.value };
                setDraft({ ...draft, domains: newDomains });
              }}
              className="w-1/3 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="備考 (例: LP用)"
            />
            <button
              type="button"
              onClick={() => {
                const newDomains = (draft.domains || []).filter((_, i) => i !== index);
                setDraft({ ...draft, domains: newDomains });
              }}
              className="text-slate-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {(!draft.domains || draft.domains.length === 0) && (
          <div className="text-xs text-slate-600 text-center py-2">
            ドメインが登録されていません
          </div>
        )}
      </div>
    </div>
  );
};
