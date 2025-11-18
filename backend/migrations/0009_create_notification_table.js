/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('notifications', (t) => {
    t.increments('notification_id').primary();

    // Target user
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    // Use event_name instead of event_id (string, optional)
    t.integer('event_id').unsigned().nullable()
      .references('event_id').inTable('events').onDelete('SET NULL');
    // Simplified payload: just a title + message
    t.string('title', 200).notNullable();
    t.string('message', 1000).notNullable();

    // Scheduling + delivery state
    t.timestamp('send_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('delivered_at').nullable();

    // Helpful indexes for common queries
    t.index(['user_id']);
    t.index(['event_id']);
    t.index(['send_at']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
};
