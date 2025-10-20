/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  // clear dependent tables first
  await knex('eventscategories').del();
  await knex('categoriesid').del();

  await knex('categoriesid').insert([
    { category_value: 'Technology' },
    { category_value: 'Music' },
    { category_value: 'Wellness' },
    { category_value: 'Art' },
    { category_value: 'Sports' },
    { category_value: 'Food & Drink' }
  ]);
};
