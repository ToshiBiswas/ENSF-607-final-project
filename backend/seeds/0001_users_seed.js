
/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  // Clean in FK-safe order
  await knex.raw('SET FOREIGN_KEY_CHECKS=0;');
  await knex('payments').truncate();
  await knex('notifications').truncate();
  await knex('tickets').truncate();
  await knex('events').truncate();
  await knex('user_preferences').truncate();
  await knex('users').truncate();
  await knex.raw('SET FOREIGN_KEY_CHECKS=1;');

  // ---- Users (explicit IDs for easy references) ----
  await knex('users').insert([
    { user_id: 1, name: 'Alice Johnson',  email: 'alice@example.com',  password_hash: '$2b$12$aaaa', role: 'user'  },
    { user_id: 2, name: 'Bob Organizer',  email: 'bob@events.com',     password_hash: '$2b$12$bbbb', role: 'admin' },
    { user_id: 3, name: 'Carol Smith',    email: 'carol@example.com',  password_hash: '$2b$12$cccc', role: 'user'  },
    { user_id: 4, name: 'Dave Organizer', email: 'dave@events.com',    password_hash: '$2b$12$dddd', role: 'admin' },
    { user_id: 5, name: 'Eve Adams',      email: 'eve@example.com',    password_hash: '$2b$12$eeee', role: 'user'  }
  ]);

  // ---- Events ----
  await knex('events').insert([
    {
      event_id: 101, organizer_id: 2,
      title: 'Calgary Tech Meetup', category: 'Technology',
      description: 'Monthly tech talks & networking',
      location: 'Platform Calgary',
      start_time: '2025-11-05 18:00:00', end_time: '2025-11-05 21:00:00',
      ticket_type: 'general'
    },
    {
      event_id: 102, organizer_id: 4,
      title: 'Indie Music Night', category: 'Music',
      description: 'Local bands and open mic',
      location: 'Kensington Hall',
      start_time: '2025-11-12 19:30:00', end_time: '2025-11-12 23:00:00',
      ticket_type: 'general'
    },
    {
      event_id: 103, organizer_id: 2,
      title: 'Data Science Workshop', category: 'Education',
      description: 'Hands-on intro to ML',
      location: 'UCalgary Lab 3',
      start_time: '2025-12-01 09:00:00', end_time: '2025-12-01 16:00:00',
      ticket_type: 'vip'
    }
  ]);

  // ---- Tickets ----
  await knex('tickets').insert([
    { ticket_id: 1001, event_id: 101, user_id: 1, ticket_type: 'general', price: 15.00, purchase_date: '2025-10-20 10:15:00' },
    { ticket_id: 1002, event_id: 101, user_id: 3, ticket_type: 'general', price: 15.00, purchase_date: '2025-10-20 11:05:00' },
    { ticket_id: 1003, event_id: 102, user_id: 5, ticket_type: 'general', price: 25.00, purchase_date: '2025-10-21 09:42:00' },
    { ticket_id: 1004, event_id: 103, user_id: 1, ticket_type: 'vip',     price: 120.00, purchase_date: '2025-10-22 14:30:00' }
  ]);

  // ---- Payments ----
  await knex('payments').insert([
    { payment_id: 5001, ticket_id: 1001, amount: 15.00,  status: 'paid',     payment_date: '2025-10-20 10:16:00' },
    { payment_id: 5002, ticket_id: 1002, amount: 15.00,  status: 'paid',     payment_date: '2025-10-20 11:06:00' },
    { payment_id: 5003, ticket_id: 1003, amount: 25.00,  status: 'refunded', payment_date: '2025-10-21 10:00:00' },
    { payment_id: 5004, ticket_id: 1004, amount: 120.00, status: 'pending',  payment_date: '2025-10-22 14:31:00' }
  ]);

  // ---- Notifications ----
  await knex('notifications').insert([
    { notification_id: 7001, user_id: 1, event_id: 101, message: 'See you at Calgary Tech Meetup!',   sent_at: '2025-10-25 08:00:00' },
    { notification_id: 7002, user_id: 5, event_id: 102, message: 'Indie Music Night starts soon 🎸',  sent_at: '2025-11-12 12:00:00' },
    { notification_id: 7003, user_id: 1, event_id: 103, message: 'Bring a laptop for the workshop.',  sent_at: '2025-11-28 09:00:00' }
  ]);

  // ---- User Preferences ----
  await knex('user_preferences').insert([
    { preference_id: 9001, user_id: 1, category: 'Technology', location: 'Calgary' },
    { preference_id: 9002, user_id: 3, category: 'Music',      location: 'Kensington' },
    { preference_id: 9003, user_id: 5, category: 'Education',  location: 'NW Calgary' }
  ]);
};
