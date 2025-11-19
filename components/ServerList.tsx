import React, { useMemo } from 'react';
import { ServerCard } from './ServerCard';
import { Server as ServerIcon } from 'lucide-react';
import { useServerStore } from '../stores/useServerStore';
import { useUIStore } from '../stores/useUIStore';

export const ServerList: React.FC = () => {
  const { servers, selectedProject, deleteServer } = useServerStore();
  const { searchQuery, openServerModal, selectServer } = useUIStore();

  const filteredServers = useMemo(() => {
    return servers.filter(item => {
      const matchesProject = selectedProject === 'All' || item.project === selectedProject;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(searchLower) ||
        item.host.toLowerCase().includes(searchLower) ||
        item.project.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower));
      return matchesProject && matchesSearch;
    }).sort((a, b) => a.project.localeCompare(b.project) || a.name.localeCompare(b.name));
  }, [servers, selectedProject, searchQuery]);

  if (filteredServers.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <div className="bg-slate-900 p-6 rounded-full mb-4 border border-slate-800">
          <ServerIcon size={48} className="opacity-50" />
        </div>
        <p className="text-lg font-medium mb-2">サーバーが見つかりません</p>
        <p className="text-sm opacity-70">サーバーを追加してインフラ管理を始めましょう。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {filteredServers.map(item => (
        <ServerCard 
          key={item.id} 
          item={item} 
          onDelete={deleteServer}
          onEdit={(item) => openServerModal(item.id)}
          onOpenDetail={(item) => selectServer(item.id)}
        />
      ))}
    </div>
  );
};