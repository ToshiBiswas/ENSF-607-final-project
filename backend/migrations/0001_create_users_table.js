/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.increments('user_id').primary();
    t.string('name', 120).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.enu('role', ['user', 'admin'], { useNative: true, enumName: 'user_role' })
      .notNullable().defaultTo('user');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
  try { await knex.raw('DROP TYPE IF EXISTS user_role'); } catch {}
};
