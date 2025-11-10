import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";
import type { Refund } from "../lib/types.js";
import { randomUUID } from "node:crypto";

const router = Router();

const CreateRefund = z.object({
  payment_id: z.string().min(6),
  amount_cents: z.number().int().min(1),
  idempotency_key: z.string().min(6).optional(),
});

const idem = new Map<string, Refund>();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateRefund.parse(req.body);

    if (body.idempotency_key) {
      const existing = idem.get(body.idempotency_key);
      if (existing) return res.status(200).json({ refund: existing });
    }

    const payment = store.payments.get(body.payment_id);
    if (!payment) return res.status(404).json({ error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found." } });
    if (payment.status !== "APPROVED") {
      return res.status(400).json({ error: { code: "NOT_REFUNDABLE", message: "Only approved payments can be refunded." } });
    }

    const acct = store.accounts.get(payment.account_id);
    if (!acct) return res.status(404).json({ error: { code: "ACCOUNT_NOT_FOUND", message: "Account not found for this payment." } });

    const already = payment.refunded_cents ?? 0;
    const remaining = payment.amount_cents - already;
    if (body.amount_cents > remaining) {
      return res.status(400).json({ error: { code: "AMOUNT_EXCEEDS", message: "Refund exceeds remaining refundable amount." }, remaining_refundable_cents: remaining });
    }

    // Credit back to account
    acct.balance_cents += body.amount_cents;
    store.accounts.set(acct.id, acct);

    payment.refunded_cents = already + body.amount_cents;
    store.payments.set(payment.id, payment);

    const refund: Refund = {
      id: "rfnd_" + randomUUID().replace(/-/g, "").slice(0, 18),
      payment_id: payment.id,
      amount_cents: body.amount_cents,
      currency: payment.currency,
      status: "APPROVED",
      created_at: new Date().toISOString(),
    };

    store.refunds.set(refund.id, refund);
    if (body.idempotency_key) idem.set(body.idempotency_key, refund);

    return res.status(201).json({ refund, payment: { id: payment.id, refunded_cents: payment.refunded_cents } });
  } catch (e) {
    next(e);
  }
});

export default router;
