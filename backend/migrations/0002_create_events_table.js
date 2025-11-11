/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('events', (t) => {
    t.increments('event_id').primary();
    t.integer('organizer_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    t.string('title', 200).notNullable().unique();
    t.text('description').notNullable();
    t.string('location', 255).notNullable();
    t.dateTime('start_time').notNullable();
    t.dateTime('end_time').notNullable();
    // keep this column as requested
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('events');
};
