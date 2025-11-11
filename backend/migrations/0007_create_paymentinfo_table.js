// migrations/0007_create_paymentinfo_table.js
/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  // 1) Card catalog (global, no user coupling)
  await knex.schema.createTable('paymentinfo', (t) => {
    t.increments('payment_info_id').primary();

    // Stable, non-PII identifier for a card (e.g., hashed PAN or provider id)
    t.string('account_id', 64).notNullable();
    t.unique(['account_id'], 'paymentinfo_account_id_unique');

    // Display fields (non-sensitive)
    t.string('name', 120).notNullable();
    t.string('last4', 4).notNullable();
    t.integer('exp_month').unsigned().notNullable();
    t.integer('exp_year').unsigned().notNullable();
    t.string('currency', 8).notNullable().defaultTo('CAD');
  });

  // 2) User ↔ Card link table (a user can link many cards; a card can be linked by many users)
  await knex.schema.createTable('user_cards', (t) => {
    t.increments('user_card_id').primary();

    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    t.integer('payment_info_id').unsigned().notNullable()
      .references('payment_info_id').inTable('paymentinfo').onDelete('CASCADE');

    // Prevent duplicate links of the same card for the same user
    t.unique(['user_id', 'payment_info_id'], 'user_cards_user_payment_unique');

    // Helpful indexes
    t.index(['user_id'], 'user_cards_user_idx');
    t.index(['payment_info_id'], 'user_cards_payment_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  // Drop link table first (FK depends on paymentinfo)
  await knex.schema.dropTableIfExists('user_cards');
  await knex.schema.dropTableIfExists('paymentinfo');
};
