export type Account = {
  id: string;
  number: string;
  exp_month: number;
  exp_year: number;
  ccv: string;
  name: string;
  balance_cents: number;
  currency: string;
};

export type Payment = {
  id: string;
  account_id: string;
  amount_cents: number;
  currency: string;
  status: "APPROVED" | "DECLINED";
  created_at: string;
  refunded_cents?: number; // total refunded so far
};

export type Refund = {
  id: string;
  payment_id: string;
  amount_cents: number;
  currency: string;
  status: "APPROVED" | "DECLINED";
  created_at: string;
};
