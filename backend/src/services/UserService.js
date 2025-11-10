/**
 * UserService
 * Thin façade on top of repos for profile + preferences.
 */
const { UserRepo } = require('../repositories/UserRepo');
const { UserPreferencesRepo } = require('../repositories/UserPreferencesRepo');

class UserService {
  static async updateProfile(userId, { name, email }) {
    return UserRepo.updateProfile(userId, { name, email });
  }

  static async setPreferences(userId, { location, categoryId }) {
    return UserPreferencesRepo.upsert(userId, { location, categoryId });
  }
}

module.exports = { UserService };
