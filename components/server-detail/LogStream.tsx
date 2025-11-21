
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Copy, Check, Trash2, ChevronUp, ChevronDown, ArrowUpDown, GripVertical, Edit2, Save, X, Sparkles, Loader2, StickyNote, FileDiff, Minus, Plus, Maximize2, Minimize2 } from 'lucide-react';
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
import { SyntaxHighlighter } from '../SyntaxHighlighter';

interface LogStreamProps {
  logs: ServerCommandLog[];
  sessionStartTime?: number;
  onDeleteLog: (id: string) => void;
}

export const LogStream: React.FC<LogStreamProps> = ({ logs, sessionStartTime, onDeleteLog }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [collapsedLogIds, setCollapsedLogIds] = useState<Set<string>>(new Set());
  const { reorderLogs, updateLog } = useServerStore();

  const toggleLog = (id: string) => {
    setCollapsedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedLogIds(new Set());
  const collapseAll = () => setCollapsedLogIds(new Set(logs.map(l => l.id)));

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

        <div className="flex items-center gap-2">
          {/* Font Size */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-800 hidden sm:flex">
            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={14} /></button>
            <span className="text-[10px] text-slate-400 w-8 text-center font-mono">{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Plus size={14} /></button>
          </div>

          {/* Expand/Collapse All */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-800 mr-2">
            <button onClick={expandAll} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="すべて展開"><Maximize2 size={14} /></button>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <button onClick={collapseAll} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="すべて折りたたみ"><Minimize2 size={14} /></button>
          </div>

          <button
            onClick={() => setIsSortMode(!isSortMode)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${isSortMode
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
          >
            <ArrowUpDown size={14} />
            {isSortMode ? '完了' : '並び替え'}
          </button>
        </div>
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
                fontSize={fontSize}
                isExpanded={!collapsedLogIds.has(log.id)}
                onToggle={() => toggleLog(log.id)}
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
  fontSize: number;
  isExpanded: boolean;
  onToggle: () => void;
}

import { LogItem } from './LogItem';

// ... imports

// ... LogStream component ...

const SortableLogItem: React.FC<SortableLogItemProps> = ({ log, onDelete, onUpdate, isSortMode, fontSize, isExpanded, onToggle }) => {
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
        <LogItem
          log={log}
          onDelete={onDelete}
          onUpdate={onUpdate}
          fontSize={fontSize}
          isExpanded={isExpanded}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
};
