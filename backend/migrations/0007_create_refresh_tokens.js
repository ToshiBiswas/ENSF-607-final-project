// /migrations/00XX_create_refresh_tokens_table.js

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.increments('id').primary();
    // User who owns this refresh token
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');

    // SHA-256 hash of the refresh token string
    t.string('token_hash', 64).notNullable().unique();

    // Expiration time (must match JWT refresh expiry)
    t.timestamp('expires_at').notNullable();

    // Soft revoke flag
    t.boolean('revoked').notNullable().defaultTo(false);

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('revoked_at').nullable();
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
};
