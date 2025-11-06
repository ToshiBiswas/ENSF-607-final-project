
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, mockKnex, beforeEachReset } = setup;
const { TicketMintRepo } = require(`${SUT_BASE}/repositories/TicketMintRepo`);

describe('● Repos: TicketMintRepo', () => {
  beforeEach(beforeEachReset);

  test('save/listByPayment → in-memory mode when no table', async () => {
    mockKnex.schema.hasTable.mockResolvedValue(false);
    const t1 = await TicketMintRepo.save({ code: 'ABC', ownerId: 1, eventId: 555, infoId: 77, paymentId: 9001 });
    expect(t1.__type).toBe('Ticket');
    const list = await TicketMintRepo.listByPayment(9001);
    expect(list.length).toBe(1);
  });

  test('save/listByPayment → DB mode when tickets table exists', async () => {
    mockKnex.schema.hasTable.mockResolvedValue(true);
    seedTable('tickets', { rows: [{ ticket_id: 1, code: 'X', user_id: 1, event_id: 555, info_id: 77, payment_id: 9001 }] });
    const t = await TicketMintRepo.save({ code: 'XYZ', ownerId: 1, eventId: 555, infoId: 77, paymentId: 9001 });
    expect(t.__type).toBe('Ticket');
    const list = await TicketMintRepo.listByPayment(9001);
    expect(Array.isArray(list)).toBe(true);
  });
});
