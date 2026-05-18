import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as storage from '../utils/storage';

interface AIState {
  chatHistory: any[];
  addMessage: (message: any) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      chatHistory: [],
      addMessage: (message) => set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      clearHistory: () => set({ chatHistory: [] }),
    }),
    {
      name: 'ai-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
