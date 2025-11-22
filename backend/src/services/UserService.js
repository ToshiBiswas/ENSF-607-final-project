/**
 * UserService
 * Thin façade on top of repos for profile + preferences.
 */
const { UserRepo } = require('../repositories/UserRepo');

class UserService {
  static async updateProfile(userId, { name, email }) {
    return UserRepo.updateProfile(userId, { name, email });
  }

}

module.exports = { UserService };
