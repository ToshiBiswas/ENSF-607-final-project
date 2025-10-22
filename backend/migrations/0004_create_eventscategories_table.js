/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('eventscategories', (t) => {
    t.increments('id').primary();
    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');
    t.integer('category_id').unsigned().notNullable()
      .references('category_id').inTable('categoriesid').onDelete('CASCADE');
    t.unique(['event_id', 'category_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('eventscategories');
};
