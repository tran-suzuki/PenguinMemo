
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Copy, Check, Trash2, ChevronUp, ChevronDown, ArrowUpDown, GripVertical, Edit2, Save, X, Sparkles, Loader2, StickyNote, FileDiff } from 'lucide-react';
import { ServerCommandLog } from '../../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useServerStore } from '../../stores/useServerStore';
import { generateLogNote } from '../../services/geminiService';
import * as Diff from 'diff';

interface LogStreamProps {
  logs: ServerCommandLog[];
  sessionStartTime?: number;
  onDeleteLog: (id: string) => void;
}

export const LogStream: React.FC<LogStreamProps> = ({ logs, sessionStartTime, onDeleteLog }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  const { reorderLogs, updateLog } = useServerStore();

  // D&D Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Enable clicks for buttons inside items
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort logs by order
  const sortedLogs = [...logs].sort((a, b) => (a.order || 0) - (b.order || 0));

  useEffect(() => {
    if (!isSortMode) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isSortMode]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderLogs(active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth pb-6 flex flex-col">
      {/* Header / Controls */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="bg-slate-900 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-800">
           {new Date(sessionStartTime || Date.now()).toLocaleString()} - Session Started
        </span>
        
        <button
          onClick={() => setIsSortMode(!isSortMode)}
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            isSortMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpDown size={14} />
          {isSortMode ? '並び替え完了' : '並び替えモード'}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedLogs.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {sortedLogs.map((log) => (
              <SortableLogItem 
                key={log.id} 
                log={log} 
                onDelete={() => onDeleteLog(log.id)}
                onUpdate={(updates) => updateLog(log.id, updates)}
                isSortMode={isSortMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div ref={endRef} />
    </div>
  );
};

interface SortableLogItemProps {
  log: ServerCommandLog;
  onDelete: () => void;
  onUpdate: (updates: Partial<ServerCommandLog>) => void;
  isSortMode: boolean;
}

const SortableLogItem: React.FC<SortableLogItemProps> = ({ log, onDelete, onUpdate, isSortMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: log.id, disabled: !isSortMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      {/* Drag Handle */}
      {isSortMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="w-8 flex items-center justify-center text-slate-600 hover:text-blue-400 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={20} />
        </div>
      )}

      {/* Log Content */}
      <div className="flex-1 min-w-0">
        <LogItemContent log={log} onDelete={onDelete} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

const DiffViewer: React.FC<{ before: string, after: string }> = ({ before, after }) => {
  const diff = Diff.diffLines(before, after);

  return (
    <div className="p-3 bg-[#0a0a0a] overflow-x-auto font-mono text-xs leading-relaxed">
       {diff.map((part, index) => {
         const color = part.added ? 'bg-green-900/20 text-green-400' :
                       part.removed ? 'bg-red-900/20 text-red-400' : 'text-slate-400';
         const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
         return (
           <span key={index} className={`${color} block whitespace-pre-wrap border-l-2 ${part.added ? 'border-green-500/50' : part.removed ? 'border-red-500/50' : 'border-transparent'} pl-2`}>
             {part.value.replace(/\n$/, '')}
           </span>
         );
       })}
    </div>
  );
};

const LogItemContent: React.FC<{ 
  log: ServerCommandLog; 
  onDelete: () => void;
  onUpdate: (updates: Partial<ServerCommandLog>) => void;
}> = ({ log, onDelete, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editCommand, setEditCommand] = useState(log.command);
  const [editOutput, setEditOutput] = useState(log.output || '');
  const [editNote, setEditNote] = useState(log.note || '');
  const [editUser, setEditUser] = useState(log.user || '');
  const [editDir, setEditDir] = useState(log.directory || '');
  const [editBefore, setEditBefore] = useState(log.fileContentBefore || '');
  const [editAfter, setEditAfter] = useState(log.fileContentAfter || '');
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Update state when log changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditCommand(log.command);
      setEditOutput(log.output || '');
      setEditNote(log.note || '');
      setEditUser(log.user || '');
      setEditDir(log.directory || '');
      setEditBefore(log.fileContentBefore || '');
      setEditAfter(log.fileContentAfter || '');
    }
  }, [log, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(log.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiGenerateNote = async () => {
    if (!editCommand) return;
    setIsAiGenerating(true);
    try {
      // If it's a file edit, prompt differently or send diff summary
      const context = (editBefore || editAfter) 
        ? `File Change detected. \nBefore:\n${editBefore.slice(0,500)}\nAfter:\n${editAfter.slice(0,500)}` 
        : editOutput;
        
      const note = await generateLogNote(editCommand, context);
      setEditNote(note);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = () => {
    onUpdate({
      command: editCommand,
      output: editOutput,
      note: editNote,
      user: editUser || undefined,
      directory: editDir || undefined,
      fileContentBefore: editBefore || undefined,
      fileContentAfter: editAfter || undefined
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditCommand(log.command);
    setEditOutput(log.output || '');
    setEditNote(log.note || '');
    setEditUser(log.user || '');
    setEditDir(log.directory || '');
    setEditBefore(log.fileContentBefore || '');
    setEditAfter(log.fileContentAfter || '');
  };

  const isFileLog = !!(log.fileContentBefore || log.fileContentAfter);
  const isEditingFileLog = !!(editBefore || editAfter || isFileLog);

  // --- Editing Mode View ---
  if (isEditing) {
    return (
       <div className="pl-4 border-l-2 border-blue-500/50 relative">
         <div className="absolute -left-[9px] top-3 w-4 h-4 bg-slate-900 border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
         </div>

         <div className="bg-slate-900 border border-blue-500/30 rounded-lg p-4 space-y-4 shadow-xl">
           <div className="flex justify-between items-center">
             <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">ログを編集</h4>
             <button onClick={handleCancel} className="text-slate-500 hover:text-white"><X size={16} /></button>
           </div>

           {/* Context Edit */}
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">実行ユーザー</label>
                <input
                  value={editUser}
                  onChange={(e) => setEditUser(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-2 py-1.5 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="root"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">実行ディレクトリ</label>
                <input
                  value={editDir}
                  onChange={(e) => setEditDir(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-2 py-1.5 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="/var/www"
                />
              </div>
           </div>

           <div>
             <label className="block text-xs text-slate-400 mb-1">コマンド</label>
             <input
               value={editCommand}
               onChange={(e) => setEditCommand(e.target.value)}
               className="w-full bg-black border border-slate-700 rounded px-3 py-2 font-mono text-sm text-green-400 focus:ring-1 focus:ring-blue-500 outline-none"
             />
           </div>

           {isEditingFileLog ? (
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs text-slate-400 mb-1">Before (編集前)</label>
                 <textarea
                   value={editBefore}
                   onChange={(e) => setEditBefore(e.target.value)}
                   className="w-full h-32 bg-black border border-slate-700 rounded px-3 py-2 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-xs text-slate-400 mb-1">After (編集後)</label>
                 <textarea
                   value={editAfter}
                   onChange={(e) => setEditAfter(e.target.value)}
                   className="w-full h-32 bg-black border border-slate-700 rounded px-3 py-2 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                 />
               </div>
             </div>
           ) : (
             <div>
               <label className="block text-xs text-slate-400 mb-1">実行結果</label>
               <textarea
                 value={editOutput}
                 onChange={(e) => setEditOutput(e.target.value)}
                 className="w-full h-24 bg-black border border-slate-700 rounded px-3 py-2 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
               />
             </div>
           )}

           <div>
             <div className="flex items-center justify-between mb-1">
               <label className="block text-xs text-slate-400">備考 (Note)</label>
               <button 
                  onClick={handleAiGenerateNote}
                  disabled={isAiGenerating || !editCommand}
                  className="flex items-center gap-1 text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                >
                  {isAiGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  AI 自動入力
               </button>
             </div>
             <textarea
               value={editNote}
               onChange={(e) => setEditNote(e.target.value)}
               placeholder="コマンドの目的や結果のメモ..."
               className="w-full h-16 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
             />
           </div>

           <div className="flex justify-end gap-2 pt-2">
             <button 
               onClick={handleCancel}
               className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
             >
               キャンセル
             </button>
             <button 
               onClick={handleSave}
               className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1 transition-colors"
             >
               <Save size={14} />
               保存
             </button>
           </div>
         </div>
       </div>
    );
  }

  // --- Display Mode View ---
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
            <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-400" title="編集">
              <Edit2 size={12} />
            </button>
            <button onClick={handleCopy} className="text-slate-500 hover:text-white" title="コマンドをコピー">
              {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
            </button>
            <button onClick={onDelete} className="text-slate-500 hover:text-red-400" title="削除">
              <Trash2 size={12} />
            </button>
         </div>
      </div>

      <div className="bg-slate-900/50 rounded-md border border-slate-800 overflow-hidden">
        {/* Command */}
        <div className="bg-black/50 px-3 py-2 border-b border-slate-800/50 flex flex-col">
           {(log.user || log.directory) && (
             <div className="text-xs font-mono mb-1 flex items-center gap-1 select-none">
                <span className="text-emerald-500">[{log.user || 'user'}</span>
                <span className="text-slate-500">@</span>
                <span className="text-blue-400">{log.directory || '~'}]</span>
             </div>
           )}
           <div className="flex items-start gap-2">
             <span className="text-slate-500 select-none mt-0.5">$</span>
             <code className="flex-1 font-mono text-sm text-slate-200 whitespace-pre-wrap">{log.command}</code>
           </div>
        </div>
        
        {/* Content/Diff/Output Toggle */}
        {(log.output || isFileLog) && (
          <div>
             <div 
                className="px-3 py-1 bg-slate-950 border-b border-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-900"
                onClick={() => setExpanded(!expanded)}
              >
               <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-2">
                 {isFileLog ? <><FileDiff size={12} /> File Diff</> : 'Output'}
               </span>
               {expanded ? <ChevronUp size={12} className="text-slate-600"/> : <ChevronDown size={12} className="text-slate-600"/>}
             </div>
             {expanded && (
                isFileLog ? (
                  <DiffViewer before={log.fileContentBefore || ''} after={log.fileContentAfter || ''} />
                ) : (
                  <div className="p-3 bg-[#0a0a0a] overflow-x-auto max-h-96">
                    <pre className="font-mono text-xs text-slate-400 leading-relaxed">{log.output}</pre>
                  </div>
                )
             )}
          </div>
        )}

        {/* Note Section */}
        {log.note && (
          <div className="px-3 py-2 bg-yellow-900/5 border-t border-slate-800 flex gap-2 items-start">
            <StickyNote size={14} className="text-yellow-600/50 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">{log.note}</p>
          </div>
        )}
      </div>
    </div>
  );
};
