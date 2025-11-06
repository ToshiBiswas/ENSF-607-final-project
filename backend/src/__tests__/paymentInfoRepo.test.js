
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, beforeEachReset } = setup;
const { PaymentInfoRepo } = require(`${SUT_BASE}/repositories/PaymentInfoRepo`);

jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({
  UserRepo: { findById: jest.fn(async (id) => ({ __type:'User', userId: id })) }
}));

describe('● Repos: PaymentInfoRepo', () => {
  beforeEach(beforeEachReset);

  test('insert/findById → returns PaymentInfo domain', async () => {
    seedTable('paymentinfo', { firstRow: { payment_info_id: 33, user_id: 1, account_id: 'acct', name:'T', last4:'1111', exp_month: 12, exp_year: 2030, currency: 'CAD', primary_account: 0 } });
    const pi = await PaymentInfoRepo.insert({ userId: 1, account: { id:'acct', name:'T', last4:'1111', exp_month: 12, exp_year: 2030 } });
    expect(pi.__type).toBe('PaymentInfo');
    const got = await PaymentInfoRepo.findById(33);
    expect(got.paymentInfoId).toBe(33);
  });

  test('listForUser → returns array', async () => {
    seedTable('paymentinfo', { rows: [{ payment_info_id: 1, user_id: 9, account_id: 'a', name: 'n', last4:'0000', exp_month: 1, exp_year: 2000, currency: 'CAD', primary_account: 0 }] });
    const list = await PaymentInfoRepo.listForUser(9);
    expect(Array.isArray(list)).toBe(true);
  });

  test('findByAccountId → returns domain when found', async () => {
    seedTable('paymentinfo', { firstRow: { payment_info_id: 22, user_id: 9, account_id: 'found' } });
    const out = await PaymentInfoRepo.findByAccountId('found');
    expect(out.paymentInfoId).toBe(22);
  });
});
