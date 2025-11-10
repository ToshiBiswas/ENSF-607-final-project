/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('userpreferences', (t) => {
    t.increments('pref_id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE').unique(); // 1:1
    t.string('location', 120).notNullable();
    t.integer('category_id').unsigned().notNullable()
      .references('category_id').inTable('categoriesid').onDelete('RESTRICT');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('userpreferences');
};
