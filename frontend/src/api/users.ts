/**
 * Users API
 */
import { apiClient } from './client';
import { type User } from './auth';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface SetPreferencesRequest {
  location?: string;
  preferredCategory?: string;
}

export interface UserResponse {
  user: User;
}

export interface PreferencesResponse {
  preferences: {
    preferenceId: number;
    location?: string;
    preferredCategory?: string;
  };
}

export interface PaymentMethodsResponse {
  paymentMethods: Array<{
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

export interface Ticket {
  ticketId: number;
  code: string;
  event?: {
    eventId: number;
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  ticketInfo?: {
    infoId: number;
    type: string;
    price: number;
  };
  payment?: {
    paymentId: number;
  };
}

export interface Payment {
  paymentId: number;
  amountCents: number;
  currency: string;
  status: 'approved' | 'declined' | 'pending' | 'refunded';
  refundedCents: number;
  event?: {
    eventId: number;
    title: string;
  };
  ticketInfo?: {
    infoId: number;
    type: string;
    price: number;
  };
  paymentInfo?: {
    paymentInfoId: number;
    last4: string;
  };
  createdAt?: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
}

export interface PaymentsResponse {
  payments: Payment[];
}

export const usersApi = {
  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<UserResponse>('/me');
    return response.user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<UserResponse>('/me', data);
    return response.user;
  },

  /**
   * Set user preferences
   */
  setPreferences: async (data: SetPreferencesRequest): Promise<PreferencesResponse['preferences']> => {
    const response = await apiClient.put<PreferencesResponse>('/me/preferences', data);
    return response.preferences;
  },

  /**
   * Get user payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethodsResponse['paymentMethods']> => {
    const response = await apiClient.get<PaymentMethodsResponse>('/me/payment-methods');
    return response.paymentMethods;
  },

  /**
   * Get user tickets
   */
  getTickets: async (): Promise<Ticket[]> => {
    const response = await apiClient.get<TicketsResponse>('/me/tickets');
    return response.tickets;
  },

  /**
   * Get user payment history
   */
  getPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<PaymentsResponse>('/payments');
    return response.payments;
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (paymentInfoId: number): Promise<void> => {
    await apiClient.delete(`/me/payment-methods/${paymentInfoId}`);
  },

  /**
   * Refund a ticket
   */
  refundTicket: async (ticketId: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post('/payments/refund', { ticketId });
  },
};

