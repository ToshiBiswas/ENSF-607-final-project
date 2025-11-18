// seeds/000_test_seed_vm.js
// Same data seeding as 000_test_seed.js but with a robust loader that can handle
// TypeScript/JS account lists (default export, named export, comments, trailing commas, etc.)
// Usage:
//   npx knex seed:run --specific=000_test_seed_vm.js
//
// It expects a file at ./data/accounts.ts (or set ACCOUNTS_PATH=/absolute/path/to/accounts.ts)

/** @param {import('knex').Knex} knex */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bcrypt = require('bcryptjs');
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
function last4(num) { return String(num).slice(-4); }
exports.seed = async function(knex) {
  // Wipe (FK-safe order)
  const hasTickets = await knex.schema.hasTable('tickets').catch(() => false);
  await knex('notifications').del().catch(()=>{});
  if (hasTickets) await knex('tickets').del().catch(()=>{});
  await knex('payments').del().catch(()=>{});
  await knex('ticketinfo').del().catch(()=>{});
  await knex('eventscategories').del().catch(()=>{});
  await knex('events').del().catch(()=>{});
  await knex('paymentinfo').del().catch(()=>{});
  await knex('categoriesid').del().catch(()=>{});
  await knex('users').del().catch(()=>{});

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
    const [id] = await knex('users').insert({ name: u.name, email: u.email, role: u.role, password_hash: passwordHash });
    userIds[u.email] = id;  
  }

  // Categories
  const catValues = ['Music','Comedy','Tech'];
  const catIds = {};
  for (const v of catValues) {
    const [id] = await knex('categoriesid').insert({ category_value: v });
    catIds[v] = id;
  }

  // Events
  const now = new Date();
  const hours = (h) => new Date(now.getTime() + h*3600*1000);
  const eventDefs = [
    {
      title: 'Tech Meetup YYC',
      description: 'Talks + demos on Node/Knex.',
      location: 'Innovation Hub',
      start_time: hours(6),
      end_time: hours(9),
      organizer_email: 'olivia@events.test',
      categories: ['Tech'],
      ticket_types: [{ type: 'Early Bird', price: 10.0, quantity: 30 }, { type: 'Regular', price: 20.0, quantity: 70 }]
    },
    {
      title: 'Stacked Music Fest',
      description: 'Outdoor stages.',
      location: 'Central Park',
      start_time: hours(12),
      end_time: hours(24),
      organizer_email: 'sam@events.test',
      categories: ['Music'],
      ticket_types: [{ type: 'GA', price: 49.99, quantity: 200 }, { type: 'VIP', price: 129.0, quantity: 50 }]
    }
  ];

  const eventIds = {};
  for (const e of eventDefs) {
    const [event_id] = await knex('events').insert({
      organizer_id: userIds[e.organizer_email],
      title: e.title, description: e.description, location: e.location,
      start_time: new Date(e.start_time), end_time: new Date(e.end_time),
    });
    eventIds[e.title] = event_id;
    for (const cv of e.categories) {
      await knex('eventscategories').insert({ event_id, category_id: catIds[cv] });
    }
    for (const t of e.ticket_types) {
      await knex('ticketinfo').insert({
        event_id, ticket_type: t.type, ticket_price: t.price,
        tickets_quantity: t.quantity, tickets_left: t.quantity
      });
    }
  }

  // Saved cards from approved accounts
  const approved = loadApprovedAccounts();
  console.log(`[seed] Loaded ${approved.length} approved accounts`);
  const avery = userIds['avery@user.test'];
  const riley = userIds['riley@user.test'];
  const first = approved[0] || null;
  const second = approved[1] || null;

  async function insertPaymentInfo(user_id, acct) {
    if (!acct) return null;
    const [id] = await knex('paymentinfo').insert({
      account_id: acct.id,
      name: acct.name,
      last4: last4(acct.number),
      exp_month: acct.exp_month,
      exp_year: acct.exp_year,
      currency: acct.currency || 'CAD',
    });
    await knex('user_cards').insert({
      user_id: user_id, 
      payment_info_id: id
    })
    return id;
  }
  
  await insertPaymentInfo(avery, first, true);
  await insertPaymentInfo(riley, second, true);

  console.log('✅ seed complete (vm parser). Logins use password "password123".');
};
