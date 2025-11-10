const { AppError } = require('../../utils/errors');

// Mock DB/knex with a controllable state
jest.mock('../../config/db', () => {
  const state = { rows: {}, trx: {} };
  const knex = (table) => ({
    where: () => ({ first: async () => state.rows[table] || null })
  });
  knex.transaction = async (fn) => fn(state.trx);
  knex.fn = { now: () => new Date() };
  return { knex, __setRow: (t, r) => (state.rows[t] = r) };
});

// Repos
jest.mock('../../repositories/PaymentInfoRepo', () => ({
  PaymentInfoRepo: {
    findByAccountId: jest.fn(),
    insert: jest.fn(),
    findById: jest.fn(),
  }
}));

jest.mock('../../repositories/PaymentRepo', () => ({
  PaymentRepo: {
    insert: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    listApprovedForEvent: jest.fn(),
  }
}));

const { PaymentInfoRepo } = require('../../repositories/PaymentInfoRepo');
const { PaymentRepo } = require('../../repositories/PaymentRepo');
const { PaymentService } = require('../../services/PaymentService');

describe('PaymentService.verifyAndStore', () => {
  beforeEach(() => {
    fetch.mockReset();
    PaymentInfoRepo.findByAccountId.mockReset();
    PaymentInfoRepo.insert.mockReset();
  });

  test('reuses existing card snapshot (idempotent)', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ account: { id: 'acct_1', brand: 'visa' } }) });
    const existing = { paymentInfoId: 7, accountId: 'acct_1' };
    PaymentInfoRepo.findByAccountId.mockResolvedValue(existing);

    const out = await PaymentService.verifyAndStore(42, { number:'4111111111111111', name:'A', ccv:123, exp_month:12, exp_year:2030 });
    expect(out).toBe(existing);
    expect(PaymentInfoRepo.insert).not.toHaveBeenCalled();
  });

  test('inserts new snapshot when not found', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ account: { id: 'acct_2', brand: 'mc' } }) });
    PaymentInfoRepo.findByAccountId.mockResolvedValue(null);
    PaymentInfoRepo.insert.mockResolvedValue({ paymentInfoId: 9, accountId: 'acct_2' });

    const out = await PaymentService.verifyAndStore(5, { number:'5555555555554444', name:'B', ccv:321, exp_month:1, exp_year:2031 });
    expect(PaymentInfoRepo.insert).toHaveBeenCalledWith({ userId: 5, account: { id:'acct_2', brand:'mc' } });
    expect(out.paymentInfoId).toBe(9);
  });

  test('throws when provider verification fails', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'nope' }) });
    await expect(PaymentService.verifyAndStore(1, { number:'x', name:'x', ccv:1, exp_month:1, exp_year:2030 }))
      .rejects.toBeInstanceOf(AppError);
  });
});

describe('PaymentService.chargeAndRecord', () => {
  beforeEach(() => {
    fetch.mockReset();
    PaymentRepo.insert.mockReset();
  });

  test('charges provider and records payment inside a transaction', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ payment_id: 'prov_123' }) });
    PaymentRepo.insert.mockResolvedValue({ paymentId: 101 });

    const out = await PaymentService.chargeAndRecord({
      userId: 1, eventId: 2, ticketInfoId: 3,
      paymentInfo: { paymentInfoId: 77, accountId: 'acct_9' },
      amountCents: 1234, currency:'CAD', idempotencyKey:'idem'
    });

    expect(PaymentRepo.insert).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      userId: 1, eventId: 2, ticketInfoId: 3, paymentInfoId: 77,
      amountCents: 1234, currency: 'CAD', providerPaymentId: 'prov_123', idempotencyKey: 'idem', status: 'approved'
    }));
    expect(out).toEqual({ paymentId: 101 });
  });

  test('bubbles up provider declines with AppError(402)', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'declined', code: 'card_declined' }) });
    await expect(PaymentService.chargeAndRecord({
      userId: 1, eventId: 2, ticketInfoId: 3,
      paymentInfo: { paymentInfoId: 77, accountId:'acct' },
      amountCents: 1, currency:'CAD', idempotencyKey:'x'
    })).rejects.toMatchObject({ status: 402 });
  });
});

describe('PaymentService.refund', () => {
  beforeEach(() => {
    fetch.mockReset();
    PaymentRepo.findById.mockReset();
    PaymentRepo.updateStatus.mockReset();
  });

  test('refunds through provider then marks local payment refunded', async () => {
    PaymentRepo.findById.mockResolvedValue({ providerPaymentId: 'prov_1' });
    fetch.mockResolvedValue({ ok: true, text: async () => '' });

    const ok = await PaymentService.refund(10, 500, 'i');
    expect(ok).toBe(true);
    expect(PaymentRepo.updateStatus).toHaveBeenCalledWith(expect.any(Object), 10, 'refunded', { refunded_cents: 500 });
  });

  test('throws if payment not found', async () => {
    PaymentRepo.findById.mockResolvedValue(null);
    await expect(PaymentService.refund(99, 1, 'k')).rejects.toMatchObject({ status: 404 });
  });

  test('throws when provider returns non-ok', async () => {
    PaymentRepo.findById.mockResolvedValue({ providerPaymentId: 'prov_bad' });
    fetch.mockResolvedValue({ ok: false, text: async () => 'err' });
    await expect(PaymentService.refund(1, 1, 'k')).rejects.toBeInstanceOf(AppError);
  });
});
