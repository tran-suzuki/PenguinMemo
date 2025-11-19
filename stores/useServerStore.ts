import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ServerItem, ServerDraft, ServerThread, ServerCommandLog } from '../types';

interface ServerState {
  servers: ServerItem[];
  threads: ServerThread[];
  logs: ServerCommandLog[];
  selectedProject: string | 'All';

  // Actions - Server
  setProjectFilter: (project: string | 'All') => void;
  addServer: (draft: ServerDraft) => void;
  updateServer: (id: string, draft: ServerDraft) => void;
  deleteServer: (id: string) => void;

  // Actions - Threads
  addThread: (serverId: string, title: string) => void;
  deleteThread: (threadId: string) => void;

  // Actions - Logs
  addLog: (threadId: string, command: string, output: string) => void;
  deleteLog: (logId: string) => void;

  importServerData: (servers: ServerItem[], threads: ServerThread[], logs: ServerCommandLog[]) => void;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      threads: [],
      logs: [],
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
        servers: state.servers.filter(srv => srv.id !== id),
        // Cascade delete threads and logs would be ideal here, 
        // but for safety we might keep orphaned logs or clean them up explicitly.
        // Let's strictly clean up for consistency.
        threads: state.threads.filter(t => t.serverId !== id),
        logs: state.logs.filter(l => {
           const thread = state.threads.find(t => t.id === l.threadId);
           return thread && thread.serverId !== id;
        })
      })),

      addThread: (serverId, title) => set((state) => ({
        threads: [{
          id: uuidv4(),
          serverId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, ...state.threads]
      })),

      deleteThread: (threadId) => set((state) => ({
        threads: state.threads.filter(t => t.id !== threadId),
        logs: state.logs.filter(l => l.threadId !== threadId)
      })),

      addLog: (threadId, command, output) => set((state) => ({
        logs: [...state.logs, {
          id: uuidv4(),
          threadId,
          command,
          output,
          createdAt: Date.now()
        }]
      })),

      deleteLog: (logId) => set((state) => ({
        logs: state.logs.filter(l => l.id !== logId)
      })),

      importServerData: (servers, threads, logs) => set({ servers, threads, logs }),
    }),
    {
      name: 'penguin-memo-server-store',
    }
  )
);