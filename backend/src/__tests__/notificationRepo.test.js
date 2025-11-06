
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, beforeEachReset } = setup;
const { NotificationRepo } = require(`${SUT_BASE}/repositories/NotificationRepo`);

jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({
  UserRepo: { findById: jest.fn(async (id) => ({ __type:'User', userId: id })) }
}));
jest.mock(`${SUT_BASE}/repositories/EventRepo`, () => ({
  EventRepo: { findById: jest.fn(async (id) => ({ __type:'Event', eventId: id })) }
}));
jest.mock(`${SUT_BASE}/repositories/PaymentRepo`, () => ({
  PaymentRepo: { findById: jest.fn(async (id) => ({ __type:'Payment', paymentId: id })) }
}));

describe('● Repos: NotificationRepo', () => {
  beforeEach(beforeEachReset);

  test('insert/findById → returns Notification domain', async () => {
    seedTable('notifications', { firstRow: { notification_id: 1, user_id: 9, event_id: 8, payment_id: 7, type:'payment_approved', message:'ok' } });
    const n = await NotificationRepo.insert({ userId: 9, eventId: 8, paymentId: 7, type:'payment_approved', message:'ok' });
    expect(n.__type).toBe('Notification');
    const got = await NotificationRepo.findById(1);
    expect(got.user.userId).toBe(9);
  });
});
