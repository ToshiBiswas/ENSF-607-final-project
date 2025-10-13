const { z } = require('zod');

const registerSchema = z.object({
  Username: z.string().min(3),
  Email_Address: z.string().email(),
  password: z.string().min(6),
  Role: z.enum(['user','admin']).optional().default('user')
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(6)
});

module.exports = { registerSchema, loginSchema };
