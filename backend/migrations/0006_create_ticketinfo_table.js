/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('ticketinfo', (t) => {
    t.increments('info_id').primary();
    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');
    t.string('ticket_type', 50).notNullable();
    t.decimal('ticket_price', 10, 2).notNullable();
    t.integer('tickets_quantity').notNullable();
    t.integer('tickets_left').notNullable().defaultTo(0);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['event_id', 'ticket_type']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('ticketinfo');
};
