/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('userpreferences').del().catch(()=>{});
  await knex('eventscategories').del().catch(()=>{});
  await knex('ticketinfo').del().catch(()=>{});
  await knex('events').del().catch(()=>{});
  await knex('categoriesid').del().catch(()=>{});
  await knex('users').del().catch(()=>{});

  // demo hash (Password!23) — replace with real hashes later
  const demoHash = '$2b$12$C6i8b7z2I7s9tP3bthk0eOqgMxCk7JtRr7m8E3O3wG3c7wL2B4sL6';

  await knex('users').insert([
    { name: 'Admin',       email: 'admin@example.com', password_hash: demoHash, role: 'admin' },
    { name: 'Ava Patel',   email: 'ava@example.com',   password_hash: demoHash, role: 'user' },
    { name: 'Liam Chen',   email: 'liam@example.com',  password_hash: demoHash, role: 'user' },
    { name: 'Sofia Garcia',email: 'sofia@example.com', password_hash: demoHash, role: 'user' }
  ]);
};
