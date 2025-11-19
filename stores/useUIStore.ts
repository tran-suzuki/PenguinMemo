import { create } from 'zustand';
import { ViewMode } from '../types';

interface UIState {
  viewMode: ViewMode;
  searchQuery: string;
  
  // Modal States
  isCommandModalOpen: boolean;
  isServerModalOpen: boolean;
  isSettingsModalOpen: boolean; // Future use
  
  // Selection States
  selectedServerId: string | null;
  editingCommandId: string | null;
  editingServerId: string | null;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  
  openCommandModal: (commandId?: string) => void;
  closeCommandModal: () => void;
  
  openServerModal: (serverId?: string) => void;
  closeServerModal: () => void;

  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  
  selectServer: (serverId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'commands',
  searchQuery: '',
  
  isCommandModalOpen: false,
  isServerModalOpen: false,
  isSettingsModalOpen: false,
  
  selectedServerId: null,
  editingCommandId: null,
  editingServerId: null,
  
  setViewMode: (mode) => set({ viewMode: mode, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  openCommandModal: (commandId) => set({ isCommandModalOpen: true, editingCommandId: commandId || null }),
  closeCommandModal: () => set({ isCommandModalOpen: false, editingCommandId: null }),
  
  openServerModal: (serverId) => set({ isServerModalOpen: true, editingServerId: serverId || null }),
  closeServerModal: () => set({ isServerModalOpen: false, editingServerId: null }),

  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
  
  selectServer: (serverId) => set({ selectedServerId: serverId }),
}));