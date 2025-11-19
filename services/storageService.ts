import { v4 as uuidv4 } from 'uuid';
import { 
  BackupData, 
  CommandItem, 
  ServerItem, 
  ServerThread, 
  ServerCommandLog 
} from '../types';

export const exportData = (
  commands: CommandItem[],
  servers: ServerItem[],
  threads: ServerThread[],
  logs: ServerCommandLog[]
): string => {
  const data: BackupData = {
    version: 1,
    timestamp: Date.now(),
    commands,
    servers,
    threads,
    logs
  };
  return JSON.stringify(data, null, 2);
};

export const downloadBackup = (jsonString: string, filename = 'penguin-memo-backup.json') => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateBackupData = (data: any): data is BackupData => {
  return (
    data &&
    typeof data.version === 'number' &&
    Array.isArray(data.commands) &&
    Array.isArray(data.servers) &&
    Array.isArray(data.threads) &&
    Array.isArray(data.logs)
  );
};

// Import logic ensuring unique IDs to prevent conflicts
export const processImportData = (data: BackupData) => {
  // Create ID maps to track old -> new ID mapping
  const commandIdMap = new Map<string, string>();
  const serverIdMap = new Map<string, string>();
  const threadIdMap = new Map<string, string>();

  // Process Commands
  const newCommands = data.commands.map(cmd => {
    const newId = uuidv4();
    commandIdMap.set(cmd.id, newId);
    return { ...cmd, id: newId };
  });

  // Process Servers
  const newServers = data.servers.map(srv => {
    const newId = uuidv4();
    serverIdMap.set(srv.id, newId);
    return { ...srv, id: newId };
  });

  // Process Threads (update serverId reference)
  const newThreads = data.threads.map(thread => {
    const newId = uuidv4();
    threadIdMap.set(thread.id, newId);
    const newServerId = serverIdMap.get(thread.serverId);
    
    // If parent server isn't in this backup, keep original ID (might correspond to existing server if we were doing a merge, but for now we assume import brings its own parents or creates new ones)
    // Ideally imports should be self-contained.
    
    return { 
      ...thread, 
      id: newId, 
      serverId: newServerId || thread.serverId 
    };
  }).filter(t => serverIdMap.has(t.serverId)); // Only keep threads for servers we just imported

  // Process Logs (update threadId reference)
  const newLogs = data.logs.map(log => {
    const newId = uuidv4();
    const newThreadId = threadIdMap.get(log.threadId);
    return {
      ...log,
      id: newId,
      threadId: newThreadId || log.threadId
    };
  }).filter(l => threadIdMap.has(l.threadId)); // Only keep logs for threads we just imported

  return {
    commands: newCommands,
    servers: newServers,
    threads: newThreads,
    logs: newLogs
  };
};