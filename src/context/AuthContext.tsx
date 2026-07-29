import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ data: any; error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Handle OAuth redirect flow (parse session from URL if present)
    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
          // Parse session from URL and store it
          const { data: { session: oauthSession }, error: oauthError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (!oauthError && oauthSession) {
            setSession(oauthSession);
            setUser(oauthSession.user ?? null);
            // Remove tokens from URL for cleanliness
            try {
              const cleanUrl = window.location.pathname + window.location.search;
              history.replaceState({}, document.title, cleanUrl);
            } catch (e) {
              // ignore
            }
          }
        }

        // Get initial session (fallback/normal flow)
        const { data: { session: initSession } } = await supabase.auth.getSession();
        setSession(initSession);
        setUser(initSession?.user ?? null);
      } catch (e) {
        // ignore init errors, we'll fall back to empty state
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase is not configured.'), data: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name },
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
