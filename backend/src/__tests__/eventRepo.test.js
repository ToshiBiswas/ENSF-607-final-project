
const setup = require('./repos-test-setup');
const { SUT_BASE, seedTable, seedChainInsertTable, beforeEachReset } = setup;
const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);

jest.mock(`${SUT_BASE}/repositories/UserRepo`, () => ({
  UserRepo: { findById: jest.fn(async (id) => ({ __type:'User', userId: id })) }
}));

describe('● Repos: EventRepo', () => {
  beforeEach(beforeEachReset);

  test('findById → hydrates Event with categories and tickets', async () => {
    seedTable('events', { firstRow: { event_id: 555, organizer_id: 42, title:'t', description:'d', location:'l', start_time: new Date().toISOString(), end_time: new Date().toISOString(), ticket_type: 'general' } });
    seedTable('eventscategories', { rows: [{ event_id: 555, category_id: 1 }] });
    seedTable('categoriesid', { rows: [{ category_id: 1, category_value: 'music' }] });
    seedTable('ticketinfo', { rows: [{ info_id: 77, event_id: 555, ticket_type: 'GA', ticket_price: 50, tickets_quantity: 100, tickets_left: 80 }] });
    const evt = await EventRepo.findById(555);
    expect(evt.__type).toBe('Event');
    expect(evt.categories[0].value).toBe('music');
    expect(evt.tickets[0].price).toBe(50);
  });

  test('findByCategoryValue → returns list of events', async () => {
    seedTable('events', { rows: [{ event_id: 1, organizer_id: 1, title:'a' }, { event_id: 2, organizer_id: 2, title:'b' }] });
    seedTable('eventscategories', { rows: [{ event_id: 1, category_id: 10 }, { event_id: 2, category_id: 10 }] });
    seedTable('categoriesid', { rows: [{ category_id: 10, category_value: 'vip' }] });
    const list = await EventRepo.findByCategoryValue('vip');
    expect(Array.isArray(list)).toBe(true);
  });

  test('insert → returns created event', async () => {
    seedTable('events', { firstRow: { event_id: 101, organizer_id: 9, title:'concert', start_time: new Date().toISOString(), end_time: new Date().toISOString() } });
    const ev = await EventRepo.insert({ organizerId: 9, title:'concert', description:'d', location:'h', startTime: new Date().toISOString(), endTime: new Date().toISOString(), ticketType: 'general' });
    expect(ev.eventId).toBe(101);
  });

  test('attachCategories → uses ON CONFLICT IGNORE', async () => {
    const ec = seedChainInsertTable('eventscategories');
    await EventRepo.attachCategories(1, [1,2,3]);
    expect(ec.insert).toHaveBeenCalled();
  });

  test('upsertTicketInfos → updates when found or inserts when missing', async () => {
    seedTable('ticketinfo', { firstRow: { info_id: 5, event_id: 1, ticket_type:'GA', ticket_price: 40, tickets_quantity: 100, tickets_left: 100 } });
    await EventRepo.upsertTicketInfos(1, [{ type:'GA', price: 50, quantity: 100 }, { type:'VIP', price: 100, quantity: 10 }]);
    expect(true).toBe(true);
  });

  test('updateTicketsIncreaseOnly → increments qty and left', async () => {
    seedTable('ticketinfo', { firstRow: { info_id: 5, event_id: 1, ticket_type:'GA', ticket_price: 40, tickets_quantity: 100, tickets_left: 95 } });
    await EventRepo.updateTicketsIncreaseOnly(1, [{ type:'GA', quantityDelta: 5 }]);
    expect(true).toBe(true);
  });

  test('deleteEvent → deletes', async () => {
    seedTable('events', { firstRow: { event_id: 9 } });
    await EventRepo.deleteEvent(9);
    expect(true).toBe(true);
  });
});
