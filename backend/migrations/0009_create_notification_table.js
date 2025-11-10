/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('notifications', (t) => {
    t.increments('notification_id').primary();

    // Target user
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    // Optional context
    t.integer('event_id').unsigned().nullable()
      .references('event_id').inTable('events').onDelete('SET NULL');

    t.integer('payment_id').unsigned().nullable()
      .references('payment_id').inTable('payments').onDelete('SET NULL');

    // What happened
    t.enu('type', [
      'general',
      'event_created',
      'event_updated',
      'event_canceled',
      'payment_approved',
      'payment_declined',
      'refund_issued'
    ], { useNative: true, enumName: 'notification_type' })
    .notNullable()
    .defaultTo('general');

    t.string('message', 500).notNullable();

    // Delivery & state
    t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('read_at').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Helpful indexes
    t.index(['user_id']);
    t.index(['event_id']);
    t.index(['payment_id']);
    t.index(['type']);
    t.index(['created_at']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
  try { await knex.raw('DROP TYPE IF EXISTS notification_type'); } catch {}
};
