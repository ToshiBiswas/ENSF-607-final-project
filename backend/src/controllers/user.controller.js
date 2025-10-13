const User = require('../models/user.model');
const { userUpdateSchema } = require('../validators/user.schemas');

async function listUsers(_req, res) {
  const rows = await User.findAll();
  return res.json({
    message: 'Get user list : successful',
    data: rows.map(User.toDTO)
  });
}

async function getUser(req, res) {
  const id = Number(req.params.id);
  const row = await User.findById(id);
  if (!row) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Get user : successful', data: User.toDTO(row) });
}

async function updateUser(req, res) {
  const id = Number(req.params.id);
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', details: parsed.error.issues });
  }
  // prevent email/name conflicts (optional)
  if (parsed.data.email) {
    const exists = await User.findByEmail(parsed.data.email);
    if (exists && exists.user_id !== id) {
      return res.status(409).json({ message: 'Email already in use' });
    }
  }
  const updated = await User.update(id, parsed.data);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'Update user : successful', data: User.toDTO(updated) });
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);
  const row = await User.findById(id);
  if (!row) return res.status(404).json({ message: 'User not found' });
  await User.remove(id);
  return res.json({ message: 'Delete user : successful' });
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
