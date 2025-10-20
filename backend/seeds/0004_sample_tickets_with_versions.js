// seeds/000X_sample_tickets_with_versions.js
// Generates sample tickets that include the new 6-char ticket_version.
// Runs safely only if there are users and events present (and retries on rare version collisions).

/** Simple 6-char uppercase alphanumeric generator */
function genTicketVersion() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Insert a single ticket; retry infinitely on ER_DUP_ENTRY for ticket_version */
async function insertTicketWithUniqueVersion(knex, baseRow) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const row = { ...baseRow, ticket_version: genTicketVersion() };
      await knex('tickets').insert(row);
      return;
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        // generate another code and try again
        continue;
      }
      throw err; // any other DB error bubbles up
    }
  }
}

/** Resolve ticketinfo for a given event/type if it exists */
async function resolveTicketInfo(knex, event_id, ticket_type) {
  return knex('ticketinfo')
    .select('info_id', 'ticket_price')
    .where({ event_id, ticket_type })
    .first();
}

/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  // Guard: only seed if we have some users and events.
  const [{ cnt: userCnt }]  = await knex('users').count({ cnt: '*' });
  const [{ cnt: eventCnt }] = await knex('events').count({ cnt: '*' });
  if (!Number(userCnt) || !Number(eventCnt)) return;

  // Mild cleanup of tickets/payments to avoid FK conflicts during seeding
  await knex('payments').del();
  await knex('tickets').del();

  const [firstUser]  = await knex('users').select('user_id').orderBy('user_id').limit(1);
  const [firstEvent] = await knex('events').select('event_id', 'title').orderBy('event_id').limit(1);
  const now = knex.fn.now();

  // Try to use configured ticketinfo rows where possible
  const generalInfo = await resolveTicketInfo(knex, firstEvent.event_id, 'general');
  const vipInfo     = await resolveTicketInfo(knex, firstEvent.event_id, 'vip');

  // Ticket #1 — prefers 'general' if present; otherwise falls back to 'vip' (or plain)
  if (generalInfo) {
    await insertTicketWithUniqueVersion(knex, {
      event_id: firstEvent.event_id,
      user_id: firstUser.user_id,
      ticket_type: 'general',
      price: generalInfo.ticket_price,
      purchase_date: now,
      ticket_info_id: generalInfo.info_id
    });
  } else if (vipInfo) {
    await insertTicketWithUniqueVersion(knex, {
      event_id: firstEvent.event_id,
      user_id: firstUser.user_id,
      ticket_type: 'vip',
      price: vipInfo.ticket_price,
      purchase_date: now,
      ticket_info_id: vipInfo.info_id
    });
  } else {
    // No ticketinfo configured; seed a standalone example (no stock decrement)
    await insertTicketWithUniqueVersion(knex, {
      event_id: firstEvent.event_id,
      user_id: firstUser.user_id,
      ticket_type: 'general',
      price: 25.00,
      purchase_date: now,
      ticket_info_id: null
    });
  }

  // Ticket #2 — VIP if available; otherwise another generic example
  if (vipInfo) {
    await insertTicketWithUniqueVersion(knex, {
      event_id: firstEvent.event_id,
      user_id: firstUser.user_id,
      ticket_type: 'vip',
      price: vipInfo.ticket_price,
      purchase_date: now,
      ticket_info_id: vipInfo.info_id
    });
  } else {
    await insertTicketWithUniqueVersion(knex, {
      event_id: firstEvent.event_id,
      user_id: firstUser.user_id,
      ticket_type: 'vip',
      price: 59.00,
      purchase_date: now,
      ticket_info_id: null
    });
  }
};
