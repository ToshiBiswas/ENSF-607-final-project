// migrations/20251111110000_create_payment_accounts.js
'use strict';

/**
 * Creates `payment_accounts` and inserts one test record.
 * This is for our mock functions to simulate payment provider. 
 * our real system would send these requests via a webhook.
 */

exports.up = async function up(knex) {
  await knex.schema.createTable('payment_accounts', (t) => {
    t.string('id', 64).primary();

    // Card metadata (test-only)
    t.string('number', 32).notNullable().unique(); // e.g., "4000008955597971"
    t.integer('exp_month').unsigned().notNullable(); // 1-12
    t.integer('exp_year').unsigned().notNullable();  // e.g., 2029
    t.string('ccv', 4).notNullable();                // "860" (kept as 'ccv' to match your key)

    // Holder + balance
    t.string('name', 255).notNullable();             // "Quinn Zhao"
    t.bigInteger('balance_cents').notNullable().defaultTo(0); // 50071
    t.string('currency', 3).notNullable().defaultTo('CAD');   // "CAD"

    // Timestamps
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('payment_accounts');
};
