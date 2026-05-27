import React from 'react';
import { ServerItem } from '../../types';
import { ExternalLink, Copy, Eye, EyeOff, Users } from 'lucide-react';
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility';

interface ServerCredentialsPopoverProps {
  server: ServerItem;
  onOpenLink: (url: string) => void;
}

/**
 * ヘッダ右側の資格情報表示。
 * - コントロールパネル(Console)ボタン + ログイン情報ホバーカード
 * - Root パスワード / 追加ユーザーのホバーカード
 */
export const ServerCredentialsPopover: React.FC<ServerCredentialsPopoverProps> = ({ server, onOpenLink }) => {
  const { visible: showPassword, toggle } = usePasswordVisibility(false);

  return (
    <>
      {server.controlPanelUrl && (
        <div className="relative group">
          <button
            onClick={() => onOpenLink(server.controlPanelUrl!)}
            className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
            title="コントロールパネルを開く"
          >
            <ExternalLink size={16} />
            <span className="text-xs font-medium hidden sm:inline">Console</span>
          </button>

          {/* Hover Card for Credentials */}
          {(server.controlPanelUser || server.controlPanelPassword) && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 hidden group-hover:block">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 border-b border-slate-800 pb-1">Login Info</div>
              <div className="space-y-2">
                {server.controlPanelUser && (
                  <div>
                    <div className="text-[10px] text-slate-500">User</div>
                    <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1">
                      <code className="text-xs text-blue-300 font-mono">{server.controlPanelUser}</code>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(server.controlPanelUser!);
                        }}
                        className="text-slate-500 hover:text-white"
                        title="Copy User"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                )}
                {server.controlPanelPassword && (
                  <div>
                    <div className="text-[10px] text-slate-500">Password</div>
                    <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1 gap-2">
                      <code className="text-xs text-slate-400 font-mono flex-1 truncate">
                        {showPassword ? server.controlPanelPassword : '••••••••'}
                      </code>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggle();
                          }}
                          className="text-slate-500 hover:text-white"
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(server.controlPanelPassword!);
                          }}
                          className="text-slate-500 hover:text-white"
                          title="Copy Password"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Root Password & Additional Users Display */}
      {(server.rootPassword || (server.additionalUsers && server.additionalUsers.length > 0)) && (
        <div className="relative group ml-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-slate-800">
            <Users size={16} />
            <span className="text-xs font-medium hidden sm:inline">Users</span>
          </button>

          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-50 hidden group-hover:block">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 border-b border-slate-800 pb-1">Server Credentials</div>
            <div className="space-y-3">
              {server.rootPassword && (
                <div>
                  <div className="text-[10px] text-red-400 font-bold mb-1">Root Password</div>
                  <div className="flex items-center justify-between bg-slate-950 rounded px-2 py-1 gap-2">
                    <code className="text-xs text-slate-400 font-mono flex-1 truncate">
                      {showPassword ? server.rootPassword : '••••••••'}
                    </code>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggle();
                        }}
                        className="text-slate-500 hover:text-white"
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(server.rootPassword!);
                        }}
                        className="text-slate-500 hover:text-white"
                        title="Copy Password"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {server.additionalUsers && server.additionalUsers.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-500 font-bold mb-1">Additional Users</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {server.additionalUsers.map((user, idx) => (
                      <div key={idx} className="bg-slate-950 rounded p-2 border border-slate-800/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-blue-300 font-mono">{user.username}</span>
                          {user.note && <span className="text-[10px] text-slate-600">{user.note}</span>}
                        </div>
                        {user.password && (
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs text-slate-500 font-mono flex-1 truncate">
                              {showPassword ? user.password : '••••••••'}
                            </code>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigator.clipboard.writeText(user.password!);
                                }}
                                className="text-slate-600 hover:text-white"
                                title="Copy Password"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
