import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ServerThread, ServerCommandLog } from '../../../types';
import { idbStorage } from '../../../services/indexedDBService';

interface LogState {
    threads: ServerThread[];
    logs: ServerCommandLog[];

    // Actions - Threads
    addThread: (serverId: string, title: string) => void;
    updateThread: (threadId: string, updates: Partial<ServerThread>) => void;
    reorderThreads: (activeId: string, overId: string) => void;
    deleteThread: (threadId: string) => void;
    deleteThreadsByServerId: (serverId: string) => void;

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

    importLogsData: (threads: ServerThread[], logs: ServerCommandLog[]) => void;
}

export const useLogStore = create<LogState>()(
    persist(
        (set) => ({
            threads: [],
            logs: [],

            addThread: (serverId, title) => set((state) => {
                const serverThreads = state.threads.filter(t => t.serverId === serverId);
                const maxOrder = serverThreads.length > 0
                    ? Math.max(...serverThreads.map(t => t.order ?? 0))
                    : -1;

                return {
                    threads: [{
                        id: uuidv4(),
                        serverId,
                        title,
                        order: maxOrder + 1,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }, ...state.threads]
                };
            }),

            updateThread: (threadId, updates) => set((state) => ({
                threads: state.threads.map(t =>
                    t.id === threadId ? { ...t, ...updates, updatedAt: Date.now() } : t
                )
            })),

            reorderThreads: (activeId, overId) => set((state) => {
                const threads = [...state.threads];
                const activeIndex = threads.findIndex(t => t.id === activeId);
                const overIndex = threads.findIndex(t => t.id === overId);

                if (activeIndex !== -1 && overIndex !== -1) {
                    const serverId = threads[activeIndex].serverId;
                    // Filter threads for the same server and sort them by current order
                    const serverThreads = threads
                        .filter(t => t.serverId === serverId)
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                    const oldIndex = serverThreads.findIndex(t => t.id === activeId);
                    const newIndex = serverThreads.findIndex(t => t.id === overId);

                    const [movedItem] = serverThreads.splice(oldIndex, 1);
                    serverThreads.splice(newIndex, 0, movedItem);

                    // Update order for all threads in this server
                    serverThreads.forEach((thread, index) => {
                        thread.order = index;
                    });

                    // Merge back into main threads array
                    const otherThreads = threads.filter(t => t.serverId !== serverId);
                    return { threads: [...otherThreads, ...serverThreads] };
                }
                return { threads };
            }),

            deleteThread: (threadId) => set((state) => ({
                threads: state.threads.filter(t => t.id !== threadId),
                logs: state.logs.filter(l => l.threadId !== threadId)
            })),

            deleteThreadsByServerId: (serverId) => set((state) => ({
                threads: state.threads.filter(t => t.serverId !== serverId),
                logs: state.logs.filter(l => {
                    const thread = state.threads.find(t => t.id === l.threadId);
                    return thread && thread.serverId !== serverId;
                })
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

            importLogsData: (threads, logs) => set({ threads, logs }),
        }),
        {
            name: 'penguin-memo-logs',
            storage: createJSONStorage(() => idbStorage),
        }
    )
);
