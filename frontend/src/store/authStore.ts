import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as storage from '../utils/storage';
import { supabase } from '../config/supabase';

interface AuthState {
  session: any | null;
  user: any | null;
  profile: any | null;
  setSession: (session: any) => void;
  setProfile: (profile: any) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      setSession: (session) => set({ session, user: session?.user || null }),
      setProfile: (profile) => set({ profile }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
