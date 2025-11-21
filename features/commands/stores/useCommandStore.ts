import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CommandItem, CommandDraft, Category } from '../../../types';

interface CommandState {
    commands: CommandItem[];
    selectedCategory: Category | 'All';

    // Actions
    setCategory: (category: Category | 'All') => void;
    addCommand: (draft: CommandDraft) => void;
    updateCommand: (id: string, draft: CommandDraft) => void;
    deleteCommand: (id: string) => void;
    importCommands: (newCommands: CommandItem[]) => void;

    // Computed/Helpers can be implemented as getters in components or derived state here if needed
    // For simplicity, we'll do filtering in the selector or component
}

export const useCommandStore = create<CommandState>()(
    persist(
        (set) => ({
            commands: [],
            selectedCategory: 'All',

            setCategory: (category) => set({ selectedCategory: category }),

            addCommand: (draft) => set((state) => ({
                commands: [{
                    ...draft,
                    id: uuidv4(),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }, ...state.commands]
            })),

            updateCommand: (id, draft) => set((state) => ({
                commands: state.commands.map(cmd =>
                    cmd.id === id ? { ...cmd, ...draft, updatedAt: Date.now() } : cmd
                )
            })),

            deleteCommand: (id) => set((state) => ({
                commands: state.commands.filter(cmd => cmd.id !== id)
            })),

            importCommands: (newCommands) => set({ commands: newCommands }),
        }),
        {
            name: 'penguin-memo-commands-store',
        }
    )
);
