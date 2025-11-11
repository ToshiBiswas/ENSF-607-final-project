/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('tickets', (t) => {
    t.increments('ticket_id').primary();
    t.string('code', 15).notNullable().unique(); // 6-digit, unique

    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');

    t.integer('info_id').unsigned().notNullable()
      .references('info_id').inTable('ticketinfo').onDelete('CASCADE');

    t.integer('payment_id').unsigned().notNullable()
      .references('payment_id').inTable('payments').onDelete('CASCADE');

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['user_id']);
    t.index(['event_id']);
    t.index(['payment_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tickets');
};
