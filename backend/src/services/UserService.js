// src/services/UserServices.js
// Uses the MVC-style model instead of a repository
const UserModel = require('../models/user.model');

class UserService {
  // allow DI for tests, default to the singleton UserModel
  constructor(userModel = UserModel) {
    this.userModel = userModel;
  }

  list() {
    return this.userModel.findAll();
  }

  async get(id) {
    const u = await this.userModel.findById(id);
    if (!u) throw new Error('not_found');
    return u;
  }

  async update(id, patch) {
    const updated = await this.userModel.update(id, patch);
    if (!updated) throw new Error('not_found');
    return updated;
  }

  async remove(id) {
    const existing = await this.userModel.findById(id);
    if (!existing) throw new Error('not_found');
    await this.userModel.remove(id);
    return true;
  }
}

module.exports = { UserService };
