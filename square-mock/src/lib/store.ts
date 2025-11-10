import type { Account, Payment, Refund } from "./types.js";
import seed from "../data/accounts.js";

class Store {
  accounts = new Map<string, Account>();
  accountsByNumber = new Map<string, Account>();
  payments = new Map<string, Payment>();
  refunds = new Map<string, Refund>();

  seed() {
    this.accounts.clear();
    this.accountsByNumber.clear();
    seed.forEach(a => { this.accounts.set(a.id, a); this.accountsByNumber.set(a.number, a); });
    this.payments.clear();
    this.refunds.clear();
  }
}

export const store = new Store();
