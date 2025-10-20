// src/models/userPreference.model.js
const db = require('../db');
const T_PREF = 'userpreferences';
const T_CAT  = 'categoriesid';

const toDTO = (row) => row && ({
  Preference_ID: row.preference_id,
  User_ID: row.user_id,
  Location: row.location,
  Category_ID: row.category_id ?? null,
  Category: row.category_value ?? null,
  Created_Datetime: row.created_at
});

class UserPreferenceModel {
  async findByUserId(user_id, trx = db) {
    const q = trx ?? db;
    const row = await q(T_PREF)
      .leftJoin(T_CAT, `${T_PREF}.category_id`, `${T_CAT}.category_id`)
      .where(`${T_PREF}.user_id`, user_id)
      .select(`${T_PREF}.*`, `${T_CAT}.category_value`)
      .first();
    return toDTO(row);
  }

  async ensurePreferenceRow(user_id, location = null, trx = db) {
    const q = trx ?? db;
    let row = await q(T_PREF).where({ user_id }).first();
    if (!row) {
      const [id] = await q(T_PREF).insert({ user_id, location });
      row = await q(T_PREF).where({ preference_id: id }).first();
    } else if (location != null && location !== row.location) {
      await q(T_PREF).where({ preference_id: row.preference_id }).update({ location });
      row = await q(T_PREF).where({ preference_id: row.preference_id }).first();
    }
    return row;
  }

  async setCategoryByValue(user_id, categoryValue, trx = db) {
    if (categoryValue == null) return;
    const q = trx ?? db;
    const value = String(categoryValue).trim();
    if (!value) return;

    await q(T_CAT).insert({ category_value: value }).onConflict('category_value').ignore();
    const cat = await q(T_CAT).where({ category_value: value }).first();
    await q(T_PREF).where({ user_id }).update({ category_id: cat.category_id });
  }

  async setCategoryById(user_id, category_id, trx = db) {
    if (category_id == null) return;
    const q = trx ?? db;
    await q(T_PREF).where({ user_id }).update({ category_id });
  }

  async upsertForRegister(user_id, { location, category }, trx = db) {
    const q = trx ?? db;
    await this.ensurePreferenceRow(user_id, location ?? null, q);

    if (category !== undefined) {
      if (typeof category === 'number') {
        await this.setCategoryById(user_id, category, q);
      } else if (typeof category === 'string') {
        await this.setCategoryByValue(user_id, category, q);
      }
    }

    const row = await q(T_PREF)
      .leftJoin(T_CAT, `${T_PREF}.category_id`, `${T_CAT}.category_id`)
      .where(`${T_PREF}.user_id`, user_id)
      .select(`${T_PREF}.*`, `${T_CAT}.category_value`)
      .first();
    return toDTO(row);
  }
}

module.exports = new UserPreferenceModel();
