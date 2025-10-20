const db = require('../db'); // add db connection

class Notification {
  static async create({ user_id, event_id, title, message }) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, event_id, title, message) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, event_id || null, title, message]
    );
    return result.rows[0];
  }

  static async getByUser(user_id) {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async update(id, fields) {
    const setString = Object.keys(fields)
      .map((key, i) => `${key}=$${i + 1}`)
      .join(', ');
    const values = Object.values(fields);
    values.push(id);
    const result = await db.query(
      `UPDATE notifications SET ${setString}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM notifications WHERE id=$1`, [id]);
  }
}

module.exports = Notification;
