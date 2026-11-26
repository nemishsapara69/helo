import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiRequest,
  clearSession,
  saveSession,
  UserProfile,
} from '../lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  uiLanguage: string;
  setUiLanguage: (code: string) => void;
  setSession: (accessToken: string, user: UserProfile) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uiLanguage, setUiLanguage] = useState('en');

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest<{ accessToken: string; user: UserProfile }>(
        '/api/auth/refresh',
        { method: 'POST' }
      );
      saveSession(res.accessToken, res.user);
      setUser(res.user);
      setUiLanguage(res.user.language || 'en');
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setSession = useCallback((accessToken: string, nextUser: UserProfile) => {
    saveSession(accessToken, nextUser);
    setUser(nextUser);
    if (nextUser.language) {
      setUiLanguage(nextUser.language);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        uiLanguage,
        setUiLanguage,
        setSession,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
