
import { processImportData } from './services/storageService.ts';
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

// Test 1: Default behavior (preserve IDs)
console.log("\nTest 1: Default behavior (regenerateIds = false)");
const result1 = processImportData(mockData);
if (result1.servers[0].id === 'server-1') {
    console.log("PASS: Server ID preserved.");
} else {
    console.error(`FAIL: Server ID changed to ${result1.servers[0].id}`);
}

if (result1.threads[0].serverId === 'server-1') {
    console.log("PASS: Thread serverId reference preserved.");
} else {
    console.error(`FAIL: Thread serverId reference changed to ${result1.threads[0].serverId}`);
}

// Test 2: Regenerate IDs (regenerateIds = true)
console.log("\nTest 2: Regenerate IDs (regenerateIds = true)");
const result2 = processImportData(mockData, true);
if (result2.servers[0].id !== 'server-1') {
    console.log("PASS: Server ID regenerated.");
} else {
    console.error("FAIL: Server ID was NOT regenerated.");
}

if (result2.threads[0].serverId === result2.servers[0].id) {
    console.log("PASS: Thread serverId reference updated correctly.");
} else {
    console.error("FAIL: Thread serverId reference mismatch.");
}
