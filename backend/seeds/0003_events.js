/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  await knex('events').del();

  const admin = await knex('users').where({ name: 'Admin' }).first();

  const [hackathonId] = await knex('events').insert({
    organizer_id: admin.user_id,
    title: 'Calgary AI Mini-Hack',
    description: 'A 6-hour hands-on hack focused on LLM tooling and data pipelines.',
    location: 'Platform Calgary, 407 9 Ave SE',
    start_time: knex.raw('NOW() + INTERVAL 5 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 5 DAY + INTERVAL 6 HOUR'),
    ticket_type: 'general'
  });

  const [parkFestId] = await knex('events').insert({
    organizer_id: admin.user_id,
    title: 'Riverside Music & Food Fest',
    description: 'Local bands, craft vendors, and pop-up food stalls by the river.',
    location: 'Prince’s Island Park',
    start_time: knex.raw('NOW() + INTERVAL 12 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 12 DAY + INTERVAL 8 HOUR'),
    ticket_type: 'vip'
  });

  const [wellnessId] = await knex('events').insert({
    organizer_id: admin.user_id,
    title: 'Sunrise Yoga & Smoothies',
    description: 'Group vinyasa session followed by a nutrition chat and smoothies.',
    location: 'Central Memorial Park',
    start_time: knex.raw('NOW() + INTERVAL 3 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 3 DAY + INTERVAL 90 MINUTE'),
    ticket_type: 'general'
  });

  // minimize hard-coding: share these IDs with later seeds
  const hasMeta = await knex.schema.hasTable('_seed_meta');
  if (!hasMeta) {
    await knex.schema.createTable('_seed_meta', (t) => {
      t.string('key').primary();
      t.string('value');
    });
  } else {
    await knex('_seed_meta').del();
  }
  await knex('_seed_meta').insert([
    { key: 'event.hackathonId', value: String(hackathonId) },
    { key: 'event.parkFestId',  value: String(parkFestId)  },
    { key: 'event.wellnessId',  value: String(wellnessId)  }
  ]);
};
