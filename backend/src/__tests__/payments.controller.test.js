
const setup = require('./controllers-test-setup');
const { SUT_BASE, PaymentService, makeReq, makeRes, beforeEachReset } = setup;
const { PaymentsController } = require(`${SUT_BASE}/controllers/PaymentsController`);

describe('● Controllers: PaymentsController', () => {
  beforeEach(beforeEachReset);

  test('verifyCard → status 201 and returns paymentMethod', async () => {
    PaymentService.verifyAndStore.mockResolvedValueOnce({ paymentInfoId: 33 });
    const req = makeReq({ userId: 9, body: { number: '4111111111111111', name: 'T', ccv: 123, exp_month: 12, exp_year: 2030 } });
    const res = makeRes();
    await PaymentsController.verifyCard(req, res, jest.fn());
    expect(PaymentService.verifyAndStore).toHaveBeenCalledWith(9, expect.objectContaining({ number: '4111111111111111' }));
    expect(res.statusCode).toBe(201);
    expect(res.body.paymentMethod.paymentInfoId).toBe(33);
  });

  test('refund → passes numeric ids and returns ok', async () => {
    PaymentService.refund.mockResolvedValueOnce(true);
    const req = makeReq({ body: { payment_id: '9001', amount_cents: '5000' } });
    const res = makeRes();
    await PaymentsController.refund(req, res, jest.fn());
    expect(PaymentService.refund).toHaveBeenCalledWith(9001, 5000, expect.stringMatching(/^refund-9001-/));
    expect(res.body.refunded).toBe(true);
  });
});
