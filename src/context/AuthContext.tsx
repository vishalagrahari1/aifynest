/* src/context/AuthContext.tsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../utils/seedData';
import { seedUsers } from '../utils/seedData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: 'user' | 'owner') => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isAuthenticated: () => boolean;
  updateUserInterests: (userId: string, interests: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if there is an active session
    const session = localStorage.getItem('ai_user_session');
    if (session) {
      setUser(JSON.parse(session) as User);
    }
  }, []);

  const getUsersFromStorage = (): User[] => {
    const data = localStorage.getItem('ai_users');
    if (data) {
      const parsed = JSON.parse(data) as User[];
      const hasNewAdmin = parsed.some((u) => u.email === 'mevishal1130@gmail.com');
      if (hasNewAdmin) {
        return parsed;
      }
    }
    localStorage.setItem('ai_users', JSON.stringify(seedUsers));
    return seedUsers;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getUsersFromStorage();
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (matched) {
      const sessionUser: User = { id: matched.id, name: matched.name, email: matched.email, role: matched.role, interests: matched.interests || [] };
      setUser(sessionUser);
      localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, role: 'user' | 'owner'): Promise<boolean> => {
    const users = getUsersFromStorage();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      return false;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      password,
      interests: [],
    };

    const updated = [...users, newUser];
    localStorage.setItem('ai_users', JSON.stringify(updated));

    // Auto login
    const sessionUser: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, interests: [] };
    setUser(sessionUser);
    localStorage.setItem('ai_user_session', JSON.stringify(sessionUser));
    return true;
  };

  const updateUserInterests = (userId: string, interests: string[]) => {
    const users = getUsersFromStorage();
    const updated = users.map((u) => (u.id === userId ? { ...u, interests } : u));
    localStorage.setItem('ai_users', JSON.stringify(updated));
    
    if (user && user.id === userId) {
      const updatedUser = { ...user, interests };
      setUser(updatedUser);
      localStorage.setItem('ai_user_session', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ai_user_session');
  };

  const isAdmin = () => user?.role === 'admin';
  const isOwner = () => user?.role === 'owner' || user?.role === 'admin';
  const isAuthenticated = () => user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
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
