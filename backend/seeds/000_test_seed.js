// seeds/000_test_seed_vm.js
// Same data seeding as 000_test_seed.js but with a robust loader that can handle
// TypeScript/JS account lists (default export, named export, comments, trailing commas, etc.)
// Usage:
//   npx knex seed:run --specific=000_test_seed_vm.js
//
// It expects a file at ./data/accounts.ts (or set ACCOUNTS_PATH=/absolute/path/to/accounts.ts)

// seeds/000_test_seed.js
/** @param {import('knex').Knex} knex */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function loadApprovedAccounts() {
  const p = process.env.ACCOUNTS_PATH || path.join(__dirname, 'data', 'accounts.ts');
  const raw = fs.readFileSync(p, 'utf8');

  // strip TS/ESM bits (best-effort), same idea as the VM seed
  let code = raw
    .replace(/^\s*import[^\n]*\n/gm, '')
    .replace(/^\s*(export\s+)?type\s+[^\n]*\n/gm, '')
    .replace(/\b(export\s+)?interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}\s*/gm, '');

  if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, 'module.exports = ');
  } else if (/export\s+const\s+accounts\s*=/.test(code)) {
    code += '\nmodule.exports = accounts;\n';
  }

  code = code.replace(/as\s+const/g, '').replace(/<[^>]+>(?=\s*\[)/g, '');

  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  new vm.Script(code, { filename: 'accounts.ts' }).runInContext(sandbox);
  const accounts = sandbox.module.exports || sandbox.exports;
  if (!Array.isArray(accounts)) throw new Error('accounts.ts did not export an array');
  return accounts;
}

const last4 = (n) => String(n).slice(-4);
const mkAccountId = (acct) =>
  acct.id ||
  ('acct_' + crypto.createHash('sha256').update(String(acct.number)).digest('hex').slice(0, 24));

exports.seed = async function seed(knex) {
  // --- Wipe (FK-safe order) ---
  const has = async (t) => knex.schema.hasTable(t).catch(() => false);

  if (await has('notifications')) await knex('notifications').del().catch(() => {});
  if (await has('tickets')) await knex('tickets').del().catch(() => {});
  if (await has('payments')) await knex('payments').del().catch(() => {});
  if (await has('ticketinfo')) await knex('ticketinfo').del().catch(() => {});
  if (await has('eventscategories')) await knex('eventscategories').del().catch(() => {});
  if (await has('events')) await knex('events').del().catch(() => {});
  if (await has('userpreferences')) await knex('userpreferences').del().catch(() => {});

  // NEW link table first, then card table
  if (await has('user_cards')) await knex('user_cards').del().catch(() => {});
  if (await has('paymentinfo')) await knex('paymentinfo').del().catch(() => {});

  if (await has('categoriesid')) await knex('categoriesid').del().catch(() => {});
  if (await has('users')) await knex('users').del().catch(() => {});

  // --- Users ---
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { name: 'Olivia Organizer', email: 'olivia@events.test', role: 'user' },
    { name: 'Sam Organizer',    email: 'sam@events.test',    role: 'user' },
    { name: 'Casey Organizer',  email: 'casey@events.test',  role: 'user' },
    { name: 'Avery Attendee',   email: 'avery@user.test',    role: 'user' },
    { name: 'Riley Attendee',   email: 'riley@user.test',    role: 'user' },
    { name: 'Jordan Attendee',  email: 'jordan@user.test',   role: 'user' },
  ];
  const userIds = {};
  for (const u of users) {
    const [id] = await knex('users').insert({
      name: u.name, email: u.email, role: u.role, password_hash: passwordHash
    });
    userIds[u.email] = id;
  }

  // --- Categories ---
  const catValues = ['Music', 'Comedy', 'Tech'];
  const catIds = {};
  for (const v of catValues) {
    const [id] = await knex('categoriesid').insert({ category_value: v });
    catIds[v] = id;
  }

  // --- Events + ticket types ---
  const now = new Date();
  const hours = (h) => new Date(now.getTime() + h * 3600 * 1000);
  const eventDefs = [
    {
      title: 'Tech Meetup YYC',
      description: 'Talks + demos on Node/Knex.',
      location: 'Innovation Hub',
      start_time: hours(6),
      end_time: hours(9),
      organizer_email: 'olivia@events.test',
      categories: ['Tech'],
      ticket_types: [
        { type: 'Early Bird', price: 10.0, quantity: 30 },
        { type: 'Regular',    price: 20.0, quantity: 70 }
      ]
    },
    {
      title: 'Stacked Music Fest',
      description: 'Outdoor stages.',
      location: 'Central Park',
      start_time: hours(12),
      end_time: hours(24),
      organizer_email: 'sam@events.test',
      categories: ['Music'],
      ticket_types: [
        { type: 'GA',  price: 49.99, quantity: 200 },
        { type: 'VIP', price: 129.0, quantity: 50 }
      ]
    }
  ];

  const eventIds = {};
  for (const e of eventDefs) {
    const [event_id] = await knex('events').insert({
      organizer_id: userIds[e.organizer_email],
      title: e.title,
      description: e.description,
      location: e.location,
      start_time: new Date(e.start_time),
      end_time: new Date(e.end_time),
      ticket_type: 'general'
    });
    eventIds[e.title] = event_id;

    for (const cv of e.categories) {
      await knex('eventscategories').insert({ event_id, category_id: catIds[cv] });
    }
    for (const t of e.ticket_types) {
      await knex('ticketinfo').insert({
        event_id,
        ticket_type: t.type,
        ticket_price: t.price,
        tickets_quantity: t.quantity,
        tickets_left: t.quantity
      });
    }
  }

  // --- Approved cards → paymentinfo (card only) + user_cards links ---
  const approved = loadApprovedAccounts();
  console.log(`[seed] Loaded ${approved.length} approved accounts`);

  // pick two for demo linking
  const avery = userIds['avery@user.test'];
  const riley = userIds['riley@user.test'];
  const first = approved[0];
  const second = approved[1];

  // Insert or reuse a paymentinfo row by unique account_id
  async function upsertCard(acct) {
    if (!acct) return null;
    const accountId = mkAccountId(acct);
    const existing = await knex('paymentinfo').where({ account_id: accountId }).first();
    if (existing) return existing.payment_info_id;
    const [pid] = await knex('paymentinfo').insert({
      account_id: accountId,
      name: acct.name,
      last4: last4(acct.number),
      exp_month: acct.exp_month,
      exp_year: acct.exp_year,
      currency: acct.currency || 'CAD'
    });
    return pid;
  }

  // Link a user to a card in user_cards (idempotent by unique(user_id, payment_info_id))
  async function linkUserCard(user_id, payment_info_id) {
    if (!user_id || !payment_info_id) return;
    try {
      await knex('user_cards').insert({ user_id, payment_info_id });
    } catch (e) {
      // ignore duplicate link
      if (!/duplicate/i.test(String(e.message))) throw e;
    }
  }

  const pid1 = await upsertCard(first);
  const pid2 = await upsertCard(second);
  await linkUserCard(avery, pid1);
  await linkUserCard(riley, pid2);

  console.log('✅ seed complete. Logins use password "password123".');
};
