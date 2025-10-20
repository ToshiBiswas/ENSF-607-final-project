/**
 * Model: events
 * -------------------------
 * Encapsulates DB access for events and maps rows ↔ domain (Event).
 * Services rely on this model to:
 *   - create/update/delete within transactions
 *   - read for permission checks (owner/admin)
 *   - fetch skeleton event; ticket options are loaded via ticketInfo.model
 *
 * Notes:
 * - Keep all column names here so Services/Controllers never depend on schema.
 * - Expose transaction-aware helpers where appropriate.
 */
const db = require('../db');
const { Event } = require('../domain/Event');

const TABLE = 'events';

module.exports = {
  /** PK lookup used by Services for permission and GET endpoints. */
  async findById(event_id) {
    const row = await db(TABLE).where({ event_id }).first();
    return Event.fromRow(row);
  },

  /** Transaction-aware create, then re-read to return hydrated domain object. */
  async create(trx, row) {
    const q = trx ?? db;
    const [id] = await q(TABLE).insert(row);
    const created = await q(TABLE).where({ event_id: id }).first();
    return Event.fromRow(created);
  },

  /** Partial update; Service enforces business rules (e.g., owner/admin). */
  async update(trx, event_id, patch) {
    const q = trx ?? db;
    await q(TABLE).where({ event_id }).update(patch);
    const row = await q(TABLE).where({ event_id }).first();
    return Event.fromRow(row);
  },

  /** Hard delete (usually after refunds+notifications). */
  async remove(trx, event_id) {
    const q = trx ?? db;
    return q(TABLE).where({ event_id }).del();
  },

  // DTO conveniences if a controller wants them directly
  toDTO(e) { return e?.toDTO?.(); },
  toDTOs(list) { return Event.toDTOs(list); },
};
