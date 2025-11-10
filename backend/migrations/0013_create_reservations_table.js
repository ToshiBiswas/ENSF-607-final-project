/**
 * Reservations support the hold-based flow (single tier, multi-quantity).
 * A 'held' reservation decrements stock immediately and expires after HOLD_MINUTES.
 * On cancel/expire -> stock is restored; on purchase -> stock stays reduced & tickets minted.
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('reservations', (t) => {
    t.increments('reservation_id').primary();

    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');

    t.integer('ticket_info_id').unsigned().notNullable()
      .references('info_id').inTable('ticketinfo').onDelete('RESTRICT');

    t.integer('quantity').notNullable();

    t.enu('status', ['held','purchased','canceled','expired'], { useNative: true, enumName: 'reservation_status' })
      .notNullable().defaultTo('held');

    t.dateTime('expires_at').notNullable();   // store UTC
    t.string('client_token', 64);             // optional: identify client/tab session

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index(['user_id'], 'reservations_user_idx');
    t.index(['ticket_info_id','status','expires_at'], 'reservations_sweep_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('reservations');
};
