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
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // if you're using cookies/JWT in cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    // 👇 handle invalid credentials specifically
    if (res.status === 401) {
      const error = new Error("Invalid email or password");
      (error as any).status = 401; // optional: keep status if you want to inspect it later
      throw error;
    }

    // generic error for other status codes
    let message = "Login failed. Please try again.";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = await res.json();

  // whatever you already do with the token/user:
  // setUser(data.user);
  // setToken(data.token);
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
