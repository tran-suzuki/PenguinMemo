import React, { useMemo } from 'react';
import { CommandCard } from './CommandCard';
import { Command, Search } from 'lucide-react';
import { useCommandStore } from '../features/commands/stores/useCommandStore';
import { useUIStore } from '../features/ui/stores/useUIStore';

export const CommandList: React.FC = () => {
  const { commands, selectedCategory, deleteCommand } = useCommandStore();
  const { searchQuery, openCommandModal } = useUIStore();

  const filteredCommands = useMemo(() => {
    return commands.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        item.command.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.output && item.output.toLowerCase().includes(searchLower)) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower));

      return matchesCategory && matchesSearch;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [commands, selectedCategory, searchQuery]);

  if (filteredCommands.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <div className="bg-slate-900 p-6 rounded-full mb-4 border border-slate-800">
          <Command size={48} className="opacity-50" />
        </div>
        <p className="text-lg font-medium mb-2">コマンドが見つかりません</p>
        <p className="text-sm opacity-70">検索条件を変更するか、新しいコマンドを追加してください。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
      {filteredCommands.map(item => (
        <CommandCard
          key={item.id}
          item={item}
          onDelete={deleteCommand}
          onEdit={(item) => openCommandModal(item.id)}
        />
      ))}
    </div>
  );
};