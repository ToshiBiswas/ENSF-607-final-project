exports.up = async function up(knex) {
  // 1) Create table if missing
  const hasTable = await knex.schema.hasTable('userpreferences');
  if (!hasTable) {
    await knex.schema.createTable('userpreferences', (t) => {
      t.increments('preference_id').primary();
      t
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('users.user_id')
        .onDelete('CASCADE'); // deleting a user removes their preferences
      t.string('location', 255).nullable();
      t.string('category', 100).nullable(); // <-- single category value (string)
      t.timestamp('created_at').defaultTo(knex.fn.now());

      // one preference per user
      t.unique(['user_id'], 'uq_userpreferences_user_id');
    });
    return;
  }

  // 2) Table exists → make sure columns/indexes are correct
  const hasCategoryId = await knex.schema.hasColumn('userpreferences', 'category_id');
  const hasCategory   = await knex.schema.hasColumn('userpreferences', 'category');
  const hasLocation   = await knex.schema.hasColumn('userpreferences', 'location');

  // Drop the old FK column if it still exists
  if (hasCategoryId) {
    await knex.schema.alterTable('userpreferences', (t) => {
      t.dropColumn('category_id');
    });
  }

  // Ensure "category" string column exists
  if (!hasCategory) {
    await knex.schema.alterTable('userpreferences', (t) => {
      t.string('category', 100).nullable();
    });
  }

  // Ensure "location" exists
  if (!hasLocation) {
    await knex.schema.alterTable('userpreferences', (t) => {
      t.string('location', 255).nullable();
    });
  }

  // Ensure unique(user_id) exists (MySQL)
  // Note: SHOW INDEX returns rows; add the constraint only if missing
  const [idxRows] = await knex.raw(
    "SHOW INDEX FROM userpreferences WHERE Key_name = 'uq_userpreferences_user_id';"
  );
  const hasUnique =
    Array.isArray(idxRows) ? idxRows.length > 0 : Boolean(idxRows && idxRows.length);
  if (!hasUnique) {
    await knex.schema.alterTable('userpreferences', (t) => {
      t.unique(['user_id'], 'uq_userpreferences_user_id');
    });
  }
};

exports.down = async function down(knex) {
  // Simplest reversible action: drop the table (you can customize if needed)
  await knex.schema.dropTableIfExists('userpreferences');
};
