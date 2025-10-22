/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('userpreferences').del();

  const users = await knex('users').select('user_id','name');
  const find = (n) => users.find(u => u.name === n);

  const tech = await knex('categoriesid').where({ category_value: 'Technology' }).first();
  const music = await knex('categoriesid').where({ category_value: 'Music' }).first();
  const well  = await knex('categoriesid').where({ category_value: 'Wellness' }).first();

  await knex('userpreferences').insert([
    { user_id: find('Ava Patel').user_id,    location: 'Downtown Calgary', category_id: tech.category_id },
    { user_id: find('Liam Chen').user_id,    location: 'Beltline',         category_id: music.category_id },
    { user_id: find('Sofia Garcia').user_id, location: 'Kensington',       category_id: well.category_id }
  ]);
};
