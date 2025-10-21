// src/controllers/userPreference.controller.js
const userPreferenceService = require('../services/preference.service');

class UserPreferenceController {
  async create(req, res) {
    try {
      const { userId, location, category } = req.body;
      const preference = await userPreferenceService.createPreference(userId, { location, category });
      res.status(201).json(preference);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const preferences = await userPreferenceService.getAllPreferences();
      res.status(200).json(preferences);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      const preference = await userPreferenceService.getPreferenceByUserId(userId);
      res.status(200).json(preference);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async update(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const updated = await userPreferenceService.updatePreference(userId, updates);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { userId } = req.params;
      const result = await userPreferenceService.deletePreference(userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
}

module.exports = new UserPreferenceController();
