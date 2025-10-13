const { z } = require('zod');

const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user','admin']).optional()
}).refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

module.exports = { userUpdateSchema };
