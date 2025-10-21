/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  const events = await knex('events').select('event_id','title');
  if (!events.length) return;

  const byTitle = (t) => events.find(e => e.title === t)?.event_id;

  const hackathonId = byTitle('Calgary AI Mini-Hack');
  const parkFestId  = byTitle('Riverside Music & Food Fest');
  const wellnessId  = byTitle('Sunrise Yoga & Smoothies');

  await knex('ticketinfo').del().catch(() => {});
  const rows = [];

  if (hackathonId) rows.push({
    event_id: hackathonId, ticket_type: 'general',
    ticket_price: 25.00, tickets_quantity: 120, tickets_left: 120
  });

  if (parkFestId) rows.push({
    event_id: parkFestId, ticket_type: 'vip',
    ticket_price: 99.00, tickets_quantity: 50, tickets_left: 50
  });

  if (wellnessId) rows.push({
    event_id: wellnessId, ticket_type: 'general',
    ticket_price: 15.00, tickets_quantity: 60, tickets_left: 60
  });

  if (rows.length) await knex('ticketinfo').insert(rows);
};
