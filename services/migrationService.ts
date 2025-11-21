import { idbStorage } from './indexedDBService';
import { useServerStore } from '../features/servers/stores/useServerStore';
import { useLogStore } from '../features/command-logs/stores/useLogStore';
import { useConfigStore } from '../features/configs/stores/useConfigStore';

const OLD_STORE_KEY = 'penguin-memo-server-store';
const MIGRATION_FLAG_KEY = 'penguin-memo-migration-v2-completed';

export const migrateData = async () => {
    try {
        // Check if migration already completed
        const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
        if (isMigrated) {
            return;
        }

        console.log('Checking for legacy data to migrate...');

        // Get old data from IDB
        const oldDataString = await idbStorage.getItem(OLD_STORE_KEY);

        if (!oldDataString) {
            console.log('No legacy data found.');
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            return;
        }

        const parsedData = JSON.parse(oldDataString);
        const state = parsedData.state;

        if (!state) {
            console.log('Invalid legacy data format.');
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            return;
        }

        console.log('Legacy data found, starting migration...', state);

        // Migrate Servers
        if (state.servers && Array.isArray(state.servers) && state.servers.length > 0) {
            useServerStore.getState().importServers(state.servers);
            console.log(`Migrated ${state.servers.length} servers.`);
        }

        // Migrate Threads and Logs
        const threads = state.threads || [];
        const logs = state.logs || [];
        if (threads.length > 0 || logs.length > 0) {
            useLogStore.getState().importLogsData(threads, logs);
            console.log(`Migrated ${threads.length} threads and ${logs.length} logs.`);
        }

        // Migrate Configs
        if (state.configs && Array.isArray(state.configs) && state.configs.length > 0) {
            useConfigStore.getState().importConfigs(state.configs);
            console.log(`Migrated ${state.configs.length} configs.`);
        }

        // Mark migration as complete
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        console.log('Migration completed successfully.');

        // Optional: We could delete the old data, but keeping it as backup is safer for now.
        // await idbStorage.removeItem(OLD_STORE_KEY);

    } catch (error) {
        console.error('Migration failed:', error);
    }
};
