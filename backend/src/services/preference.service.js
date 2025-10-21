// src/services/userPreference.service.js
const userPreferenceModel = require('../models/preference.model.js');

class UserPreferenceService {
  async createPreference(userId, data) {
    // Use upsert (create or update existing)
    return await userPreferenceModel.upsertForRegister(userId, data);
  }

  async getPreferenceByUserId(userId) {
    const preference = await userPreferenceModel.findByUserId(userId);
    if (!preference) throw new Error('User preference not found');
    return preference;
  }

  async updatePreference(userId, updates) {
    return await userPreferenceModel.upsertForRegister(userId, updates);
  }

  async deletePreference(userId, trx) {
    const q = trx ?? require('../db');
    const deleted = await q('userpreferences').where({ user_id: userId }).del();
    if (!deleted) throw new Error('No preference found to delete');
    return { message: 'Preference deleted successfully' };
  }

  async getAllPreferences() {
    const q = require('../db');
    const rows = await q('userpreferences')
      .leftJoin('categoriesid', 'userpreferences.category_id', 'categoriesid.category_id')
      .select('userpreferences.*', 'categoriesid.category_value');
    return rows.map(r => ({
      Preference_ID: r.preference_id,
      User_ID: r.user_id,
      Location: r.location,
      Category_ID: r.category_id,
      Category: r.category_value,
      Created_Datetime: r.created_at
    }));
  }
}

module.exports = new UserPreferenceService();