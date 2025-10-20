/**
 * Domain: User
 * -------------------------
 * This is a pure domain object, independent of Express/Knex.
 * We carry a private password hash (#passwordHash) to ensure callers cannot
 * accidentally serialize it into API responses. Public shape is provided via toDTO().
 *
 * Mapping policy:
 * - DB columns (snake_case) → Domain fields (camelCase)
 * - API DTOs mirror your legacy response keys (User_ID, Username, ...).
 */
class User {
  #passwordHash; // kept private; exposed via getter only for auth pipeline

  constructor({ id, name, email, role = 'user', passwordHash = null, createdAt = null }) {
    // Domain shape is intentionally small and immutable-ish (no setters).
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.#passwordHash = passwordHash;
    this.createdAt = createdAt;
  }

  /** Convert domain object into your stable API contract (DTO). */
  toDTO() {
    // We duplicate createdAt into Updated_Datetime to suit current API shape.
    // If you later add an "updated_at" column in DB, wire it here.
    return {
      User_ID: this.id,
      Username: this.name,
      Email_Address: this.email,
      Role: this.role,
      Created_Datetime: this.createdAt,
      Updated_Datetime: this.createdAt,
    };
  }

  /** Auth subsystem needs the hash for verification; keep the field private otherwise. */
  getPasswordHash() { return this.#passwordHash; }

  // ------- Factories / mappers --------

  /** Row from DB → Domain. Centralizes the column → field mapping. */
  static fromRow(row) {
    if (!row) return null;
    return new User({
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      passwordHash: row.password_hash ?? null,
      createdAt: row.created_at ?? null,
    });
  }

  /** List helper for controllers/services */
  static toDTOs(list) { return (list || []).map((u) => u.toDTO()); }
}

module.exports = { User };
