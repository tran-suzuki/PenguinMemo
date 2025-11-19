import React, { useState, useRef, useEffect } from 'react';
import { Clock, Copy, Check, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ServerCommandLog } from '../../types';

interface LogStreamProps {
  logs: ServerCommandLog[];
  sessionStartTime?: number;
  onDeleteLog: (id: string) => void;
}

export const LogStream: React.FC<LogStreamProps> = ({ logs, sessionStartTime, onDeleteLog }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-6">
      <div className="text-center py-4">
         <span className="bg-slate-900 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-800">
           {new Date(sessionStartTime || Date.now()).toLocaleString()} - Session Started
         </span>
      </div>

      {logs.map((log) => (
        <LogItem key={log.id} log={log} onDelete={() => onDeleteLog(log.id)} />
      ))}
      <div ref={endRef} />
    </div>
  );
};

const LogItem: React.FC<{ log: ServerCommandLog; onDelete: () => void }> = ({ log, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(log.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative pl-4 border-l-2 border-slate-800 hover:border-slate-700 transition-colors">
      <div className="absolute -left-[9px] top-3 w-4 h-4 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-600 rounded-full group-hover:bg-blue-500 transition-colors" />
      </div>

      <div className="flex items-center justify-between mb-1.5">
         <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Clock size={10} />
            {new Date(log.createdAt).toLocaleTimeString()}
         </span>
         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button onClick={handleCopy} className="text-slate-500 hover:text-white" title="コマンドをコピー">
              {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
            </button>
            <button onClick={onDelete} className="text-slate-500 hover:text-red-400" title="削除">
              <Trash2 size={12} />
            </button>
         </div>
      </div>

      <div className="bg-slate-900/50 rounded-md border border-slate-800 overflow-hidden">
        <div className="bg-black/50 px-3 py-2 border-b border-slate-800/50 flex items-start gap-2">
           <span className="text-green-500 select-none mt-0.5">$</span>
           <code className="flex-1 font-mono text-sm text-slate-200 whitespace-pre-wrap">{log.command}</code>
        </div>
        {log.output && (
          <div>
             <div 
                className="px-3 py-1 bg-slate-950 border-b border-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-900"
                onClick={() => setExpanded(!expanded)}
              >
               <span className="text-[10px] uppercase font-bold text-slate-600">Output</span>
               {expanded ? <ChevronUp size={12} className="text-slate-600"/> : <ChevronDown size={12} className="text-slate-600"/>}
             </div>
             {expanded && (
                <div className="p-3 bg-[#0a0a0a] overflow-x-auto max-h-96">
                  <pre className="font-mono text-xs text-slate-400 leading-relaxed">{log.output}</pre>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};