const bcrypt = require('bcrypt');
const { signJwt } = require('../utils/jwt');
const User = require('../models/user.model');

async function registerService({ Username, Email_Address, password, Role = 'user' }) {
  const existing = (await User.findByEmail(Email_Address)) || (await User.findByName(Username));
  if (existing) return { status: 409, error: 'Username or Email already exists' };

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: Username, email: Email_Address, password_hash, role: Role });

  const token = signJwt({
    id: user.user_id,
    email: user.email,
    username: user.name,
    role: user.role
  });
 
  return { status: 201, data: User.toDTO(user), token, message: 'register sucessful' };
}

async function loginService({ emailOrUsername, password }) {
  const user = await User.findByEmailOrName(emailOrUsername);
  if (!user) return { status: 401, error: 'Invalid credentials' };

  const ok = await bcrypt.compare(password, user.password_hash || '');
  if (!ok) return { status: 401, error: 'Invalid credentials' };

  const token = signJwt({
    id: user.user_id,
    email: user.email,
    username: user.name,
    role: user.role
  });

  return {
    status: 200,
    data: { User_ID: user.user_id, Username: user.name, Email_Address: user.email, Role: user.role },
    token,
    message: 'login successful'
  };
}

module.exports = { registerService, loginService };
