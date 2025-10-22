/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('paymentinfo', (t) => {
    t.increments('payment_info_id').primary();

    // Owner of this payment method
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');

    // ID returned by the mock /v1/accounts/verify (e.g., "acct_001")
    t.string('account_id', 64).notNullable().unique();

    // Non-sensitive account snapshot (what the mock returns)
    t.string('name', 120).notNullable();                // Cardholder name
    t.string('last4', 4).notNullable();                 // Last four digits for display
    t.integer('exp_month').unsigned().notNullable();    // 1..12
    t.integer('exp_year').unsigned().notNullable();     // two-digit or four-digit; app normalizes
    t.string('currency', 8).notNullable().defaultTo('CAD');

    // Whether this is the default method for the user (enforced in app layer)
    t.boolean('primary_account').notNullable().defaultTo(false);

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // helpful index when listing a user's methods
    t.index(['user_id']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('paymentinfo');
};
