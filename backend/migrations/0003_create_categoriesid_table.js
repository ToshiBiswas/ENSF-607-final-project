/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('categoriesid', (t) => {
    t.increments('category_id').primary();
    t.string('category_value', 120).notNullable().unique();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('categoriesid');
};
