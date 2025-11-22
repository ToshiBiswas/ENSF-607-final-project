const { knex } = require('../config/db');         
const dayjs = require('dayjs');

//event exists and is owned by this user
async function fetchEventOwnedBy(eventId, userId) {
  const event = await knex('events').where({ event_id: eventId }).first();
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  if (String(event.organizer_id) !== String(userId)) {
    const err = new Error('You do not own this event');
    err.status = 403;
    throw err;
  }
  return event;
}

//Event must have ended 
function assertEventCompleted(event) {
  if (!event.end_time) {
    const err = new Error('Event end_time not set');
    err.status = 409;
    throw err;
  }
  const ended = dayjs(event.end_time).isBefore(dayjs());
  if (!ended) {
    const err = new Error('Event is not yet complete');
    err.status = 409;
    throw err;
  }
}

//Sum approved payments directly tied to payments.event_id 
async function sumApprovedPaymentsDirect(eventId) {
  const row = await knex('payments')
    .where({ event_id: eventId, status: 'approved' })
    .sum({ total: 'amount_cents' })
    .count({ cnt: '*' })
    .first();

  return {
    totalCents: Number(row?.total || 0),
    count: Number(row?.cnt || 0),
  };
}

//Sum approved payments through tickets 
async function sumApprovedPaymentsViaTickets(eventId) {
  const row = await knex({ t: 'tickets' })
    .join({ p: 'payments' }, 't.payment_id', 'p.payment_id')
    .where('t.event_id', eventId)
    .andWhere('p.status', 'approved')
    .sum({ total: 'p.amount_cents' })
    .count({ cnt: '*' })
    .first();

  return {
    totalCents: Number(row?.total || 0),
    count: Number(row?.cnt || 0),
  };
}

//Choose the better of the two sums to avoid double counting 
async function computeApprovedRevenueForEvent(eventId) {
  const [direct, viaTickets] = await Promise.all([
    sumApprovedPaymentsDirect(eventId),
    sumApprovedPaymentsViaTickets(eventId),
  ]);

  const best = direct.totalCents >= viaTickets.totalCents ? direct : viaTickets;
  return {
    totalCents: best.totalCents,
    paidCount: best.count,
    diagnostics: {
      viaPayments: direct,
      viaTickets,
      strategy: direct.totalCents >= viaTickets.totalCents ? 'payments.event_id' : 'tickets→payments',
    },
  };
}

//read only payout summary 
async function requestPayoutSummary({ eventId, userId }) {
  const event = await fetchEventOwnedBy(eventId, userId);
  assertEventCompleted(event);

  const totals = await computeApprovedRevenueForEvent(eventId);
  if (!totals.totalCents || totals.paidCount <= 0) {
    const err = new Error('No approved payments found for this completed event');
    err.status = 409;
    err.totals = totals;
    throw err;
  }

  return {
    ok: true,
    event: {
      event_id: event.event_id,
      organizer_id: event.organizer_id,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
    },
    payout: {
      eligible: true,
      approvedPayments: totals.paidCount,
      totalAmountCents: totals.totalCents,
      currency: 'CAD',
    },
    _debug: totals.diagnostics, //debugging
  };
}

module.exports = { requestPayoutSummary };
