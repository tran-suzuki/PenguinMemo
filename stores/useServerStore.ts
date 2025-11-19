
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
  addLog: (
    threadId: string, 
    command: string, 
    output: string, 
    user?: string, 
    directory?: string,
    fileContentBefore?: string,
    fileContentAfter?: string
  ) => void;
  addLogs: (threadId: string, entries: { command: string; output: string; user?: string; directory?: string }[]) => void;
  updateLog: (logId: string, updates: Partial<ServerCommandLog>) => void;
  deleteLog: (logId: string) => void;
  reorderLogs: (activeId: string, overId: string) => void;

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

      addLog: (threadId, command, output, user, directory, fileContentBefore, fileContentAfter) => set((state) => {
        // Calculate next order
        const threadLogs = state.logs.filter(l => l.threadId === threadId);
        const maxOrder = threadLogs.length > 0 
          ? Math.max(...threadLogs.map(l => l.order || 0)) 
          : -1;

        return {
          logs: [...state.logs, {
            id: uuidv4(),
            threadId,
            command,
            output,
            user,
            directory,
            fileContentBefore,
            fileContentAfter,
            order: maxOrder + 1,
            createdAt: Date.now()
          }]
        };
      }),

      addLogs: (threadId, entries) => set((state) => {
        const threadLogs = state.logs.filter(l => l.threadId === threadId);
        let currentMaxOrder = threadLogs.length > 0 
          ? Math.max(...threadLogs.map(l => l.order || 0)) 
          : -1;

        const newLogs: ServerCommandLog[] = entries.map(entry => {
          currentMaxOrder++;
          return {
            id: uuidv4(),
            threadId,
            command: entry.command,
            output: entry.output,
            user: entry.user,
            directory: entry.directory,
            order: currentMaxOrder,
            createdAt: Date.now()
          };
        });

        return {
          logs: [...state.logs, ...newLogs]
        };
      }),

      updateLog: (logId, updates) => set((state) => ({
        logs: state.logs.map(l => l.id === logId ? { ...l, ...updates } : l)
      })),

      deleteLog: (logId) => set((state) => ({
        logs: state.logs.filter(l => l.id !== logId)
      })),

      reorderLogs: (activeId, overId) => set((state) => {
        const logs = [...state.logs];
        const activeIndex = logs.findIndex(l => l.id === activeId);
        const overIndex = logs.findIndex(l => l.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
           // Note: This assumes we are sorting logs within the same thread view.
           const threadId = logs[activeIndex].threadId;
           const threadLogs = logs.filter(l => l.threadId === threadId).sort((a, b) => (a.order || 0) - (b.order || 0));
           
           const oldIndex = threadLogs.findIndex(l => l.id === activeId);
           const newIndex = threadLogs.findIndex(l => l.id === overId);
           
           const [movedItem] = threadLogs.splice(oldIndex, 1);
           threadLogs.splice(newIndex, 0, movedItem);

           threadLogs.forEach((log, index) => {
             log.order = index;
           });

           const otherLogs = logs.filter(l => l.threadId !== threadId);
           return { logs: [...otherLogs, ...threadLogs] };
        }
        return { logs };
      }),

      importServerData: (servers, threads, logs) => set({ servers, threads, logs }),
    }),
    {
      name: 'penguin-memo-server-store',
    }
  )
);