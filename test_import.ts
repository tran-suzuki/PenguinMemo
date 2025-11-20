
import { processImportData } from './services/storageService';
import { BackupData, Category } from './types';

// Mock Data
const mockData: BackupData = {
    version: 1,
    timestamp: Date.now(),
    commands: [],
    servers: [
        {
            id: 'server-1',
            project: 'Test Project',
            name: 'Test Server',
            host: 'localhost',
            username: 'user',
            port: 22,
            authType: 'password',
            authValue: 'pass',
            description: 'Test',
            tags: [],
            updatedAt: Date.now()
        }
    ],
    threads: [
        {
            id: 'thread-1',
            serverId: 'server-1',
            title: 'Test Thread',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    ],
    logs: [
        {
            id: 'log-1',
            threadId: 'thread-1',
            command: 'ls -la',
            output: 'total 0',
            order: 0,
            createdAt: Date.now()
        }
    ]
};

console.log("--- Testing processImportData ---");
const result = processImportData(mockData);

console.log("Servers:", result.servers.length);
console.log("Threads:", result.threads.length);
console.log("Logs:", result.logs.length);

if (result.logs.length === 0) {
    console.error("FAIL: Logs were filtered out!");
} else {
    console.log("SUCCESS: Logs were imported.");
}
