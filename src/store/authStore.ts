import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile { name: string; plan: string }

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('name, plan').eq('id', userId).single();
  return data ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  init: async () => {
    if (!isSupabaseConfigured) { set({ loading: false }); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user, profile: await loadProfile(session.user.id) });
    }
    set({ loading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      const profile = user ? await loadProfile(user.id) : null;
      set({ user, profile });
    });
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ error: null });
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) set({ error: error.message || JSON.stringify(error) });
  },

  signIn: async (email: string, password: string) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ error: error.message || JSON.stringify(error) });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  clearError: () => set({ error: null }),
}));
