import { z } from 'zod';

export const cardSchema = z.object({
  number: z.string().min(12).max(19), // raw digits
  ccv: z.string().min(3).max(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2025), // reasonable lower bound
});

export const paymentRequestSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.enum(['USD','CAD','EUR']),
  description: z.string().max(200).optional(),
  card: cardSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export const refundRequestSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().int().positive().optional(),
  reason: z.string().max(200).optional()
});

export type RefundRequest = z.infer<typeof refundRequestSchema>;
