import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as storage from '../utils/storage';

interface FoodState {
  dailyLogs: any[];
  waterIntake: number;
  setDailyLogs: (logs: any[]) => void;
  addFoodLog: (log: any) => void;
  setWaterIntake: (amount: number) => void;
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set) => ({
      dailyLogs: [],
      waterIntake: 0,
      setDailyLogs: (logs) => set({ dailyLogs: logs }),
      addFoodLog: (log) => set((state) => ({ dailyLogs: [...state.dailyLogs, log] })),
      setWaterIntake: (amount) => set({ waterIntake: amount }),
    }),
    {
      name: 'food-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
