'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function loadApprovedAccounts() {
  const p = process.env.ACCOUNTS_PATH || path.join(__dirname, 'data', 'accounts.ts');
  const raw = fs.readFileSync(p, 'utf8');

  // If it's JSON, just parse and return.
  const isLikelyJson = p.endsWith('.json') || raw.trim().startsWith('[');
  if (isLikelyJson) {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('accounts JSON must export an array');
    return arr;
  }

  // Otherwise treat as TS and strip TS-only syntax.
  let code = raw
    // remove import lines
    .replace(/^\s*import[^\n]*\n/gm, '')
    // remove 'export type ...' and 'type ...'
    .replace(/^\s*(export\s+)?type\s+[^\n]*\n/gm, '')
    // remove interface blocks (naive)
    .replace(/\b(export\s+)?interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}\s*/gm, '')
    // remove `as const`
    .replace(/\bas\s+const\b/g, '');

  // Convert TS exports to CJS
  if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, 'module.exports = ');
  } else if (/export\s+const\s+accounts\s*=/.test(code)) {
    code += '\nmodule.exports = accounts;\n';
  }

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  try {
    new vm.Script(code, { filename: 'accounts.ts' }).runInContext(sandbox);
  } catch (e) {
    throw new Error('Failed to evaluate accounts.ts: ' + e.message);
  }
  const accounts = sandbox.module.exports || sandbox.exports;
  if (!Array.isArray(accounts)) {
    throw new Error('accounts.ts did not export an array');
  }
  return accounts;
}

function deriveIdFromNumber(number) {
  const n = String(number || '');
  return 'acct_' + crypto.createHash('sha256').update(n).digest('hex').slice(0, 24);
}

function toInt(x) {
  if (x === null || x === undefined || x === '') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

exports.seed = async function (knex) {
  const accounts = loadApprovedAccounts();
  await knex('payments').del().catch(()=>{});

  // Validate + normalize each record
  const rows = accounts.map((a, idx) => {
    if (!a || (!a.id && !a.number)) {
      throw new Error(`Account at index ${idx} missing 'number' (or 'id')`);
    }
    const id = deriveIdFromNumber(a.number);
    const number = a.number != null ? String(a.number) : null;
    const exp_month = toInt(a.exp_month);
    const exp_year = toInt(a.exp_year);
    const balance_cents = toInt(a.balance_cents);
    const ccv = a.ccv != null ? String(a.ccv) : null; // schema uses 'ccv'
    const name = a.name != null ? String(a.name) : null;
    const currency = a.currency ? String(a.currency) : 'CAD';

    // Basic sanity checks to catch NaN/undefined early
    if (!number) throw new Error(`Account ${id} missing card 'number'`);
    if (exp_month == null || exp_year == null)
      throw new Error(`Account ${id} missing 'exp_month'/'exp_year'`);
    if (balance_cents == null)
      throw new Error(`Account ${id} missing 'balance_cents'`);
    if (!ccv) throw new Error(`Account ${id} missing 'ccv'`);
    if (!name) throw new Error(`Account ${id} missing 'name'`);

    return {
      id,
      number,
      exp_month,
      exp_year,
      ccv,
      name,
      balance_cents,
      currency,
    };
  });
  
  await knex.transaction(async (trx) => {
    await trx('payment_accounts').del();
    await trx.batchInsert('payment_accounts', rows, 100);
  });
};
