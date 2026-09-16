/* src/context/AuthContext.tsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../utils/seedData';
import { seedUsers } from '../utils/seedData';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isUnverified?: boolean }>;
  signup: (name: string, email: string, password: string, role: 'user' | 'owner') => Promise<{ success: boolean; error?: string }>;
  confirmEmail: (email: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isAuthenticated: () => boolean;
  updateUserInterests: (userId: string, interests: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Determine if Supabase backend is configured and ready
const useSupabase = !import.meta.env.VITE_SUPABASE_URL?.includes('placeholder-url');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile row from database
  const fetchProfileAndSet = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const isMasterAdmin = authUser.email?.toLowerCase() === 'aifynestofficial@gmail.com';
      if (profile && !error) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: isMasterAdmin ? 'admin' : profile.role,
          interests: profile.interests || [],
          emailConfirmedAt: authUser.email_confirmed_at || null,
        });
      } else {
        // Fallback default meta mapping if profile insert trigger is delayed
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.name || 'User',
          email: authUser.email || '',
          role: isMasterAdmin ? 'admin' : (authUser.user_metadata?.role || 'user'),
          interests: [],
          emailConfirmedAt: authUser.email_confirmed_at || null,
        });
      }
    } catch (err) {
      console.error('Failed to sync profile row:', err);
    }
  };

  useEffect(() => {
    if (useSupabase) {
      // 1. Initial session check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          fetchProfileAndSet(session.user).then(() => setLoading(false));
        } else {
          const localSess = localStorage.getItem('ai_user_session');
          if (localSess) {
            try {
              setUser(JSON.parse(localSess) as User);
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      });

      // 2. Auth state subscription listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          fetchProfileAndSet(session.user).then(() => setLoading(false));
        } else {
          const localSess = localStorage.getItem('ai_user_session');
          if (localSess) {
            try {
              setUser(JSON.parse(localSess) as User);
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // LocalStorage session fallback
      const session = localStorage.getItem('ai_user_session');
      if (session) {
        setUser(JSON.parse(session) as User);
      }
      setLoading(false);
    }
  }, []);

  const getUsersFromStorage = (): User[] => {
    const data = localStorage.getItem('ai_users');
    if (data) {
      return JSON.parse(data) as User[];
    }
    localStorage.setItem('ai_users', JSON.stringify(seedUsers));
    return seedUsers;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; isUnverified?: boolean }> => {
    const users = getUsersFromStorage();
    const localMatched = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && (!u.password || u.password === password));

    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          console.error('Supabase Login Error:', error.message);
          if (localMatched) {
            if (!localMatched.emailConfirmedAt) {
              return { success: false, error: 'Email not verified. Please enter the verification code sent to your email to activate your account.', isUnverified: true };
            }
            const sessionUser: User = { 
              id: localMatched.id, 
              name: localMatched.name, 
              email: localMatched.email, 
              role: localMatched.role, 
              interests: localMatched.interests || [],
              emailConfirmedAt: localMatched.emailConfirmedAt
            };
            setUser(sessionUser);
            localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
            return { success: true };
          }
          const isUnverified = error.message.toLowerCase().includes('confirm') || 
                              error.message.toLowerCase().includes('verified') || 
                              error.message.toLowerCase().includes('verification') ||
                              error.message.toLowerCase().includes('verify');
          return { success: false, error: error.message, isUnverified };
        }
        if (data.user) {
          // If unconfirmed logins is allowed in Supabase, check user email_confirmed_at status
          if (!data.user.email_confirmed_at) {
            setUser({
              id: data.user.id,
              name: data.user.user_metadata?.name || 'User',
              email: data.user.email || '',
              role: data.user.email?.toLowerCase() === 'aifynestofficial@gmail.com' ? 'admin' : (data.user.user_metadata?.role || 'user'),
              interests: [],
              emailConfirmedAt: null,
            });
            return { success: false, error: 'Email not verified.', isUnverified: true };
          }
          await fetchProfileAndSet(data.user);
          return { success: true };
        }
        return { success: false, error: 'Failed to sign in. Please try again.' };
      } catch (err: any) {
        if (localMatched) {
          if (!localMatched.emailConfirmedAt) {
            return { success: false, error: 'Email not verified. Please enter the verification code sent to your email to activate your account.', isUnverified: true };
          }
          const sessionUser: User = { 
            id: localMatched.id, 
            name: localMatched.name, 
            email: localMatched.email, 
            role: localMatched.role, 
            interests: localMatched.interests || [],
            emailConfirmedAt: localMatched.emailConfirmedAt
          };
          setUser(sessionUser);
          localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
          return { success: true };
        }
        return { success: false, error: err.message || 'An unexpected error occurred.' };
      }
    } else {
      if (localMatched) {
        if (!localMatched.emailConfirmedAt) {
          return { success: false, error: 'Email not verified. Please enter the verification code sent to your email to activate your account.', isUnverified: true };
        }
        const sessionUser: User = { 
          id: localMatched.id, 
          name: localMatched.name, 
          email: localMatched.email, 
          role: localMatched.role, 
          interests: localMatched.interests || [],
          emailConfirmedAt: localMatched.emailConfirmedAt
        };
        setUser(sessionUser);
        localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
        return { success: true };
      }
      return { success: false, error: 'Invalid email address or password credentials.' };
    }
  };

  const confirmEmail = (emailToConfirm: string) => {
    const users = getUsersFromStorage();
    const nowStr = new Date().toISOString();
    const updated = users.map((u) => {
      if (u.email.toLowerCase() === emailToConfirm.toLowerCase().trim()) {
        return { ...u, emailConfirmedAt: nowStr };
      }
      return u;
    });
    localStorage.setItem('ai_users', JSON.stringify(updated));

    const confirmedUser = updated.find((u) => u.email.toLowerCase() === emailToConfirm.toLowerCase().trim());
    if (confirmedUser) {
      const sessionUser: User = {
        id: confirmedUser.id,
        name: confirmedUser.name,
        email: confirmedUser.email,
        role: confirmedUser.role,
        interests: confirmedUser.interests || [],
        emailConfirmedAt: nowStr,
      };
      setUser(sessionUser);
      localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'user' | 'owner'): Promise<{ success: boolean; error?: string }> => {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name,
              role, // Synchronized to public profiles via PostgreSQL trigger on auth.users
            }
          }
        });
        if (error) {
          console.error('Supabase Signup Error:', error.message);
          return { success: false, error: error.message };
        }
        if (data.user) {
          if (data.user.email_confirmed_at) {
            await fetchProfileAndSet(data.user);
          } else {
            setUser(null);
          }
          return { success: true };
        }
        return { success: false, error: 'User registration failed. Please try again.' };
      } catch (err: any) {
        console.error(err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
      }
    } else {
      const users = getUsersFromStorage();
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      
      if (exists) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        password,
        interests: [],
        emailConfirmedAt: null, // Must verify email via 6-digit verification code before login!
      };

      const updated = [...users, newUser];
      localStorage.setItem('ai_users', JSON.stringify(updated));
      return { success: true };
    }
  };

  const updateUserInterests = async (userId: string, interests: string[]) => {
    if (useSupabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ interests })
          .eq('id', userId);
        
        if (error) {
          console.error('Error updating profiles interests:', error.message);
        } else if (user && user.id === userId) {
          setUser({ ...user, interests });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const users = getUsersFromStorage();
      const updated = users.map((u) => (u.id === userId ? { ...u, interests } : u));
      localStorage.setItem('ai_users', JSON.stringify(updated));
      
      if (user && user.id === userId) {
        const updatedUser = { ...user, interests };
        setUser(updatedUser);
        localStorage.setItem('ai_user_session', JSON.stringify(updatedUser));
      }
    }
  };

  const logout = async () => {
    if (useSupabase) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      setUser(null);
      localStorage.removeItem('ai_user_session');
    }
  };

  const isAdmin = () => user?.role === 'admin' && user?.email.toLowerCase() === 'aifynestofficial@gmail.com';
  const isOwner = () => user?.role === 'owner' || (user?.role === 'admin' && user?.email.toLowerCase() === 'aifynestofficial@gmail.com');
  const isAuthenticated = () => user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        confirmEmail,
        logout,
        isAdmin,
        isOwner,
        isAuthenticated,
        updateUserInterests,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
