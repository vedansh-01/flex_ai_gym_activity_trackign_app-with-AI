import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as storage from '../utils/storage';

interface WorkoutState {
  activeWorkout: any | null;
  workoutHistory: any[];
  startWorkout: (workout: any) => void;
  endWorkout: () => void;
  setWorkoutHistory: (history: any[]) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      activeWorkout: null,
      workoutHistory: [],
      startWorkout: (workout) => set({ activeWorkout: workout }),
      endWorkout: () => set({ activeWorkout: null }),
      setWorkoutHistory: (history) => set({ workoutHistory: history }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
