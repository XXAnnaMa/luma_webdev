import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiRequest } from '../lib/api';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest extends LoginRequest {
  full_name: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const me = await apiRequest<AuthUser>('/api/v1/auth/me');
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        return;
      }
      throw error;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch (error) {
        console.error('Failed to load current user:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    await apiRequest<AuthUser>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password } satisfies LoginRequest,
    });

    await refreshMe();
  };

  const signup = async (email: string, fullName: string, password: string) => {
    await apiRequest<AuthUser>('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        email,
        full_name: fullName,
        password,
      } satisfies SignupRequest,
    });

    await login(email, password);
  };

  const logout = async () => {
    try {
      await apiRequest<Record<string, string>>('/api/v1/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
