// seeds/0003_events_and_links.js
/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  const users = await knex('users').select('user_id','name');
  if (!users.length) return;

  const admin = users.find(u => u.name === 'Admin')?.user_id ?? users[0].user_id;

  // Events (keep ticket_type)
  const [hackathonId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Calgary AI Mini-Hack',
    description: 'A 6-hour hands-on hack focused on LLM tooling and data pipelines.',
    location: 'Platform Calgary, 407 9 Ave SE',
    start_time: knex.raw('NOW() + INTERVAL 5 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 5 DAY + INTERVAL 6 HOUR'),
    ticket_type: 'general',
  });

  const [parkFestId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Riverside Music & Food Fest',
    description: 'Local bands, craft vendors, and pop-up food stalls by the river.',
    location: "Prince's Island Park",
    start_time: knex.raw('NOW() + INTERVAL 12 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 12 DAY + INTERVAL 8 HOUR'),
    ticket_type: 'vip',
  });

  const [wellnessId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Sunrise Yoga & Smoothies',
    description: 'Group vinyasa followed by a nutrition chat and smoothies.',
    location: 'Central Memorial Park',
    start_time: knex.raw('NOW() + INTERVAL 3 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 3 DAY + INTERVAL 90 MINUTE'),
    ticket_type: 'general',
  });

  // Prefer categoriesid if present, since the FK points there
  const hasCid = await knex.schema.hasTable('categoriesid');
  const hasCat = await knex.schema.hasTable('categories');
  const CAT_TABLE = hasCid ? 'categoriesid' : (hasCat ? 'categories' : null);
  if (!CAT_TABLE) return;

  const catId = async (label) => {
    const row = await knex(CAT_TABLE).where({ category_value: label }).first();
    if (!row) throw new Error(`Category not found in ${CAT_TABLE}: ${label}`);
    return row.category_id;
  };

  await knex('eventscategories').insert([
    { event_id: hackathonId, category_id: await catId('Technology') },
    { event_id: parkFestId,  category_id: await catId('Music') },
    { event_id: parkFestId,  category_id: await catId('Food & Drink') },
    { event_id: wellnessId,  category_id: await catId('Wellness') },
  ]);
};
