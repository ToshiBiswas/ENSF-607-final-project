/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  // Wipe in dependency order
  await knex('notifications').del().catch(() => {});
  await knex('payments').del().catch(() => {});
  await knex('tickets').del().catch(() => {});
  await knex('ticketinfo').del().catch(() => {});
  await knex('eventscategories').del().catch(() => {});
  await knex('events').del().catch(() => {});
  await knex('userpreferences').del().catch(() => {});
  await knex('users').del();

  const now = knex.fn.now();
  // Pre-hash for demo only (Password123!); replace in prod
  const HASH = '$2b$12$7R3fp1e.0q0p3yQyX9a6AunUO5T1rH2r8xwJqXoI3r9m0nq5JwPce';

  const [adminId] = await knex('users').insert({
    name: 'Admin',
    email: 'admin@example.com',
    password_hash: HASH,
    role: 'admin',
    created_at: now,
  });

  await knex('users').insert([
    { name: 'Ava Patel',    email: 'ava@example.com',    password_hash: HASH, role: 'user', created_at: now },
    { name: 'Liam Chen',    email: 'liam@example.com',   password_hash: HASH, role: 'user', created_at: now },
    { name: 'Sofia Garcia', email: 'sofia@example.com',  password_hash: HASH, role: 'user', created_at: now },
  ]);
};
