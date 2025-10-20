const { z } = require('zod');

const preferenceSchema = z.object({
  Location: z.string().min(1).max(255).optional(),
  // Accept a single string or an array of strings
  Categories: z.union([
    z.string().min(1).max(100),
    z.array(z.string().min(1).max(100)).min(1)
  ]).optional()
}).refine(p => {
  // allow empty/undefined; if present must have at least one field non-empty
  if (!p || Object.keys(p).length === 0) return true;
  return !!(p.Location || p.Categories);
}, { message: 'Preference must include Location and/or Categories when provided' });

const registerSchema = z.object({
  Username: z.string().min(3),
  Email_Address: z.string().email(),
  password: z.string().min(6),
  Role: z.enum(['user','admin']).optional().default('user'),
  Preference: preferenceSchema.optional()
});

module.exports = { registerSchema };
