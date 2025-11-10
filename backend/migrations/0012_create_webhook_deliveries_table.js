/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('webhook_deliveries', (t) => {
    t.increments('delivery_id').primary();

    t.integer('notification_id').unsigned().nullable()
      .references('notification_id').inTable('notifications').onDelete('SET NULL');

    t.string('target_url', 512).notNullable();
    t.integer('status_code').nullable();
    t.text('response_body').nullable();           // truncate in app if huge
    t.integer('attempt').notNullable().defaultTo(1);
    t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index(['notification_id']);
    t.index(['target_url']);
    t.index(['sent_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('webhook_deliveries');
};
