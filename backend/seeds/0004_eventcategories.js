/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('eventscategories').del();

  const catId = async (label) =>
    (await knex('categoriesid').where({ category_value: label }).first()).category_id;

  const metaRows = await knex('_seed_meta').select('key','value');
  const meta = Object.fromEntries(metaRows.map(r => [r.key, r.value]));
  const hackathonId = Number(meta['event.hackathonId']);
  const parkFestId  = Number(meta['event.parkFestId']);
  const wellnessId  = Number(meta['event.wellnessId']);

  await knex('eventscategories').insert([
    { event_id: hackathonId, category_id: await catId('Technology') },
    { event_id: parkFestId,  category_id: await catId('Music') },
    { event_id: parkFestId,  category_id: await catId('Food & Drink') },
    { event_id: wellnessId,  category_id: await catId('Wellness') }
  ]);
};
