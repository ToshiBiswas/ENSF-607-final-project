function genTicketVersion() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  const users = await knex('users').select('user_id','name');
  const events = await knex('events').select('event_id','title');

  if (!users.length || !events.length) return;

  const findUser = (n) => users.find(u => u.name === n)?.user_id;
  const findEvent = (t) => events.find(e => e.title === t)?.event_id;

  const ava   = findUser('Ava Patel')   ?? users[0].user_id;
  const liam  = findUser('Liam Chen')   ?? users[0].user_id;
  const sofia = findUser('Sofia Garcia')?? users[0].user_id;

  const hackathonId = findEvent('Calgary AI Mini-Hack');
  const parkFestId  = findEvent('Riverside Music & Food Fest');
  const wellnessId  = findEvent('Sunrise Yoga & Smoothies');

  await knex('payments').del().catch(() => {});
  await knex('tickets').del().catch(() => {});
  await knex('notifications').del().catch(() => {});

  const now = knex.fn.now();

  const inserts = [];

  if (hackathonId) inserts.push({
    event_id: hackathonId, user_id: ava, ticket_type: 'general',
    ticket_version: genTicketVersion(), price: 25.00, purchase_date: now
  });

  if (parkFestId) inserts.push({
    event_id: parkFestId, user_id: liam, ticket_type: 'vip',
    ticket_version: genTicketVersion(), price: 99.00, purchase_date: now
  });

  if (wellnessId) inserts.push({
    event_id: wellnessId, user_id: sofia, ticket_type: 'general',
    ticket_version: genTicketVersion(), price: 15.00, purchase_date: now
  });

  const ticketIds = [];
  for (const row of inserts) {
    const [id] = await knex('tickets').insert(row);
    ticketIds.push(id);
  }

  // Payments for those tickets
  const [t1, t2, t3] = ticketIds;
  if (t1) await knex('payments').insert({ ticket_id: t1, amount: 25.00, status: 'paid',    payment_date: knex.raw('NOW() + INTERVAL 1 DAY') });
  if (t2) await knex('payments').insert({ ticket_id: t2, amount: 99.00, status: 'paid',    payment_date: knex.raw('NOW() + INTERVAL 2 DAY') });
  if (t3) await knex('payments').insert({ ticket_id: t3, amount: 15.00, status: 'pending', payment_date: knex.raw('NOW() + INTERVAL 1 DAY') });

  // Notifications
  if (hackathonId && ava) {
    await knex('notifications').insert({
      user_id: ava, event_id: hackathonId,
      message: 'You’re in! See you at Calgary AI Mini-Hack.',
      sent_at: knex.raw('NOW() + INTERVAL 1 DAY'),
    });
  }
  if (parkFestId && liam) {
    await knex('notifications').insert({
      user_id: liam, event_id: parkFestId,
      message: 'VIP access confirmed for Riverside Music Fest.',
      sent_at: knex.raw('NOW() + INTERVAL 2 DAY'),
    });
  }
  if (wellnessId && sofia) {
    await knex('notifications').insert({
      user_id: sofia, event_id: wellnessId,
      message: 'Your spot is reserved for Sunrise Yoga.',
      sent_at: knex.raw('NOW() + INTERVAL 1 DAY'),
    });
  }
};
