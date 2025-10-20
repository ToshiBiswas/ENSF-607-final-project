// src/controllers/users.controller.js
const UserModel = require('../models/user.model');
const { UserService } = require('../services/UserService');
const { userUpdateSchema } = require('../validators/user.schemas'); // make sure this exists

const userService = new UserService(UserModel);

const normalizeId = (raw) => {
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function listUsers(_req, res) {
  const rows = await userService.list(); // DB rows
  res.json({ message: 'Get user list : successful', data: UserModel.toDTOs(rows) });
}

async function getUser(req, res) {
  const id = normalizeId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  try {
    const row = await userService.get(id);
    res.json({ message: 'Get user : successful', data: UserModel.toDTO(row) });
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
}

async function updateUser(req, res) {
  const id = normalizeId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', details: parsed.error.issues });
  }

  // prevent email collision
  if (parsed.data.email) {
    const exists = await UserModel.findByEmail(parsed.data.email);
    if (exists && exists.user_id !== id) {
      return res.status(409).json({ message: 'Email already in use' });
    }
  }

  const updated = await userService.update(id, parsed.data);
  if (!updated) return res.status(404).json({ message: 'User not found' });

  res.json({ message: 'Update user : successful', data: UserModel.toDTO(updated) });
}

async function deleteUser(req, res) {
  const id = normalizeId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  try {
    await userService.remove(id);
    res.json({ message: 'Delete user : successful' });
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
