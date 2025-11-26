// src/context/AuthContext.tsx
/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { authApi, type User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null; // access token only
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // access token
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to load the current user.
        // apiClient inside usersApi will:
        //  - send Authorization header if token exists
        //  - on 401, call /auth/refresh (cookie-based) and retry
        const { usersApi } = await import('../api/users');
        const userData = await usersApi.getMe();
        setUser(userData);

        // apiClient.refresh will have stored the new access token in localStorage
        const storedAccessToken = localStorage.getItem('token');
        setToken(storedAccessToken);
      } catch (err) {
        console.error('Failed to load user:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    // Uses the same apiClient underneath
    const res = await authApi.login({ email, password });

    // res: { accessToken, user }
    setUser(res.user);
    setToken(res.accessToken);

    // so apiClient can pick it up
    localStorage.setItem("token", res.accessToken);
  } finally {
    setLoading(false);
  }
};


  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });

    setToken(response.accessToken);
    setUser(response.user);

    localStorage.setItem('token', response.accessToken);
    // refresh token is in HttpOnly cookie — NOT stored here
  };

  const logout = () => {
    // Best-effort logout on backend to clear cookie + revoke refresh token
    authApi.logout().catch((err) => {
      console.error('Logout failed:', err);
    });

    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
