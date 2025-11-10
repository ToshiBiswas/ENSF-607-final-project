/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('carts', (t) => {
    t.increments('cart_id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE')
      .unique(); // one active cart per user; remove unique if you want many
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('cart_items', (t) => {
    t.increments('cart_item_id').primary();
    t.integer('cart_id').unsigned().notNullable()
      .references('cart_id').inTable('carts').onDelete('CASCADE');

    t.integer('info_id').unsigned().notNullable()
      .references('info_id').inTable('ticketinfo').onDelete('CASCADE');

    t.integer('quantity').unsigned().notNullable();

    t.unique(['cart_id', 'info_id']);
    t.index(['cart_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('cart_items');
  await knex.schema.dropTableIfExists('carts');
};
