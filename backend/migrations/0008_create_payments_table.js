/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('payments', (t) => {
    t.increments('payment_id').primary();
    // Who paid
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    // Which stored payment method was used
    t.integer('payment_info_id').unsigned().nullable()
      .references('payment_info_id').inTable('paymentinfo').onDelete('SET NULL');
    // Money + status
    t.integer('amount_cents').notNullable();            // store in cents to avoid float issues
    t.string('currency', 8).notNullable().defaultTo('CAD');

    // Timestamps
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    // Useful lookups
    t.index(['user_id']);
    t.index(['created_at']);
  });
    await knex.schema.createTable('purchases', (t) => {
    t.increments('purchase_id').primary();
    t.integer('payment_id').unsigned().notNullable()
      .references('payment_id').inTable('payments').onDelete('CASCADE')
    t.integer('amount_cents').notNullable();            // store in cents to avoid float issues
    t.integer('ticket_id').unsigned().notNullable()
      .references('ticket_id').inTable('tickets').onDelete('CASCADE');
  t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
  try { await knex.raw('DROP TYPE IF EXISTS payment_status'); } catch {}
};
