import fs from 'fs';
import path from 'path';
import { Account, IdempotencyRecord, Payment, Refund } from './types.js';

const dataDir = path.resolve(process.cwd(), 'seed');
const accountsPath = path.join(dataDir, 'accounts.json');
const ledgerPath = path.join(dataDir, 'ledger.json');
const idemPath = path.join(dataDir, 'idempotency.json');

function ensureFiles() {
  if (!fs.existsSync(ledgerPath)) fs.writeFileSync(ledgerPath, '[]', 'utf-8');
  if (!fs.existsSync(idemPath)) fs.writeFileSync(idemPath, '[]', 'utf-8');
}

ensureFiles();

export const DB = {
  loadAccounts(): Account[] {
    const raw = fs.readFileSync(accountsPath, 'utf-8');
    return JSON.parse(raw);
  },
  saveAccounts(accounts: Account[]) {
    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  },
  loadLedger(): (Payment|Refund)[] {
    const raw = fs.readFileSync(ledgerPath, 'utf-8');
    return JSON.parse(raw);
  },
  appendLedger(entry: Payment|Refund) {
    const ledger = DB.loadLedger();
    ledger.push(entry);
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  },
  findAccount(id: string): Account | undefined {
    return DB.loadAccounts().find(a => a.id === id);
  },
  upsertAccount(account: Account) {
    const accounts = DB.loadAccounts();
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account; else accounts.push(account);
    DB.saveAccounts(accounts);
  },
  getIdempotency(key: string): IdempotencyRecord | undefined {
    const raw = fs.readFileSync(idemPath, 'utf-8');
    const records: IdempotencyRecord[] = JSON.parse(raw);
    return records.find(r => r.key === key);
  },
  saveIdempotency(rec: IdempotencyRecord) {
    const raw = fs.readFileSync(idemPath, 'utf-8');
    const records: IdempotencyRecord[] = JSON.parse(raw);
    records.push(rec);
    fs.writeFileSync(idemPath, JSON.stringify(records, null, 2));
  }
};
