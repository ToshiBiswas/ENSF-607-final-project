/** @param {import('knex').Knex} knex */
/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('tickets', (t) => {
    t.increments('ticket_id').primary();
    t.string('code', 15).notNullable().unique(); // 15-digit code

    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');

    t.integer('info_id').unsigned().notNullable()
      .references('info_id').inTable('ticketinfo').onDelete('CASCADE');

    // Keep purchase_id for convenience, but **no FK** here to avoid circular dependency
    t.integer('purchase_id').unsigned().nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['user_id']);
    t.index(['event_id']);
    t.index(['purchase_id']);
    t.index(['code']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tickets');
};


exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tickets');
};
