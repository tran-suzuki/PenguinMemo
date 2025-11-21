import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCommandStore } from '../features/commands/stores/useCommandStore';
import { useServerStore } from '../features/servers/stores/useServerStore';
import { useLogStore } from '../features/command-logs/stores/useLogStore';
import { exportData, downloadBackup, validateBackupData, processImportData } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Stores
  const { commands, importCommands } = useCommandStore();
  const { servers, importServers } = useServerStore();
  const { threads, logs, importLogsData } = useLogStore();

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const json = exportData(commands, servers, threads, logs);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBackup(json, `penguin-memo-backup-${dateStr}.json`);
      setMessage({ type: 'success', text: 'エクスポートが完了しました' });
    } catch (e) {
      setMessage({ type: 'error', text: 'エクスポートに失敗しました' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!validateBackupData(json)) {
          throw new Error('Invalid format');
        }

        const {
          commands: newCmds,
          servers: newSrvs,
          threads: newThreads,
          logs: newLogs
        } = processImportData(json);

        // Merge strategy: Append imported data to existing data
        importCommands([...commands, ...newCmds]);
        importServers([...servers, ...newSrvs]);
        importLogsData([...threads, ...newThreads], [...logs, ...newLogs]);

        setMessage({ type: 'success', text: `インポート成功: コマンド${newCmds.length}件, サーバー${newSrvs.length}件` });
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'ファイルの読み込みに失敗しました。形式を確認してください。' });
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">

        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-slate-400" />
            データ管理
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">バックアップ作成</h3>
            <p className="text-xs text-slate-500">現在のすべてのコマンドとサーバー設定をJSONファイルとしてダウンロードします。</p>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg border border-slate-700 transition-colors"
            >
              <Download size={18} />
              エクスポート
            </button>
          </div>

          <div className="border-t border-slate-800 my-4"></div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">データの復元</h3>
            <p className="text-xs text-slate-500">バックアップファイルを読み込みます。既存のデータは保持され、新しいデータとして追加されます。</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-3 rounded-lg border border-blue-500/20 transition-colors"
            >
              <Upload size={18} />
              インポート (追加)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};