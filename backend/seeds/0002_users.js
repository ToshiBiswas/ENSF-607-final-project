const bcrypt = require('bcrypt');

/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  // clear children first
  await knex('notifications').del();
  await knex('payments').del();
  await knex('tickets').del();
  await knex('userpreferences').del();
  await knex('events').del();
  await knex('users').del();

  const hash = (p) => bcrypt.hash(p, 12);

  await knex('users').insert([
    { name: 'Admin', email: 'admin@mindplanner.io', password_hash: await hash('Admin!234'), role: 'admin' },
    { name: 'Ava Patel', email: 'ava.patel@example.com', password_hash: await hash('User!234'), role: 'user' },
    { name: 'Liam Chen', email: 'liam.chen@example.com', password_hash: await hash('User!234'), role: 'user' },
    { name: 'Sofia Garcia', email: 'sofia.garcia@example.com', password_hash: await hash('User!234'), role: 'user' }
  ]);
};
