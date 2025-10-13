const { registerSchema, loginSchema } = require('../validators/auth.schemas');
const { registerService, loginService } = require('../services/auth.service');

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Need: Username、Email_Address、password', details: parsed.error.issues });
  }
  const result = await registerService(parsed.data);
  if (result.error) return res.status(result.status).json({ message: result.error });
  return res.status(result.status).json({ message: result.message, data: result.data, token: result.token });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Need: emailOrUsername、password', details: parsed.error.issues });
  }
  const result = await loginService(parsed.data);
  if (result.error) return res.status(result.status).json({ message: result.error });
  return res.status(result.status).json({ message: result.message, data: result.data, token: result.token });
}

module.exports = { register, login };
