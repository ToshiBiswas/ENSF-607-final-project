import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { store } from "./lib/store.js";
import accountsRouter from "./routes/accounts.js";
import paymentsRouter from "./routes/payments.js";
import refundsRouter from "./routes/refunds.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const seedOnStart = (process.env.SEED_ON_START ?? "true").toLowerCase() !== "false";
if (seedOnStart) {
  store.seed();
  console.log(`Seeded ${store.accounts.size} accounts`);
}

app.get("/v1/health", (_req, res) => res.json({ ok: true }));
app.get("/v1/accounts", (_req, res) => {
  const list = Array.from(store.accounts.values()).map(a => ({
    id: a.id, name: a.name, last4: a.number.slice(-4),
    exp_month: a.exp_month, exp_year: a.exp_year,
    balance_cents: a.balance_cents, currency: a.currency
  }));
  res.json({ accounts: list });
});

app.use("/v1/accounts", accountsRouter);
app.use("/v1/payments", paymentsRouter);
app.use("/v1/refunds", refundsRouter);

app.use((req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Unexpected error" } });
});

const port = parseInt(process.env.PORT || "8080", 10);
app.listen(port, () => console.log(`Mock payments API listening on :${port}`));
