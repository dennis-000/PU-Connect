import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, studentId: string, department: string, faculty: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, userObject?: User | null): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error:', error.message);

        // Get user object if not provided
        let currentUser = userObject;
        if (!currentUser) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUser = user;
        }

        if (error.code === 'PGRST116' && currentUser) {
          const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            student_id: currentUser.user_metadata?.student_id || '',
            department: currentUser.user_metadata?.department || '',
            faculty: currentUser.user_metadata?.faculty || '',
            phone: currentUser.user_metadata?.phone || '',
            role: 'buyer',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).select().single();

          if (!insertError && newProfile) {
            return newProfile as Profile;
          }
        }

        if (currentUser) {
          return {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || 'User',
            student_id: currentUser.user_metadata?.student_id || '',
            department: currentUser.user_metadata?.department || '',
            faculty: currentUser.user_metadata?.faculty || '',
            role: 'buyer',
            is_active: true,
            last_seen: new Date().toISOString(),
            is_online: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
        }

        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Failed to fetch profile:', err);

      let currentUser = userObject;
      if (!currentUser) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
      }

      if (currentUser) {
        return {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || 'User',
          student_id: currentUser.user_metadata?.student_id || '',
          department: currentUser.user_metadata?.department || '',
          faculty: currentUser.user_metadata?.faculty || '',
          role: 'buyer',
          is_active: true,
          last_seen: new Date().toISOString(),
          is_online: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;
      }

      return null;
    }
  }, []);

  const updateOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Failed to update online status:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      setError(null);
      try {
        const profileData = await fetchProfile(user.id, user);
        setProfile(profileData);
      } catch (err) {
        console.error('Error refreshing profile:', err);
        setError('Failed to refresh profile');
      }
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id, session.user);
          if (mounted) {
            setProfile(profileData);
            updateOnlineStatus(session.user.id, true);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        // Pass session.user to fetchProfile to avoid extra network call
        const profileData = await fetchProfile(session.user.id, session.user);
        if (mounted) {
          setProfile(profileData);
          updateOnlineStatus(session.user.id, true);
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    // Update online status every 10 minutes (reduced from 5)
    const interval = setInterval(() => {
      if (user && mounted) {
        updateOnlineStatus(user.id, true);
      }
    }, 600000);

    const handleBeforeUnload = () => {
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile, updateOnlineStatus]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    studentId: string,
    department: string,
    faculty: string,
    phone: string
  ) => {
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          studentId,
          department,
          faculty,
          phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Send Welcome SMS (Non-blocking)
      import('../lib/arkesel').then(({ sendSMS }) => {
        sendSMS([phone], `Welcome to PU Connect, ${fullName}! Your account has been successfully created. Browse the marketplace and connect with fellow students.`)
          .catch(err => console.error('Failed to send welcome SMS:', err));
      });

      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
