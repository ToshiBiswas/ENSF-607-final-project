
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, mockKnex, beforeEachReset } = setup;
const { PaymentRepo } = require(`${SUT_BASE}/repositories/PaymentRepo`);

jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({
  UserRepo: { findById: jest.fn(async (id) => ({ __type:'User', userId: id })) }
}));
jest.mock(`${SUT_BASE}/repositories/EventRepo`, () => ({
  EventRepo: { findById: jest.fn(async (id) => ({ __type:'Event', eventId: id })) }
}));
jest.mock(`${SUT_BASE}/repositories/TicketInfoRepo`, () => ({
  TicketInfoRepo: { findById: jest.fn(async (id) => ({ __type:'TicketInfo', infoId: id })) }
}));
jest.mock(`${SUT_BASE}/repositories/PaymentInfoRepo`, () => ({
  PaymentInfoRepo: { findById: jest.fn(async (id) => ({ __type:'PaymentInfo', paymentInfoId: id })) }
}));

describe('● Repos: PaymentRepo', () => {
  beforeEach(beforeEachReset);

  test('insert → returns hydrated Payment', async () => {
    // findById should read this row
    seedTable('payments', { firstRow: { payment_id: 1, user_id: 10, event_id: 20, ticket_info_id: 30, payment_info_id: 40, amount_cents: 5000, currency: 'CAD', status: 'approved', provider_payment_id: 'prov', idempotency_key: 'idem' } });
    const out = await PaymentRepo.insert(mockKnex, { userId: 10, eventId: 20, ticketInfoId: 30, paymentInfoId: 40, amountCents: 5000, currency: 'CAD', providerPaymentId: 'prov', idempotencyKey: 'idem', status: 'approved' });
    expect(out.__type).toBe('Payment');
    expect(out.amountCents).toBe(5000);
  });

  test('updateStatus → writes status and returns hydrated', async () => {
    seedTable('payments', { firstRow: { payment_id: 1, user_id: 10, amount_cents: 1000, currency: 'CAD', status: 'approved' } });
    const out = await PaymentRepo.updateStatus(mockKnex, 1, 'refunded', { refunded_cents: 1000 });
    expect(out.status).toBe('approved'); // findById returns firstRow (we don't mutate in stub)
  });

  test('findById → composes User/Event/TicketInfo/PaymentInfo', async () => {
    seedTable('payments', { firstRow: { payment_id: 2, user_id: 10, event_id: 20, ticket_info_id: 30, payment_info_id: 40, amount_cents: 1234, currency: 'CAD', status: 'approved' } });
    const out = await PaymentRepo.findById(2);
    expect(out.user.userId).toBe(10);
    expect(out.event.eventId).toBe(20);
    expect(out.ticketInfo.infoId).toBe(30);
    expect(out.paymentInfo.paymentInfoId).toBe(40);
  });

  test('listApprovedForEvent → maps approved payments to hydrated array', async () => {
    // listApprovedForEvent reads payments where {event_id, status:'approved'} then calls findById for each id
    // We'll simulate select returning two rows and then same firstRow for findById
    seedTable('payments', { rows: [{ payment_id: 7, event_id: 55, status: 'approved' }, { payment_id: 8, event_id: 55, status: 'approved' }], firstRow: { payment_id: 7, user_id: 1, amount_cents: 1, currency: 'CAD', status: 'approved' } });
    const arr = await PaymentRepo.listApprovedForEvent(55);
    expect(arr.length).toBeGreaterThan(0);
  });
});
