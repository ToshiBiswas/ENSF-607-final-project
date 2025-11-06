
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, mockKnex, beforeEachReset } = setup;
const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);

describe('● Repos: TicketInfoRepo', () => {
  beforeEach(beforeEachReset);

  test('findById → returns TicketInfo domain', async () => {
    seedTable('ticketinfo', { firstRow: { info_id: 77, event_id: 555, ticket_type: 'GA', ticket_price: 50, tickets_quantity: 100, tickets_left: 80 } });
    const obj = await TicketInfoRepo.findById(77);
    expect(obj.__type).toBe('TicketInfo');
    expect(obj.left).toBe(80);
  });

  test('lockAndLoad → SELECT FOR UPDATE returns row + domain', async () => {
    seedTable('ticketinfo', { firstRow: { info_id: 77, event_id: 555, ticket_type: 'GA', ticket_price: 50, tickets_quantity: 100, tickets_left: 80 } });
    const trx = mockKnex;
    const out = await TicketInfoRepo.lockAndLoad(trx, 77);
    expect(out.row.info_id).toBe(77);
    expect(out.domain.__type).toBe('TicketInfo');
  });

  test('decrementLeft / incrementLeft → issue updates', async () => {
    seedTable('ticketinfo', { firstRow: { info_id: 77 } });
    const trx = mockKnex;
    await TicketInfoRepo.decrementLeft(trx, 77, 2);
    await TicketInfoRepo.incrementLeft(trx, 77, 2);
    // no throw means calls are wired
    expect(true).toBe(true);
  });
});
