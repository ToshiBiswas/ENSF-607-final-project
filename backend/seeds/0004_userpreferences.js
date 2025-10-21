/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  const people = await knex('users').select('user_id','name');
  if (!people.length) return;

  const ava   = people.find(u => u.name === 'Ava Patel')?.user_id;
  const liam  = people.find(u => u.name === 'Liam Chen')?.user_id;
  const sofia = people.find(u => u.name === 'Sofia Garcia')?.user_id;

  await knex('userpreferences').del().catch(() => {});
  await knex('userpreferences').insert([
    ...(ava   ? [{ user_id: ava,   location: 'Downtown Calgary', category: 'Technology' }] : []),
    ...(liam  ? [{ user_id: liam,  location: 'Beltline',         category: 'Music' }]      : []),
    ...(sofia ? [{ user_id: sofia, location: 'Kensington',       category: 'Wellness' }]   : []),
  ]);
};
