// src/mock/MockPaymentsProvider.js
const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/errors'); // keep path consistent with your project

class MockPaymentsProvider {
  // ---------- internal helpers (all static) ----------
  static #normalizeAccount(a) {
    return {
      number: String(a.number),
      name: String(a.name).trim(),
      ccv: String(a.ccv),
      exp_month: Number(a.exp_month),
      exp_year: Number(a.exp_year),
      currency: a.currency || 'CAD',
    };
  }

  static #luhnOk(num) {
    const s = String(num).replace(/\s|-/g, '');
    if (!/^\d{12,19}$/.test(s)) return false;
    let sum = 0, alt = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let n = s.charCodeAt(i) - 48;
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  static #expiryOk(m, y) {
    const mm = Number(m), yy = Number(y);
    if (!mm || !yy || mm < 1 || mm > 12) return false;
    const y4 = yy < 100 ? 2000 + yy : yy;
    const exp = new Date(Date.UTC(y4, mm, 0, 23, 59, 59)); // end-of-month
    return exp >= new Date();
  }

  static #brandFrom(num) {
    const s = String(num);
    if (/^4/.test(s)) return 'VISA';
    if (/^(5[1-5])/.test(s)) return 'MASTERCARD';
    if (/^3[47]/.test(s)) return 'AMEX';
    return 'CARD';
  }

  static #pickExport(mod) {
    if (Array.isArray(mod)) return mod;
    if (mod && Array.isArray(mod.default)) return mod.default;
    if (mod && Array.isArray(mod.accounts)) return mod.accounts;
    return null;
  }

  static #resolveAccountsPath(explicitPath) {
    if (explicitPath) return path.resolve(explicitPath);
    const envPath = process.env.MOCK_ACCOUNTS_PATH;
    if (envPath) return path.resolve(envPath);
    const candidates = ['accounts.ts', 'accounts.js', 'accounts.json']
      .map(f => path.resolve(__dirname, f));
    const found = candidates.find(fs.existsSync);
    if (!found) {
      throw new AppError('No accounts file found', 500, {
        code: 'ACCOUNTS_FILE_MISSING',
        details: { tried: candidates }
      });
    }
    return found;
  }

  static #loadAccountsFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!fs.existsSync(filePath)) {
      throw new AppError('Accounts file not found', 500, {
        code: 'ACCOUNTS_FILE_MISSING',
        details: { expected: filePath },
      });
    }
    try {
      if (ext === '.json') {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) throw new Error('accounts JSON must be an array');
        return data.map(this.#normalizeAccount);
      }
      if (ext === '.js' || ext === '.cjs') {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const mod = require(filePath);
        const data = this.#pickExport(mod);
        if (!Array.isArray(data)) throw new Error('module must export an array');
        return data.map(this.#normalizeAccount);
      }
      if (ext === '.ts') {
        const jsAlt = filePath.replace(/\.ts$/i, '.js');
        if (fs.existsSync(jsAlt)) {
          const mod = require(jsAlt);
          const data = this.#pickExport(mod);
          if (!Array.isArray(data)) throw new Error('compiled module must export an array');
          return data.map(this.#normalizeAccount);
        }
        try {
          require('ts-node/register/transpile-only');
        } catch {
          throw new AppError('TypeScript runtime not available for accounts.ts', 500, {
            code: 'TS_NODE_NOT_INSTALLED',
            details: { fix: 'npm i -D ts-node typescript or provide accounts.js/json' }
          });
        }
        const mod = require(filePath);
        const data = this.#pickExport(mod);
        if (!Array.isArray(data)) throw new Error('TS module must export an array');
        return data.map(this.#normalizeAccount);
      }
      throw new Error(`Unsupported accounts file extension: ${ext}`);
    } catch (e) {
      throw new AppError('Failed to read accounts file', 500, {
        code: 'ACCOUNTS_FILE_INVALID',
        details: { message: e.message }
      });
    }
  }

  static #loadByPan(explicitPath) {
    const fp = this.#resolveAccountsPath(explicitPath);
    const accounts = this.#loadAccountsFile(fp);
    return new Map(accounts.map(a => [a.number, a]));
  }

  // ---------- 1) VERIFY (stateless) ----------
  static verify({ number, name, ccv, exp_month, exp_year, accountsPath } = {}) {
    if (!number || !name || !ccv || !exp_month || !exp_year) {
      throw new AppError('Missing fields for card verification', 400, { code: 'MISSING_FIELDS' });
    }
    if (!/^\d{3,4}$/.test(String(ccv))) {
      throw new AppError('Invalid CCV', 402, { code: 'BAD_CCV' });
    }
    if (!this.#luhnOk(number)) {
      throw new AppError('Card verification failed', 402, { code: 'VERIFICATION_FAILED' });
    }
    if (!this.#expiryOk(exp_month, exp_year)) {
      throw new AppError('Card is expired', 402, { code: 'CARD_EXPIRED' });
    }

    const byPan = this.#loadByPan(accountsPath);
    const rec = byPan.get(String(number));
    if (!rec) throw new AppError('Card not recognized', 402, { code: 'ACCOUNT_NOT_FOUND' });
    if (
      String(rec.name) !== String(name).trim() ||
      String(rec.ccv) !== String(ccv) ||
      Number(rec.exp_month) !== Number(exp_month) ||
      Number(rec.exp_year) !== Number(exp_year)
    ) {
      throw new AppError('Card details mismatch', 409, { code: 'ACCOUNT_MISMATCH' });
    }

    const last4 = String(number).slice(-4);
    return {
      account: {
        id: `acct_${last4}_${exp_month}${exp_year}`,
        name: String(name).trim(),
        last4,
        exp_month: Number(exp_month),
        exp_year: Number(exp_year),
        currency: rec.currency || 'CAD',
        brand: this.#brandFrom(number),
      }
    };
  }

  // ---------- 2) PURCHASE (stateless, strict full card details) ----------
  static purchase({ number, name, ccv, exp_month, exp_year, amount_cents, currency = 'CAD', idempotency_key, accountsPath } = {}) {
    if (!amount_cents) {
      throw new AppError('Missing fields for purchase', 400, { code: 'MISSING_FIELDS' });
    }
    if (!number || !name || !ccv || !exp_month || !exp_year) {
      throw new AppError('Full card details required for purchase', 400, { code: 'MISSING_FIELDS' });
    }
    // Validate against file (and Luhn/expiry/ccv/name)
    this.verify({ number, name, ccv, exp_month, exp_year, accountsPath });

    const payment_id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const last4 = String(number).slice(-4);
    return { payment_id, status: 'approved', amount_cents: Number(amount_cents), currency, last4 };
  }

  // ---------- 3) REFUND (stateless success — backend enforces reality) ----------
  static refund({ payment_id, last4, amount_cents, idempotency_key } = {}) {
    if (!amount_cents) {
      throw new AppError('Missing fields for refund', 400, { code: 'MISSING_FIELDS' });
    }
    const refund_id = `rf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      refund_id,
      refunded: true,
      payment_id: payment_id || null,
      last4: last4 ? String(last4).slice(-4) : undefined,
      amount_cents: Number(amount_cents)
    };
  }
}

module.exports = { MockPaymentsProvider };
