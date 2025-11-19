
import React, { useState, useEffect } from 'react';
import { X, Save, Server, Shield } from 'lucide-react';
import { ServerDraft, ServerItem } from '../types';

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: ServerDraft) => void;
  initialData?: ServerItem | null;
}

const emptyDraft: ServerDraft = {
  project: '',
  name: '',
  host: '',
  username: 'root',
  port: 22,
  authType: 'password',
  authValue: '',
  description: '',
  tags: []
};

export const ServerModal: React.FC<ServerModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [draft, setDraft] = useState<ServerDraft>(emptyDraft);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(initialData || emptyDraft);
      setTagInput('');
    }
  }, [isOpen, initialData]);

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
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="text-blue-500" />
            {initialData ? 'サーバー情報を編集' : '新規サーバー追加'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="server-form" onSubmit={handleSave} className="space-y-5">
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">プロジェクト <span className="text-red-400">*</span></label>
                <input 
                  required
                  type="text"
                  value={draft.project}
                  onChange={(e) => setDraft({...draft, project: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例: Project Alpha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">サーバー名 <span className="text-red-400">*</span></label>
                <input 
                  required
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({...draft, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例: Web Server 01"
                />
              </div>
            </div>

            {/* Connection Info */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">接続情報</h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs text-slate-400 mb-1">Host / IP</label>
                  <input 
                    required
                    type="text"
                    value={draft.host}
                    onChange={(e) => setDraft({...draft, host: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs text-slate-400 mb-1">User</label>
                  <input 
                    required
                    type="text"
                    value={draft.username}
                    onChange={(e) => setDraft({...draft, username: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Port</label>
                  <input 
                    required
                    type="number"
                    value={draft.port}
                    onChange={(e) => setDraft({...draft, port: parseInt(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Auth Info */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Shield size={12}/> 認証情報
              </h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={draft.authType === 'password'} 
                      onChange={() => setDraft({...draft, authType: 'password'})}
                      className="text-blue-500 bg-slate-800 border-slate-600"
                    />
                    <span className="text-sm text-slate-300">パスワード</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={draft.authType === 'key'} 
                      onChange={() => setDraft({...draft, authType: 'key'})}
                      className="text-blue-500 bg-slate-800 border-slate-600"
                    />
                    <span className="text-sm text-slate-300">秘密鍵</span>
                  </label>
                </div>
                <div>
                  <textarea 
                    value={draft.authValue}
                    onChange={(e) => setDraft({...draft, authValue: e.target.value})}
                    className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={draft.authType === 'password' ? 'パスワードを入力' : '/path/to/private/key または鍵の内容'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">メモ / 説明</label>
              <textarea 
                value={draft.description}
                onChange={(e) => setDraft({...draft, description: e.target.value})}
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="サーバーの用途や注意事項など"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">タグ (Enterで追加)</label>
              <input 
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="production, aws, db, etc."
              />
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
            </div>

          </form>
        </div>

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
            form="server-form"
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
