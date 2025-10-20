import { v4 as uuid } from 'uuid';
import { DB } from '../db.js';
import { Account, Payment, Refund } from '../types.js';

function assertCurrency(account: Account, currency: string) {
  if (account.currency !== currency) {
    throw new Error(`Currency mismatch: account=${account.currency}, request=${currency}`);
  }
}

function luhnCheck(num: string) {
  const digits = num.replace(/\D/g, '').split('').map(d => parseInt(d, 10));
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (alt) {
      d = d * 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function validateCardAgainstAccount(account: Account, card: any, firstName: string, lastName: string) {
  // simple checks: number (Luhn), expiry, ccv exact match, name exact match (case-insensitive)
  if (!card || typeof card.number !== 'string') throw new Error('Card data missing or invalid');
  const number = card.number.replace(/\s+/g, '');
  if (!luhnCheck(number)) throw new Error('Card number failed Luhn check');
  // expiry
  const expMonth = Number(card.expMonth);
  const expYear = Number(card.expYear);
  const now = new Date();
  const cardExpiry = new Date(expYear, expMonth - 1, 1);
  // set to end of month by adding 1 month then subtract 1 day
  const endOfMonth = new Date(cardExpiry.getFullYear(), cardExpiry.getMonth() + 1, 0);
  if (endOfMonth < now) throw new Error('Card expired');
  // ccv check - for mock, require exact match with stored card.ccv
  if (!card.ccv || String(card.ccv) !== String(account.card?.ccv)) throw new Error('CCV mismatch');
  // name check
  if (!firstName || !lastName) throw new Error('Cardholder name missing');
  if ((firstName.trim().toLowerCase() !== (account.firstName||'').toLowerCase()) ||
      (lastName.trim().toLowerCase() !== (account.lastName||'').toLowerCase())) {
    throw new Error('Cardholder name does not match account');
  }
  // card number match
  const acctCardNum = String(account.card?.number || '').replace(/\s+/g, '');
  if (acctCardNum !== number) throw new Error('Card number does not match account');
  return true;
}

export function processPayment(accountId: string, amount: number, currency: string, description?: string, idempotencyKey?: string, card?: any, firstName?: string, lastName?: string) {
  const account = DB.findAccount(accountId);
  if (!account) throw new Error('Account not found');
  assertCurrency(account, currency);

  // idempotency check
  if (idempotencyKey) {
    const rec = DB.getIdempotency(idempotencyKey);
    if (rec) return rec.response; // return the exact previous response
  }

  // validate card vs account
  validateCardAgainstAccount(account, card, firstName || '', lastName || '');

  if (amount <= 0) throw new Error('Amount must be positive');
  if (amount > account.balance) throw new Error('Insufficient funds');

  account.balance -= amount;
  DB.upsertAccount(account);

  const payment: Payment = {
    id: `pay_${uuid()}`,
    type: 'payment',
    accountId,
    amount,
    currency: account.currency,
    description,
    createdAt: new Date().toISOString(),
    status: 'succeeded',
    idempotencyKey
  };

  DB.appendLedger(payment);

  if (idempotencyKey) {
    DB.saveIdempotency({ key: idempotencyKey, response: payment, createdAt: new Date().toISOString() });
  }

  return payment;
}

export function processRefund(paymentId: string, amount: number | undefined, reason?: string, idempotencyKey?: string) {
  if (idempotencyKey) {
    const rec = DB.getIdempotency(idempotencyKey);
    if (rec) return rec.response;
  }

  const ledger = DB.loadLedger();
  const p = ledger.find(e => e.type === 'payment' && e.id === paymentId) as Payment | undefined;
  if (!p) throw new Error('Original payment not found');

  const account = DB.findAccount(p.accountId);
  if (!account) throw new Error('Account not found');

  const maxRefundable = p.amount - ledger
    .filter(e => e.type === 'refund' && (e as any).paymentId === paymentId)
    .reduce((sum, r) => sum + (r as any).amount, 0);

  const refundAmount = amount ?? maxRefundable;
  if (refundAmount <= 0) throw new Error('Nothing left to refund');
  if (refundAmount > maxRefundable) throw new Error('Refund exceeds remaining refundable amount');

  account.balance += refundAmount;
  DB.upsertAccount(account);

  const refund: Refund = {
    id: `ref_${uuid()}`,
    type: 'refund',
    accountId: account.id,
    paymentId,
    amount: refundAmount,
    currency: account.currency,
    reason,
    createdAt: new Date().toISOString(),
    status: 'succeeded',
    idempotencyKey
  };

  DB.appendLedger(refund);

  if (idempotencyKey) {
    DB.saveIdempotency({ key: idempotencyKey, response: refund, createdAt: new Date().toISOString() });
  }

  return refund;
}
