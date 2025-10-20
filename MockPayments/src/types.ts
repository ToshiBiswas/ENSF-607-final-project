export type Currency = 'USD' | 'CAD' | 'EUR';

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  balance: number; // minor units (e.g., cents)
}

export interface Payment {
  id: string;
  type: 'payment';
  accountId: string;
  amount: number; // minor units
  currency: Currency;
  description?: string;
  createdAt: string;
  status: 'succeeded' | 'failed';
  idempotencyKey?: string;
}

export interface Refund {
  id: string;
  type: 'refund';
  accountId: string;
  paymentId: string;
  amount: number; // minor units
  currency: Currency;
  reason?: string;
  createdAt: string;
  status: 'succeeded' | 'failed';
  idempotencyKey?: string;
}

export interface IdempotencyRecord {
  key: string;
  response: any;
  createdAt: string;
}
