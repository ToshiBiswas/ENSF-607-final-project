const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../db');

const registerSchema = z.object({
  Username: z.string().min(3),
  Email_Address: z.string().email(),
  password: z.string().min(6),
  Postal_Address: z.string().optional().nullable(),
  Mobile_Number: z.string().optional().nullable(),
  Role: z.enum(['user','admin']).optional().default('user')
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(6)
});

function signToken(user) {
  const payload = {
    id: user.User_ID,
    email: user.Email_Address,
    username: user.Username,
    role: user.Role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1h'
  });
}

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Need: Username、Email_Address、password', details: parsed.error.issues });
    }
    const { Username, Email_Address, password, Postal_Address = null, Mobile_Number = null, Role } = parsed.data;

    // Uniqueness checks
    const existing = await db('users')
      .where('Email_Address', Email_Address)
      .orWhere('Username', Username)
      .first();
    if (existing) {
      return res.status(409).json({ message: 'Username or Email already exists' });
    }

    // Hash password
    const Password_Hash = await bcrypt.hash(password, 12);

    // Insert user
    const [User_ID] = await db('users').insert({
      Username,
      Email_Address,
      Postal_Address,
      Mobile_Number,
      Password_Hash,
      Role
    });

    const user = await db('users').where({ User_ID }).first();

    // Token
    const token = signToken(user);

    return res.status(201).json({
      message: 'register sucessful',
      data: {
        User_ID: user.User_ID,
        Username: user.Username,
        Email_Address: user.Email_Address,
        Postal_Address: user.Postal_Address,
        Mobile_Number: user.Mobile_Number,
        Role: user.Role,
        Created_Datetime: user.Created_Datetime,
        Updated_Datetime: user.Updated_Datetime
      },
      token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal error', error: err.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Need: emailOrUsername、password', details: parsed.error.issues });
    }
    const { emailOrUsername, password } = parsed.data;

    // Find by email OR username
    const user = await db('users')
      .where('Email_Address', emailOrUsername)
      .orWhere('Username', emailOrUsername)
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.Password_Hash || '');
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      message: 'login successful',
      data: {
        User_ID: user.User_ID,
        Username: user.Username,
        Email_Address: user.Email_Address,
        Role: user.Role
      },
      token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal error', error: err.message });
  }
};
