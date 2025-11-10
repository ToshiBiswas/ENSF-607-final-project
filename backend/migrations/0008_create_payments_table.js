/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('payments', (t) => {
    t.increments('payment_id').primary();

    // Who paid
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    // What was paid for (keep both optional so you can record generic payments too)
    t.integer('event_id').unsigned().nullable()
      .references('event_id').inTable('events').onDelete('SET NULL');

    // If you charge against a specific ticket option (e.g., "vip" vs "general")
    t.integer('ticket_info_id').unsigned().nullable()
      .references('info_id').inTable('ticketinfo').onDelete('SET NULL');

    // Which stored payment method was used
    t.integer('payment_info_id').unsigned().nullable()
      .references('payment_info_id').inTable('paymentinfo').onDelete('SET NULL');

    // Mock provider echo fields
    t.string('provider_payment_id', 64).nullable();     // e.g., "pay_abc123"
    t.string('idempotency_key', 128).nullable().unique();

    // Money + status
    t.integer('amount_cents').notNullable();            // store in cents to avoid float issues
    t.string('currency', 8).notNullable().defaultTo('CAD');

    t.enu('status', ['approved', 'declined', 'pending', 'refunded'], {
      useNative: true, enumName: 'payment_status'
    }).notNullable().defaultTo('pending');

    t.integer('refunded_cents').notNullable().defaultTo(0);

    // Free-form reason / failure code from mock (optional)
    t.string('failure_code', 64).nullable();
    t.string('failure_message', 255).nullable();

    // Timestamps
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Useful lookups
    t.index(['user_id']);
    t.index(['event_id']);
    t.index(['ticket_info_id']);
    t.index(['payment_info_id']);
    t.index(['status']);
    t.index(['created_at']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
  try { await knex.raw('DROP TYPE IF EXISTS payment_status'); } catch {}
};
