// seeds/0001_categories.js
/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  const hasEC  = await knex.schema.hasTable('eventscategories');
  const hasCat = await knex.schema.hasTable('categories');
  const hasCid = await knex.schema.hasTable('categoriesid');

  if (!hasCat && !hasCid) return; // migrations not run yet

  // Clear M2M first to avoid FK conflicts
  if (hasEC) await knex('eventscategories').del().catch(() => {});

  // Clear category tables we will seed
  if (hasCat) await knex('categories').del().catch(() => {});
  if (hasCid) await knex('categoriesid').del().catch(() => {});

  const values = [
    'Technology',
    'Music',
    'Food & Drink',
    'Wellness',
    'Sports',
    'Arts & Culture',
  ];

  if (hasCat) {
    await knex('categories').insert(values.map(category_value => ({ category_value })));
  }
  if (hasCid) {
    await knex('categoriesid').insert(values.map(category_value => ({ category_value })));
  }
};
