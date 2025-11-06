
const setup = require('./test-setup');
const { SUT_BASE, expectAppError, beforeEachReset } = setup;

const { PaymentService } = require(`${SUT_BASE}/services/PaymentService`);

describe('● Payments (Square mock): verify, charge, refund', () => {
  beforeEach(beforeEachReset);

  test('verifyAndStore → ok → stores account snapshot or dedupes', async () => {
    const pinfo1 = await PaymentService.verifyAndStore(1, { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 });
    const { PaymentInfoRepo } = require(`${SUT_BASE}/repositories/PaymentInfoRepo`);
    PaymentInfoRepo.findByAccountId = jest.fn(async () => pinfo1);
    const pinfo2 = await PaymentService.verifyAndStore(1, { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 });
    expect(pinfo2).toBe(pinfo1);
  });

  test('verifyAndStore → provider 402 → AppError', async () => {
    await expectAppError(PaymentService.verifyAndStore(1, { number: '4000000000000002', name: 'X', ccv: 111, exp_month: 1, exp_year: 2030 }), 402, /Card verification failed/);
  });

  test('chargeAndRecord → approved → creates local Payment', async () => {
    const out = await PaymentService.chargeAndRecord({
      userId: 1, eventId: 555, ticketInfoId: 77, paymentInfo: { paymentInfoId: 33, accountId: 'acct_ok_1' },
      amountCents: 5000, currency: 'CAD', idempotencyKey: 'k1'
    });
    expect(out).toEqual(expect.objectContaining({ status: 'approved', amountCents: 5000 }));
  });

  test('chargeAndRecord → provider decline → AppError', async () => {
    await expectAppError(PaymentService.chargeAndRecord({
      userId: 1, eventId: 555, ticketInfoId: 77, paymentInfo: { paymentInfoId: 33, accountId: 'acct_ok_1' },
      amountCents: 0, currency: 'CAD', idempotencyKey: 'k2'
    }), 402, /Payment declined/);
  });

  test('refund → happy path', async () => {
    const ok = await PaymentService.refund(9001, 5000, 'idemp-1');
    expect(ok).toBe(true);
  });

  test('refund → not found → 404', async () => {
    await expectAppError(PaymentService.refund(9999, 5000, 'idemp-2'), 404, /Payment not found/);
  });
});
