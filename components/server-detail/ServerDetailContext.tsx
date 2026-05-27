import React, { createContext, useContext } from 'react';
import { ServerItem } from '../../types';

export type ServerViewMode = 'logs' | 'configs' | 'webapps' | 'terminal' | 'files';

/**
 * ServerDetail 画面内で横断的に参照される値を共有する Context。
 * ヘッダ・各ビューへ props を素通しせず、必要な値だけを購読できるようにする(判断B)。
 */
export interface ServerDetailContextValue {
  server: ServerItem;
  onUpdate: (updates: Partial<ServerItem>) => void;
  viewMode: ServerViewMode;
  setViewMode: (mode: ServerViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isGeminiOpen: boolean;
  setIsGeminiOpen: (open: boolean) => void;
}

const ServerDetailContext = createContext<ServerDetailContextValue | null>(null);

export const ServerDetailProvider = ServerDetailContext.Provider;

export function useServerDetailContext(): ServerDetailContextValue {
  const ctx = useContext(ServerDetailContext);
  if (!ctx) {
    throw new Error('useServerDetailContext は ServerDetailProvider の内側で使用してください');
  }
  return ctx;
}
