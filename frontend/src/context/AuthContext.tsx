import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types';

interface AuthCtx {
  user: User | null;
  login: (tokens: { access: string; refresh: string; user: User }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      // Clear corrupted localStorage data
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  });

  const login = useCallback(
    ({ access, refresh, user: u }: { access: string; refresh: string; user: User }) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? '';
    return {
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: role === 'ADMIN',
      isDoctor: role === 'DOCTOR',
      isNurse: role === 'NURSE',
    };
  }, [user, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
