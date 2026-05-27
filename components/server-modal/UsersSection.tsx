import React, { useState } from 'react';
import { Users, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { ServerDraft } from '../../types';
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility';

interface UsersSectionProps {
  draft: ServerDraft;
  setDraft: React.Dispatch<React.SetStateAction<ServerDraft>>;
}

/**
 * ServerModal のユーザー管理セクション。Root パスワードと追加ユーザーを編集する。
 */
export const UsersSection: React.FC<UsersSectionProps> = ({ draft, setDraft }) => {
  const { visible: showRootPassword, toggle: toggleRootPassword } = usePasswordVisibility(false);
  const [showUserPasswords, setShowUserPasswords] = useState<{ [key: number]: boolean }>({});

  return (
    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
        <Users size={12} /> ユーザー管理
      </h3>

      {/* Root Password */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Root Password</label>
        <div className="relative">
          <input
            type={showRootPassword ? "text" : "password"}
            value={draft.rootPassword || ''}
            onChange={(e) => setDraft({ ...draft, rootPassword: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none pr-8"
            placeholder="Rootパスワード (任意)"
          />
          <button
            type="button"
            onClick={toggleRootPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showRootPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Additional Users */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-slate-400">その他のユーザー</label>
          <button
            type="button"
            onClick={() => setDraft(prev => ({
              ...prev,
              additionalUsers: [...(prev.additionalUsers || []), { username: '', password: '', note: '' }]
            }))}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus size={12} /> 追加
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {(draft.additionalUsers || []).map((user, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                value={user.username}
                onChange={(e) => {
                  const newUsers = [...(draft.additionalUsers || [])];
                  newUsers[index] = { ...newUsers[index], username: e.target.value };
                  setDraft({ ...draft, additionalUsers: newUsers });
                }}
                className="w-1/4 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Username"
              />
              <div className="relative flex-1">
                <input
                  type={showUserPasswords[index] ? "text" : "password"}
                  value={user.password || ''}
                  onChange={(e) => {
                    const newUsers = [...(draft.additionalUsers || [])];
                    newUsers[index] = { ...newUsers[index], password: e.target.value };
                    setDraft({ ...draft, additionalUsers: newUsers });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none pr-8"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPasswords(prev => ({ ...prev, [index]: !prev[index] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showUserPasswords[index] ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              <input
                type="text"
                value={user.note || ''}
                onChange={(e) => {
                  const newUsers = [...(draft.additionalUsers || [])];
                  newUsers[index] = { ...newUsers[index], note: e.target.value };
                  setDraft({ ...draft, additionalUsers: newUsers });
                }}
                className="w-1/4 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="備考"
              />
              <button
                type="button"
                onClick={() => {
                  const newUsers = (draft.additionalUsers || []).filter((_, i) => i !== index);
                  setDraft({ ...draft, additionalUsers: newUsers });
                }}
                className="text-slate-500 hover:text-red-400 mt-1.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {(!draft.additionalUsers || draft.additionalUsers.length === 0) && (
            <div className="text-xs text-slate-600 text-center py-2">
              追加ユーザーはいません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
