import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StateStorage } from 'zustand/middleware';

interface PenguinMemoDB extends DBSchema {
    keyval: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'penguin-memo-db';
const STORE_NAME = 'keyval';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PenguinMemoDB>>;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<PenguinMemoDB>(DB_NAME, VERSION, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME);
            },
        });
    }
    return dbPromise;
};

export const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const db = await getDB();
        let value = await db.get(STORE_NAME, name);

        if (!value) {
            // Lazy migration: Check localStorage
            const localValue = localStorage.getItem(name);
            if (localValue) {
                console.log(`Migrating ${name} from localStorage to IndexedDB`);
                try {
                    await db.put(STORE_NAME, localValue, name);
                    // Optional: Backup and clear localStorage
                    localStorage.setItem(`${name}_backup_migrated`, localValue);
                    localStorage.removeItem(name);
                    value = localValue;
                } catch (err) {
                    console.error('Error migrating data to IndexedDB:', err);
                }
            }
        }
        return value || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        const db = await getDB();
        await db.put(STORE_NAME, value, name);
    },
    removeItem: async (name: string): Promise<void> => {
        const db = await getDB();
        await db.delete(STORE_NAME, name);
    },
};

// Explicit migration function if needed manually
export const migrateFromLocalStorage = async (storeName: string) => {
    const localData = localStorage.getItem(storeName);
    if (localData) {
        console.log(`Found data in localStorage for ${storeName}, migrating to IndexedDB...`);
        try {
            const db = await getDB();
            const existing = await db.get(STORE_NAME, storeName);

            if (!existing) {
                await db.put(STORE_NAME, localData, storeName);
                console.log(`Migration for ${storeName} successful.`);
                localStorage.setItem(`${storeName}_backup_migrated`, localData);
                localStorage.removeItem(storeName);
            } else {
                console.log(`Data already exists in IndexedDB for ${storeName}, skipping migration.`);
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }
};
