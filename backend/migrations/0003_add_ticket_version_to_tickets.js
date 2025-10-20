// migrations/000X_add_ticket_version_to_tickets.js
/**
 * Adds a 6-char uppercase alphanumeric ticket_version to tickets.
 * We enforce NOT NULL + UNIQUE. App code generates the value on insert.
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('tickets', (t) => {
    t.string('ticket_version', 6).notNullable().after('ticket_type');
    t.unique(['ticket_version'], 'uq_tickets_ticket_version');
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('tickets', (t) => {
    t.dropUnique(['ticket_version'], 'uq_tickets_ticket_version');
    t.dropColumn('ticket_version');
  });
};
