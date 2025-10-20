import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { paymentRequestSchema, refundRequestSchema } from './validators.js';
import { processPayment, processRefund } from './services/ledger.js';
import { DB } from './db.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/v1/health', (_req, res) => res.json({ ok: true }));

// Get account (for testing)
app.get('/v1/accounts/:id', (req, res) => {
  const acc = DB.findAccount(req.params.id);
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  // mask card number except last 4
  const masked = Object.assign({}, acc);
  if (masked.card && masked.card.number) {
    const s = String(masked.card.number).replace(/\s+/g, '');
    masked.card.number = s.length > 4 ? '**** **** **** ' + s.slice(-4) : s;
  }
  res.json(masked);
});

// Simple list ledger
app.get('/v1/ledger', (_req, res) => {
  res.json(DB.loadLedger());
});

// Create payment
app.post('/v1/payments', (req, res) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key') || undefined;
    const parsed = paymentRequestSchema.parse(req.body);
    const result = processPayment(parsed.accountId, parsed.amount, parsed.currency, parsed.description, idempotencyKey, parsed.card, parsed.firstName, parsed.lastName);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'validation_error', details: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
});

// Create refund
app.post('/v1/refunds', (req, res) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key') || undefined;
    const parsed = refundRequestSchema.parse(req.body);
    const result = processRefund(parsed.paymentId, parsed.amount, parsed.reason, idempotencyKey);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'validation_error', details: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Payment Mock listening on http://localhost:${port}`);
});
