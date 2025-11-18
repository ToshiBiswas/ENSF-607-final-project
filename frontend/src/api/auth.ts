/**
 * Authentication API
 */
import { apiClient } from './client';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'organizer';
  preferences?: {
    preferenceId: number;
    location?: string;
    preferredCategory?: string;
  };
  paymentMethods?: Array<{
    paymentInfoId: number;
    accountId: string;
    name: string;
    last4: string;
    expMonth: number;
    expYear: number;
    currency: string;
    primary: boolean;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },
};

