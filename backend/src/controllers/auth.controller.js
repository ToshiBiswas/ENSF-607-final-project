// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const UserModel = require('../models/user.model');
const UserPref  = require('../models/userPreference.model'); // if you use preference on register
const { registerSchema, loginSchema } = require('../validators/auth.schemas');

const signToken = (u) =>
  jwt.sign({ id: u.user_id, email: u.email, username: u.name, role: u.role },
           process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1h' });

// ---------- REGISTER ----------
exports.register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Need: Username、Email_Address、password',
      details: parsed.error.issues
    });
  }

  const { Username, Email_Address, password, Role, Preference } = parsed.data;

  try {
    //  use model methods with DB columns
    const emailTaken = await UserModel.findByEmail(Email_Address);
    const nameTaken  = await UserModel.findByName(Username);
    if (emailTaken || nameTaken) {
      return res.status(409).json({ message: 'Username or Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // wrap in trx if you also write preference
    await db.transaction(async (trx) => {
      const [user_id] = await trx('users').insert({
        name: Username,
        email: Email_Address,
        password_hash,
        role: Role || 'user'
      });

      // optional: create preference only if provided (Location/Category)
      if (Preference && (Preference.Location || Preference.Category || Preference.Category_ID)) {
        await UserPref.upsertForRegister(
          user_id,
          {
            location: Preference.Location ?? null,
            category: Preference.Category_ID ?? Preference.Category ?? undefined
          },
          trx
        );
      }

      const created = await trx('users').where({ user_id }).first();
      const token = signToken(created);
      res.status(201).json({ message: 'register sucessful', data: UserModel.toDTO(created), token });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error', error: err.message });
  }
};

// ---------- LOGIN ----------
exports.login = async (req, res) => {
  // accept either Email_Address OR Username (your client uses DTO keys)
  const body = req.body || {};
  const emailOrName = body.Email_Address || body.Username || body.email || body.name;
  const password = body.password;

  const parsed = loginSchema.safeParse({ emailOrName, password });
  if (!parsed.success) {
    return res.status(400).json({ message: 'Need: Email_Address or Username, and password' });
  }

  try {
    //  try email first, then name (DB columns)
    const byEmail = await UserModel.findByEmail(emailOrName);
    const user = byEmail || await UserModel.findByName(emailOrName);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ message: 'login successful', data: UserModel.toDTO(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error', error: err.message });
  }
};
