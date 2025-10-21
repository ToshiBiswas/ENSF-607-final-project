// migrations/000X_create_categories_and_eventscategories.js
exports.up = async (knex) => {
  // Create categories if missing
  const hasCategories = await knex.schema.hasTable('categories');
  if (!hasCategories) {
    await knex.schema.createTable('categories', (t) => {
      t.increments('category_id').primary();
      t.string('category_value', 100).notNullable().unique();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Create eventscategories if missing (event ↔ category many-to-many)
  const hasEventsCats = await knex.schema.hasTable('eventscategories');
  if (!hasEventsCats) {
    await knex.schema.createTable('eventscategories', (t) => {
      t.increments('event_category_id').primary();
      t
        .integer('event_id')
        .unsigned()
        .notNullable()
        .references('events.event_id')
        .onDelete('CASCADE');
      t
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('categories.category_id')
        .onDelete('CASCADE');
      t.unique(['event_id', 'category_id']); // one link per pair
    });
  }
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('eventscategories');
  await knex.schema.dropTableIfExists('categories');
};
