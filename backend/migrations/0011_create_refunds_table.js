/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('refunds', (t) => {
    t.increments('refund_id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    t.integer('payment_id').unsigned().notNullable()
      .references('payment_id').inTable('payments').onDelete('CASCADE');
    t.integer('amount_cents').notNullable();
    t.string('currency', 8).notNullable().defaultTo('CAD');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['payment_id']);
    t.index(['created_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('refunds');
};
