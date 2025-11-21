import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ServerItem, ServerDraft } from '../../../types';
import { idbStorage } from '../../../services/indexedDBService';

interface ServerState {
    servers: ServerItem[];
    selectedProject: string | 'All';

    // Actions
    setProjectFilter: (project: string | 'All') => void;
    addServer: (draft: ServerDraft) => void;
    updateServer: (id: string, draft: Partial<ServerDraft>) => void;
    deleteServer: (id: string) => void;
    importServers: (servers: ServerItem[]) => void;
}

export const useServerStore = create<ServerState>()(
    persist(
        (set) => ({
            servers: [],
            selectedProject: 'All',

            setProjectFilter: (project) => set({ selectedProject: project }),

            addServer: (draft) => set((state) => ({
                servers: [{
                    ...draft,
                    id: uuidv4(),
                    updatedAt: Date.now()
                }, ...state.servers]
            })),

            updateServer: (id, draft) => set((state) => ({
                servers: state.servers.map(srv =>
                    srv.id === id ? { ...srv, ...draft, updatedAt: Date.now() } : srv
                )
            })),

            deleteServer: (id) => set((state) => ({
                servers: state.servers.filter(srv => srv.id !== id)
            })),

            importServers: (servers) => set({ servers }),
        }),
        {
            name: 'penguin-memo-servers', // New key for separated store
            storage: createJSONStorage(() => idbStorage),
        }
    )
);
