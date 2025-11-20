import React, { useState } from 'react';
import { Plus, Hash, Trash2, ArrowDownUp, GripVertical, Edit2, Check, X } from 'lucide-react';
import { ServerThread } from '../../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useServerStore } from '../../stores/useServerStore';

interface ThreadListProps {
  threads: ServerThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (title: string) => void;
  onDeleteThread: (id: string) => void;
}

interface SortableThreadItemProps {
  thread: ServerThread;
  isActive: boolean;
  isSortMode: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

const SortableThreadItem: React.FC<SortableThreadItemProps> = ({
  thread,
  isActive,
  isSortMode,
  onSelect,
  onDelete,
  onRename
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: thread.id, disabled: !isSortMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(thread.title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-1 px-2 py-1 mx-2 rounded-lg mb-1 bg-slate-900 border border-blue-500/30"
      >
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white outline-none min-w-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button onClick={handleSave} className="text-green-400 hover:text-green-300 p-1">
          <Check size={14} />
        </button>
        <button onClick={handleCancel} className="text-red-400 hover:text-red-300 p-1">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg mb-1 cursor-pointer transition-colors ${isActive
          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      onClick={isSortMode ? undefined : onSelect}
    >
      <div className="flex items-center gap-2 truncate flex-1">
        {isSortMode && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
            <GripVertical size={14} />
          </div>
        )}
        {!isSortMode && (
          <Hash size={14} className={isActive ? 'text-blue-500' : 'text-slate-600'} />
        )}
        <span className="text-sm font-medium truncate select-none">{thread.title}</span>
      </div>

      {isSortMode ? (
        <div className="flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="text-slate-500 hover:text-blue-400 p-1 transition-all"
          >
            <Edit2 size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm('スレッドを削除しますか？')) onDelete(thread.id); }}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSortMode, setIsSortMode] = useState(false);

  const { updateThread, reorderThreads } = useServerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onCreateThread(newTitle);
      setNewTitle('');
      setIsCreating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderThreads(active.id as string, over.id as string);
    }
  };

  // Sort threads: if order exists, sort by order. Else sort by createdAt descending (default)
  // However, for drag and drop to work intuitively, we usually want a stable sort.
  // If we are in sort mode, we definitely want to respect 'order'.
  // If 'order' is missing, we treat it as 0 or based on index.
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Fallback to createdAt if order is missing (backward compatibility)
    // But if one has order and other doesn't, we need a policy.
    // Let's assume if order is missing, it's treated as very old or very new.
    // Actually, the store logic for adding threads assigns maxOrder + 1.
    // So new threads have order. Old threads don't.
    // We should probably treat undefined order as -1 or 0.
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;

    return b.createdAt - a.createdAt;
  });

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-925 flex flex-col">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">スレッド一覧</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSortMode(!isSortMode)}
            className={`p-1 rounded transition-colors ${isSortMode ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 hover:text-slate-300'}`}
            title={isSortMode ? "並び替え終了" : "並び替え・編集"}
          >
            <ArrowDownUp size={16} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-400/10 rounded transition-colors"
            title="新規スレッド"
            disabled={isSortMode}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="p-2 border-b border-slate-800 bg-slate-900">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="スレッド名..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            onBlur={() => !newTitle && setIsCreating(false)}
          />
        </form>
      )}

      <div className="overflow-y-auto flex-1 py-2">
        {sortedThreads.length === 0 && !isCreating && (
          <div className="px-4 py-8 text-center text-slate-600 text-xs">
            スレッドがありません。<br />+ボタンで作成してください。
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedThreads.map(t => t.id)}
            strategy={verticalListSortingStrategy}
            disabled={!isSortMode}
          >
            {sortedThreads.map(thread => (
              <SortableThreadItem
                key={thread.id}
                thread={thread}
                isActive={activeThreadId === thread.id}
                isSortMode={isSortMode}
                onSelect={() => onSelectThread(thread.id)}
                onDelete={() => onDeleteThread(thread.id)}
                onRename={(newTitle) => updateThread(thread.id, { title: newTitle })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  );
};