const db = require('../db');
const TABLE = 'users';

module.exports = {
  async findByEmailOrName(emailOrName) {
    return db(TABLE)
      .where('email', emailOrName)
      .orWhere('name', emailOrName)
      .first();
  },

  async findByEmail(email) {
    return db(TABLE).where({ email }).first();
  },

  async findByName(name) {
    return db(TABLE).where({ name }).first();
  },

  async create({ name, email, password_hash, role = 'user' }) {
    const [user_id] = await db(TABLE).insert({ name, email, password_hash, role });
    return this.findById(user_id);
  },

  async findById(user_id) {
    return db(TABLE).where({ user_id }).first();
  },

  toDTO(row) {
    if (!row) return null;
    return {
      User_ID: row.user_id,
      Username: row.name,
      Email_Address: row.email,
      Role: row.role,
      Created_Datetime: row.created_at,
      Updated_Datetime: row.created_at
    };
  }
};
