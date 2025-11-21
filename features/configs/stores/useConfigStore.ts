import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ServerConfig } from '../../../types';
import { idbStorage } from '../../../services/indexedDBService';

interface ConfigState {
    configs: ServerConfig[];

    // Actions
    addConfig: (serverId: string, path: string, content: string, type: string) => void;
    updateConfig: (id: string, updates: Partial<ServerConfig>) => void;
    deleteConfig: (id: string) => void;
    deleteConfigsByServerId: (serverId: string) => void;
    importConfigs: (configs: ServerConfig[]) => void;
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            configs: [],

            addConfig: (serverId, path, content, type) => set((state) => ({
                configs: [...(state.configs || []), {
                    id: uuidv4(),
                    serverId,
                    path,
                    content,
                    type,
                    updatedAt: Date.now()
                }]
            })),

            updateConfig: (id, updates) => set((state) => ({
                configs: (state.configs || []).map(c =>
                    c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
                )
            })),

            deleteConfig: (id) => set((state) => ({
                configs: (state.configs || []).filter(c => c.id !== id)
            })),

            deleteConfigsByServerId: (serverId) => set((state) => ({
                configs: (state.configs || []).filter(c => c.serverId !== serverId)
            })),

            importConfigs: (configs) => set({ configs: configs || [] }),
        }),
        {
            name: 'penguin-memo-configs',
            storage: createJSONStorage(() => idbStorage),
        }
    )
);
