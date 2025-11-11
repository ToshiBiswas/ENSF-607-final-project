// seeds/099_clear_payment_tables.js
/**
 * Seed: Clear ONLY payment-related tables.
 * - payments
 * - user_cards (user <-> paymentinfo link)
 * - paymentinfo
 *
 * Safe to run multiple times. Leaves all other domain data intact.
 *
 * Usage:
 *   npx knex seed:run --specific=099_clear_payment_tables.js
 * or (with docker):
 *   docker compose exec api npx knex seed:run --env development --specific=099_clear_payment_tables.js
 */
exports.seed = async function clearPaymentTables(knex) {
  // Helper that checks existence, deletes rows, and resets AUTO_INCREMENT
  async function wipeTable(name) {
    const exists = await knex.schema.hasTable(name);
    if (!exists) return;
    try {
      // MySQL FK-friendly order: delete children first, then parents
      await knex(name).del();
      // Reset AUTO_INCREMENT if table has an AI PK
      try {
        await knex.raw(`ALTER TABLE \`${name}\` AUTO_INCREMENT = 1`);
      } catch (e) {
        // ignore if table has no AUTO_INCREMENT
      }
      console.log(`[seed] cleared ${name}`);
    } catch (e) {
      console.warn(`[seed] skipped ${name}: ${e.code || e.message}`);
    }
  }

  // Disable FK checks for the session (MySQL/MariaDB)
  try { await knex.raw('SET FOREIGN_KEY_CHECKS = 0'); } catch (_) {}

  // ORDER MATTERS: clear payments first, then link table, then paymentinfo
  await wipeTable('payments');
  await wipeTable('user_cards');   // linking table (if present)
  await wipeTable('paymentinfo');  // base card table

  // Re-enable FK checks
  try { await knex.raw('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
};
