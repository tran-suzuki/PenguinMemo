
export enum Category {
  FILE_SYSTEM = 'File System',
  NETWORK = 'Network',
  PROCESS = 'Process',
  USER_MGMT = 'User Management',
  ARCHIVE = 'Archive/Compression',
  SYSTEM_INFO = 'System Info',
  PACKAGE_MGMT = 'Package Mgmt',
  OTHER = 'Other'
}

export interface CommandItem {
  id: string;
  command: string;
  description: string;
  output?: string;
  category: Category;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ServerItem {
  id: string;
  project: string;
  name: string;
  host: string;
  username: string;
  port: number;
  authType: 'password' | 'key';
  authValue: string; // password or path/content of key
  description: string;
  tags: string[];
  updatedAt: number;
}

export interface ServerThread {
  id: string;
  serverId: string;
  title: string;
  order?: number; // Optional for backward compatibility
  createdAt: number;
  updatedAt: number;
}

export interface ServerCommandLog {
  id: string;
  threadId: string;
  command: string;
  output?: string;
  note?: string;
  user?: string;      // Execution user
  directory?: string; // Execution directory
  fileContentBefore?: string; // For editor commands (vi, nano)
  fileContentAfter?: string;  // For editor commands
  order: number;
  createdAt: number;
}

export interface ServerConfig {
  id: string;
  serverId: string;
  path: string;
  content: string;
  type: string;
  updatedAt: number;
}

export type CommandDraft = Omit<CommandItem, 'id' | 'createdAt' | 'updatedAt'>;
export type ServerDraft = Omit<ServerItem, 'id' | 'updatedAt'>;

export interface GeminiResponse {
  command: string;
  description: string;
  category: Category;
}

export type ViewMode = 'commands' | 'servers';

// Data structure for Export/Import
export interface BackupData {
  version: number;
  timestamp: number;
  commands: CommandItem[];
  servers: ServerItem[];
  threads: ServerThread[];
  logs: ServerCommandLog[];
  configs?: ServerConfig[];
}