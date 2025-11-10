/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('refunds', (t) => {
    t.increments('refund_id').primary();

    t.integer('payment_id').unsigned().notNullable()
      .references('payment_id').inTable('payments').onDelete('CASCADE');

    t.integer('amount_cents').notNullable();
    t.string('currency', 8).notNullable().defaultTo('CAD');

    // match your external mock API usage
    t.string('idempotency_key', 128).notNullable().unique();
    t.string('provider_refund_id', 64).nullable().unique();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['payment_id']);
    t.index(['created_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('refunds');
};
