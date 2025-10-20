/** @param {import('knex').Knex} knex */
exports.seed = async (knex) => {
  // helper to fetch a category_id by label
  const catId = async (label) =>
    (await knex('categoriesid').where({ category_value: label }).first()).category_id;

  // Users
  const users = await knex('users').select('user_id', 'name');
  const admin = users.find(u => u.name === 'Admin').user_id;
  const ava   = users.find(u => u.name === 'Ava Patel').user_id;
  const liam  = users.find(u => u.name === 'Liam Chen').user_id;
  const sofia = users.find(u => u.name === 'Sofia Garcia').user_id;

  // EVENTS (MySQL-safe date math)
  const [hackathonId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Calgary AI Mini-Hack',
    description: 'A 6-hour hands-on hack focused on LLM tooling and data pipelines.',
    location: 'Platform Calgary, 407 9 Ave SE',
    start_time: knex.raw('NOW() + INTERVAL 5 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 5 DAY + INTERVAL 6 HOUR'),
    ticket_type: 'general'
  });

  const [parkFestId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Riverside Music & Food Fest',
    description: 'Local bands, craft vendors, and pop-up food stalls by the river.',
    location: 'Prince’s Island Park',
    start_time: knex.raw('NOW() + INTERVAL 12 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 12 DAY + INTERVAL 8 HOUR'),
    ticket_type: 'vip'
  });

  const [wellnessId] = await knex('events').insert({
    organizer_id: admin,
    title: 'Sunrise Yoga & Smoothies',
    description: 'Group vinyasa session followed by a nutrition chat and smoothies.',
    location: 'Central Memorial Park',
    start_time: knex.raw('NOW() + INTERVAL 3 DAY'),
    end_time:   knex.raw('NOW() + INTERVAL 3 DAY + INTERVAL 90 MINUTE'),
    ticket_type: 'general'
  });

  // EVENT ↔ CATEGORIES (still many-to-many for events)
  await knex('eventscategories').insert([
    { event_id: hackathonId, category_id: await catId('Technology') },
    { event_id: parkFestId,  category_id: await catId('Music') },
    { event_id: parkFestId,  category_id: await catId('Food & Drink') },
    { event_id: wellnessId,  category_id: await catId('Wellness') }
  ]);

  // USER PREFERENCES (one category per user via category_id on userpreferences)
  await knex('userpreferences').insert([
    {
      user_id: ava,
      location: 'Downtown Calgary',
      category_id: await catId('Technology')
    },
    {
      user_id: liam,
      location: 'Beltline',
      category_id: await catId('Music')
    },
    {
      user_id: sofia,
      location: 'Kensington',
      category_id: await catId('Wellness')
    }
  ]);


  // PAYMENTS
  await knex('payments').insert([
    { ticket_id: t1, amount: 25.00, status: 'paid',    payment_date: knex.raw('NOW() + INTERVAL 1 DAY') },
    { ticket_id: t2, amount: 99.00, status: 'paid',    payment_date: knex.raw('NOW() + INTERVAL 2 DAY') },
    { ticket_id: t3, amount: 15.00, status: 'pending', payment_date: knex.raw('NOW() + INTERVAL 1 DAY') }
  ]);

  // NOTIFICATIONS
  await knex('notifications').insert([
    { user_id: ava,   event_id: hackathonId, message: 'You’re in! See you at Calgary AI Mini-Hack.',     sent_at: knex.raw('NOW() + INTERVAL 1 DAY') },
    { user_id: liam,  event_id: parkFestId,  message: 'VIP access confirmed for Riverside Music Fest.',  sent_at: knex.raw('NOW() + INTERVAL 2 DAY') },
    { user_id: sofia, event_id: wellnessId,  message: 'Your spot is reserved for Sunrise Yoga.',         sent_at: knex.raw('NOW() + INTERVAL 1 DAY') }
  ]);
};
