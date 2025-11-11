// seeds/001_payment_accounts_from_json.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadApprovedAccounts() {
    const p = process.env.ACCOUNTS_PATH || path.join(__dirname, 'data', 'accounts.ts');
    const raw = fs.readFileSync(p, 'utf8');

    // 1) Strip imports and type/interface declarations (best-effort)
    let code = raw
    // remove import lines
    .replace(/^\s*import[^\n]*\n/gm, '')
    // remove single-line 'export type ...' and 'type ...'
    .replace(/^\s*(export\s+)?type\s+[^\n]*\n/gm, '')
    // remove interface blocks (naive but works for simple files)
    .replace(/\b(export\s+)?interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}\s*/gm, '');

    // 2) Convert `export default` or named export to CommonJS
    if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, 'module.exports = ');
    } else if (/export\s+const\s+accounts\s*=/.test(code)) {
    // keep declaration, then add module.exports = accounts;
    code += "\nmodule.exports = accounts;\n";
    }

    // 3) Remove TS-only tokens like `as const` and generic casts before arrays
    code = code
    .replace(/as\s+const/g, '')
    .replace(/<[^>]+>(?=\s*\[)/g, '');

    // 4) Execute in a sandbox to evaluate the array literal as JS
    const sandbox = { module: { exports: {} }, exports: {} };
    vm.createContext(sandbox);
    try {
    new vm.Script(code, { filename: 'accounts.ts' }).runInContext(sandbox);
    } catch (e) {
    throw new Error('Failed to evaluate accounts.ts: ' + e.message);
    }
    const accounts = sandbox.module.exports || sandbox.exports;
    if (!Array.isArray(accounts)) {
    throw new Error('accounts.ts did not export an array.');
    }
    return accounts;
}
    

exports.seed = async function (knex) {
    const accounts = loadApprovedAccounts()
  // 2) Normalize rows to match the table schema
    const rows = accounts.map((a) => ({
        id: a.id,
        number: String(a.number),
        exp_month: Number(a.exp_month),
        exp_year: Number(a.exp_year),
        ccv: String(a.ccv),            // keep key name 'ccv' to match your schema
        name: a.name,
        balance_cents: Number(a.balance_cents),
        currency: a.currency || 'CAD',
    }));

  // 3) Idempotent seed: wipe then load (common for dev/test seeds)
  await knex.transaction(async (trx) => {
    await trx('payment_accounts').del();
    await trx.batchInsert('payment_accounts', rows, 100);
  });

  // If you prefer NOT to delete existing rows, use this instead:
  // await knex('payment_accounts').insert(rows).onConflict('id').merge();
};
