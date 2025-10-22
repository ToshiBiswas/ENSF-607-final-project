/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('ticketinfo').del();

  const metaRows = await knex('_seed_meta').select('key','value');
  const meta = Object.fromEntries(metaRows.map(r => [r.key, r.value]));
  const hackathonId = Number(meta['event.hackathonId']);
  const parkFestId  = Number(meta['event.parkFestId']);
  const wellnessId  = Number(meta['event.wellnessId']);

  await knex('ticketinfo').insert([
    { event_id: hackathonId, ticket_type: 'general', ticket_price: 25.00, tickets_quantity: 120, tickets_left: 120 },
    { event_id: hackathonId, ticket_type: 'vip',     ticket_price: 59.00, tickets_quantity: 30,  tickets_left: 30  },
    { event_id: parkFestId,  ticket_type: 'vip',     ticket_price: 99.00, tickets_quantity: 80,  tickets_left: 80  },
    { event_id: parkFestId,  ticket_type: 'general', ticket_price: 15.00, tickets_quantity: 400, tickets_left: 400 },
    { event_id: wellnessId,  ticket_type: 'general', ticket_price: 10.00, tickets_quantity: 60,  tickets_left: 60  }
  ]);
};
