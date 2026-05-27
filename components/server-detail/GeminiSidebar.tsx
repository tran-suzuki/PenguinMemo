import React from 'react';
import { Sparkles, X, ExternalLink } from 'lucide-react';

interface GeminiSidebarProps {
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  onStartResize: () => void;
  onClose: () => void;
}

/**
 * Gemini サイドバー。Electron では BrowserView がこの領域に重ねて表示される。
 * Web/PWA では BrowserView が無いため、別ウィンドウで開く案内を表示する。
 */
export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({ sidebarRef, width, onStartResize, onClose }) => {
  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className="border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 transition-none relative"
    >
      {/* Resize Handle */}
      <div
        className="absolute -left-3 top-0 bottom-0 w-4 cursor-col-resize z-50 group"
        onMouseDown={onStartResize}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/50 transition-colors" />
      </div>

      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          Gemini
        </span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area - Only visible in Web/PWA or if Electron API is missing */}
      {!window.electronAPI && (
        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center text-center border-t border-slate-800">
          <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-lg shadow-blue-900/10">
            <Sparkles size={32} className="text-blue-400" />
          </div>
          <h3 className="text-white font-bold mb-2">Gemini</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-[240px] leading-relaxed">
            Googleのセキュリティ制限により、Web版ではGeminiをこの画面内に直接表示することはできません。
          </p>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            別ウィンドウで開く
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </aside>
  );
};
