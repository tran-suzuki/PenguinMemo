
import { v4 as uuidv4 } from 'uuid';
import {
  BackupData,
  CommandItem,
  ServerItem,
  ServerThread,
  ServerCommandLog,
  ServerConfig
} from '../types';

// --- Backup / Restore Logic ---

export const exportData = (
  commands: CommandItem[],
  servers: ServerItem[],
  threads: ServerThread[],
  logs: ServerCommandLog[],
  configs: ServerConfig[] = []
): string => {
  const data: BackupData = {
    version: 1,
    timestamp: Date.now(),
    commands,
    servers,
    threads,
    logs,
    configs
  };
  return JSON.stringify(data, null, 2);
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadBackup = (jsonString: string, filename = 'penguin-memo-backup.json') => {
  downloadFile(jsonString, filename, 'application/json');
};

export const validateBackupData = (data: any): data is BackupData => {
  return (
    data &&
    typeof data.version === 'number' &&
    Array.isArray(data.commands) &&
    Array.isArray(data.servers) &&
    Array.isArray(data.threads) &&
    Array.isArray(data.logs)
    // configs is optional in older backups, so we don't strictly check it
  );
};

// Import logic ensuring unique IDs to prevent conflicts
export const processImportData = (data: BackupData) => {
  // Create ID maps to track old -> new ID mapping
  const commandIdMap = new Map<string, string>();
  const serverIdMap = new Map<string, string>();
  const threadIdMap = new Map<string, string>();
  const configIdMap = new Map<string, string>();

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
  // Process Threads (update serverId reference)
  const newThreads = data.threads
    .filter(thread => serverIdMap.has(thread.serverId))
    .map(thread => {
      const newId = uuidv4();
      threadIdMap.set(thread.id, newId);
      const newServerId = serverIdMap.get(thread.serverId)!;

      return {
        ...thread,
        id: newId,
        serverId: newServerId
      };
    });

  // Process Logs (update threadId reference)
  const newLogs = data.logs
    .filter(log => threadIdMap.has(log.threadId))
    .map(log => {
      const newId = uuidv4();
      const newThreadId = threadIdMap.get(log.threadId)!;
      return {
        ...log,
        id: newId,
        threadId: newThreadId
      };
    });

  // Process Configs (update serverId reference)
  const newConfigs = (data.configs || [])
    .filter(config => serverIdMap.has(config.serverId))
    .map(config => {
      const newId = uuidv4();
      configIdMap.set(config.id, newId);
      const newServerId = serverIdMap.get(config.serverId)!;
      return {
        ...config,
        id: newId,
        serverId: newServerId
      };
    });

  return {
    commands: newCommands,
    servers: newServers,
    threads: newThreads,
    logs: newLogs,
    configs: newConfigs
  };
};

// --- Thread Export Logic ---

export const exportThreadToMarkdown = (
  server: ServerItem,
  thread: ServerThread,
  logs: ServerCommandLog[]
) => {
  const sortedLogs = [...logs].sort((a, b) => (a.order || 0) - (b.order || 0));
  const dateStr = new Date(thread.createdAt).toLocaleDateString();

  let md = `# ${thread.title}\n`;
  md += `**Server:** ${server.name} (${server.host})\n`;
  md += `**Date:** ${dateStr}\n`;
  md += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  md += `--- \n\n`;

  sortedLogs.forEach(log => {
    const time = new Date(log.createdAt).toLocaleTimeString();

    md += `### ${time}\n\n`;

    // Note
    if (log.note) {
      md += `> **Note:** ${log.note}\n\n`;
    }

    // Context (User/Dir)
    if (log.user || log.directory) {
      const context = `[${log.user || 'user'}@${log.directory || '~'}]`;
      md += `\`${context}\`\n`;
    }

    // Command
    md += "```bash\n";
    md += log.command + "\n";
    md += "```\n\n";

    // Output or Diff
    if (log.fileContentBefore || log.fileContentAfter) {
      md += "**File Change (Diff):**\n";
      md += "<details><summary>Before</summary>\n\n";
      md += "```\n" + (log.fileContentBefore || '') + "\n```\n";
      md += "</details>\n";
      md += "<details><summary>After</summary>\n\n";
      md += "```\n" + (log.fileContentAfter || '') + "\n```\n";
      md += "</details>\n\n";
    } else if (log.output) {
      md += "**Output:**\n";
      md += "```\n";
      md += log.output + "\n";
      md += "```\n\n";
    }

    md += `\n`;
  });

  const filename = `${server.name}_${thread.title}_${dateStr}.md`.replace(/[\/\?<>\\:\*\|":]/g, '_');
  downloadFile(md, filename, 'text/markdown');
};

export const exportThreadToCsv = (
  server: ServerItem,
  thread: ServerThread,
  logs: ServerCommandLog[]
) => {
  const sortedLogs = [...logs].sort((a, b) => (a.order || 0) - (b.order || 0));

  // CSV Header
  const header = ['Timestamp', 'User', 'Directory', 'Command', 'Output', 'Note', 'FileContentBefore', 'FileContentAfter'];

  // Escape CSV fields
  const escapeCsv = (str: string | undefined) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = sortedLogs.map(log => {
    return [
      escapeCsv(new Date(log.createdAt).toISOString()),
      escapeCsv(log.user),
      escapeCsv(log.directory),
      escapeCsv(log.command),
      escapeCsv(log.output),
      escapeCsv(log.note),
      escapeCsv(log.fileContentBefore),
      escapeCsv(log.fileContentAfter)
    ].join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\n');

  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const filename = `${server.name}_${thread.title}.csv`.replace(/[\/\?<>\\:\*\|":]/g, '_');
  downloadFile(bom + csvContent, filename, 'text/csv');
};
