/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('categoriesid').del();
  await knex('categoriesid').insert([
    { category_value: 'Technology' },
    { category_value: 'Music' },
    { category_value: 'Food & Drink' },
    { category_value: 'Wellness' },
    { category_value: 'Sports' }
  ]);
};
