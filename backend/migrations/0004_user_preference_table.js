// 0004_user_preference_table.js
/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('user_preferences', (t) => {
    // match this type to your users.id (int/uuid) 👇
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

    t.string('currency', 3).notNullable().defaultTo('USD');
    t.string('language', 5).notNullable().defaultTo('en');
    t.string('theme', 10).notNullable().defaultTo('light');

    t.primary(['user_id']); // one row per user; or use t.increments('id') + unique('user_id')
    t.timestamps(true, true);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('user_preferences');
};
