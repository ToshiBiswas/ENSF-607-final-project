import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";
import type { Payment } from "../lib/types.js";
import { randomUUID } from "node:crypto";

const router = Router();

const CreatePayment = z.object({
  account_id: z.string().min(6),
  ccv: z.string().regex(/^\d{3}$/),
  amount_cents: z.number().int().min(1),
  currency: z.string().length(3).default(process.env.DEFAULT_CURRENCY || "CAD"),
  idempotency_key: z.string().min(6).optional(),
});

const idem = new Map<string, Payment>();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreatePayment.parse(req.body);

    if (body.idempotency_key) {
      const existing = idem.get(body.idempotency_key);
      if (existing) return res.status(200).json({ payment: existing });
    }

    const acct = store.accounts.get(body.account_id);
    if (!acct) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Account not found." } });

    if (acct.ccv !== body.ccv) {
      return res.status(400).json({ error: { code: "INVALID_CCV", message: "CCV does not match." } });
    }
    if (acct.currency.toUpperCase() !== body.currency.toUpperCase()) {
      return res.status(400).json({ error: { code: "CURRENCY_MISMATCH", message: "Currency does not match account currency." } });
    }
    if (acct.balance_cents < body.amount_cents) {
      const declined: Payment = {
        id: "pay_" + randomUUID().replace(/-/g, "").slice(0, 18),
        account_id: acct.id,
        amount_cents: body.amount_cents,
        currency: body.currency.toUpperCase(),
        status: "DECLINED",
        created_at: new Date().toISOString(),
      };
      if (body.idempotency_key) idem.set(body.idempotency_key, declined);
      return res.status(402).json({ payment: declined, error: { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds." } });
    }

    acct.balance_cents -= body.amount_cents;
    store.accounts.set(acct.id, acct);

    const payment: Payment = {
      id: "pay_" + randomUUID().replace(/-/g, "").slice(0, 18),
      account_id: acct.id,
      amount_cents: body.amount_cents,
      currency: body.currency.toUpperCase(),
      status: "APPROVED",
      created_at: new Date().toISOString(),
    };
    store.payments.set(payment.id, payment);
    if (body.idempotency_key) idem.set(body.idempotency_key, payment);

    return res.status(201).json({ payment });
  } catch (e) {
    next(e);
  }
});

export default router;
