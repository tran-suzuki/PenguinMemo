import { create } from 'zustand';
import { ViewMode } from '../../../types';

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
    // コマンドモーダルを開いたときの初期スコープ（このサーバー専用で新規追加する場合に使用）
    commandModalDefaultServerId: string | null;

    // Actions
    setViewMode: (mode: ViewMode) => void;
    setSearchQuery: (query: string) => void;

    openCommandModal: (commandId?: string, defaultServerId?: string | null) => void;
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
    commandModalDefaultServerId: null,

    setViewMode: (mode) => set({ viewMode: mode, searchQuery: '' }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    openCommandModal: (commandId, defaultServerId) => set({ isCommandModalOpen: true, editingCommandId: commandId || null, commandModalDefaultServerId: defaultServerId ?? null }),
    closeCommandModal: () => set({ isCommandModalOpen: false, editingCommandId: null, commandModalDefaultServerId: null }),

    openServerModal: (serverId) => set({ isServerModalOpen: true, editingServerId: serverId || null }),
    closeServerModal: () => set({ isServerModalOpen: false, editingServerId: null }),

    openSettingsModal: () => set({ isSettingsModalOpen: true }),
    closeSettingsModal: () => set({ isSettingsModalOpen: false }),

    selectServer: (serverId) => set({ selectedServerId: serverId }),
}));
