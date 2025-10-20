// migrations/0002_ticketinfo_and_trigger.js
// NOTE: Trigger removed. Stock control will be enforced in backend code.

exports.up = async function up(knex) {
  const has = await knex.schema.hasTable('ticketinfo');
  if (!has) {
    await knex.schema.createTable('ticketinfo', (t) => {
      t.increments('info_id').primary();
      t.integer('event_id').notNullable().references('events.event_id').onDelete('CASCADE');
      t.string('ticket_type', 50).notNullable();                  // e.g., general | vip | student
      t.decimal('ticket_price', 10, 2).notNullable();
      t.integer('tickets_quantity').notNullable().unsigned();     // total
      t.integer('tickets_left').notNullable().unsigned();         // remaining
      t.unique(['event_id', 'ticket_type']);                      // one row per (event,type)
    });
  }

  // Nothing else (no trigger)
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('ticketinfo');
};
