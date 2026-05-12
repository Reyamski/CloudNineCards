import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not authed

  useEffect(() => {
    if (!supabase) { setUser(null); return; }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading: user === undefined };
}
