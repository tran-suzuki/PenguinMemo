import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ServerItem, ServerDraft, ServerWebApp } from '../../../types';
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

    // Actions - Web Apps
    addWebApp: (serverId: string, webApp: Omit<ServerWebApp, 'id'>) => void;
    updateWebApp: (serverId: string, webAppId: string, updates: Partial<ServerWebApp>) => void;
    deleteWebApp: (serverId: string, webAppId: string) => void;
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

            addWebApp: (serverId, webApp) => set((state) => ({
                servers: state.servers.map(srv => {
                    if (srv.id !== serverId) return srv;
                    return {
                        ...srv,
                        webApps: [...(srv.webApps || []), { ...webApp, id: uuidv4() }],
                        updatedAt: Date.now()
                    };
                })
            })),

            updateWebApp: (serverId, webAppId, updates) => set((state) => ({
                servers: state.servers.map(srv => {
                    if (srv.id !== serverId) return srv;
                    return {
                        ...srv,
                        webApps: (srv.webApps || []).map(app =>
                            app.id === webAppId ? { ...app, ...updates } : app
                        ),
                        updatedAt: Date.now()
                    };
                })
            })),

            deleteWebApp: (serverId, webAppId) => set((state) => ({
                servers: state.servers.map(srv => {
                    if (srv.id !== serverId) return srv;
                    return {
                        ...srv,
                        webApps: (srv.webApps || []).filter(app => app.id !== webAppId),
                        updatedAt: Date.now()
                    };
                })
            })),
        }),
        {
            name: 'penguin-memo-servers', // New key for separated store
            storage: createJSONStorage(() => idbStorage),
        }
    )
);
