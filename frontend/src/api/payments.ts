/**
 * Payments API
 */
import { apiClient } from './client';

export interface Transaction {
  paymentId: number;
  userId: number;
  eventId: number | null;
  ticketInfoId: number | null;
  paymentInfoId: number | null;
  amountCents: number;
  currency: string;
  status: string;
  refundedCents: number;
  providerPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  eventTitle: string | null;
  eventVenue: string | null;
  cardLast4: string | null;
  cardName: string | null;
}

export interface TransactionsResponse {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  data: Transaction[];
}

export interface TransactionHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface VerifyCardRequest {
  number: string;
  name: string;
  ccv: string;
  exp_month: number;
  exp_year: number;
}

export interface VerifyCardResponse {
  paymentMethod: {
    paymentInfoId: number;
    accountId: string;
    name: string;
    last4: string;
    expMonth: number;
    expYear: number;
    currency: string;
  };
}

export const paymentsApi = {
  /**
   * Get transaction history with pagination
   */
  getTransactionHistory: async (params: TransactionHistoryParams = {}): Promise<TransactionsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.status) queryParams.append('status', params.status);

    const endpoint = `/payments/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get<TransactionsResponse>(endpoint);
  },

  /**
   * Verify and save a payment card
   */
  verifyCard: async (data: VerifyCardRequest): Promise<VerifyCardResponse['paymentMethod']> => {
    const response = await apiClient.post<VerifyCardResponse>('/payments/verify-card', data);
    return response.paymentMethod;
  },
};

