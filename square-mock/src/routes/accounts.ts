import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";
import { luhnCheck } from "../lib/luhn.js";

const router = Router();

const VerifyQuery = z.object({
  number: z.string().min(12).max(19),
  name: z.string().min(1),
  ccv: z.string().regex(/^\d{3}$/),
  exp_month: z.coerce.number().int().min(1).max(12),
  exp_year: z.coerce.number().int().min(new Date().getFullYear()).max(2100),
});

router.get("/verify", (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = VerifyQuery.parse(req.query);

    if (!luhnCheck(q.number)) {
      return res.status(400).json({ error: { code: "INVALID_NUMBER", message: "Card number failed Luhn check." } });
    }
    const acct = store.accountsByNumber.get(q.number);
    if (!acct) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Account not found." } });

    if (acct.name.toLowerCase() !== q.name.toLowerCase()) {
      return res.status(400).json({ error: { code: "INVALID_NAME", message: "Name does not match." } });
    }
    if (acct.ccv !== q.ccv) {
      return res.status(400).json({ error: { code: "INVALID_CCV", message: "CCV does not match." } });
    }
    if (acct.exp_month !== q.exp_month || acct.exp_year !== q.exp_year) {
      return res.status(400).json({ error: { code: "INVALID_EXPIRY", message: "Expiry does not match." } });
    }

    return res.json({
      account: {
        id: acct.id,
        last4: acct.number.slice(-4),
        name: acct.name,
        exp_month: acct.exp_month,
        exp_year: acct.exp_year,
        currency: acct.currency
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
