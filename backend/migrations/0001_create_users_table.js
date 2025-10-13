/** @param {import('knex').Knex} knex */
exports.up = async (knex) => {
  // USERS
  await knex.schema.createTable('users', (t) => {
    t.increments('user_id').primary();            // INT UNSIGNED AI
    t.string('name', 120).notNullable();
    t.string('email', 255).notNullable().unique();
    t.text('password_hash').notNullable();
    t.enu('role', ['user', 'admin']).notNullable().defaultTo('user');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // EVENTS
  await knex.schema.createTable('events', (t) => {
    t.increments('event_id').primary();
    t.integer('organizer_id').unsigned().notNullable()
      .references('user_id').inTable('users')
      .onDelete('CASCADE').onUpdate('CASCADE');
    t.string('title', 200).notNullable();
    t.text('description');
    t.string('location', 160).notNullable();
    t.timestamp('start_time').notNullable();
    t.timestamp('end_time').notNullable();
    t.string('ticket_type', 60).notNullable(); // e.g., 'general', 'vip'
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['start_time'], 'idx_events_start_time');
    t.index(['organizer_id'], 'idx_events_organizer');
  });

  // TICKETS
  await knex.schema.createTable('tickets', (t) => {
    t.increments('ticket_id').primary();
    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    t.string('ticket_type', 60).notNullable();
    t.decimal('price', 10, 2).notNullable();
    t.timestamp('purchase_date').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id'], 'idx_tickets_user');
    t.index(['event_id'], 'idx_tickets_event');
  });

  // PAYMENTS
  await knex.schema.createTable('payments', (t) => {
    t.increments('payment_id').primary();
    t.integer('ticket_id').unsigned().notNullable()
      .references('ticket_id').inTable('tickets').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.string('status', 40).notNullable(); // 'paid', 'refunded', 'pending'
    t.timestamp('payment_date').notNullable().defaultTo(knex.fn.now());
    t.index(['status'], 'idx_payments_status');
  });

  // NOTIFICATIONS
  await knex.schema.createTable('notifications', (t) => {
    t.increments('notification_id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    t.integer('event_id').unsigned().nullable()
      .references('event_id').inTable('events').onDelete('SET NULL');
    t.text('message').notNullable();
    t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id'], 'idx_notifications_user');
  });

  // USER PREFERENCES (no free-text category)
  await knex.schema.createTable('userpreferences', (t) => {
    t.increments('preference_id').primary();
    t.integer('user_id').unsigned().notNullable()
      .references('user_id').inTable('users').onDelete('CASCADE');
    t.string('location', 160).nullable();
    t.unique(['user_id'], 'uq_userpreferences_user'); // one preference row per user
  });

  // CATEGORIES DICTIONARY
  await knex.schema.createTable('categoriesid', (t) => {
    t.increments('category_id').primary();
    t.string('category_value', 100).notNullable().unique();
  });

  // EVENTS ↔ CATEGORIES
  await knex.schema.createTable('eventscategories', (t) => {
    t.integer('event_id').unsigned().notNullable()
      .references('event_id').inTable('events').onDelete('CASCADE');
    t.integer('category_id').unsigned().notNullable()
      .references('category_id').inTable('categoriesid').onDelete('CASCADE');
    t.primary(['event_id', 'category_id']);
    t.index(['category_id'], 'idx_eventscategories_category');
  });

  // PREFERENCES ↔ CATEGORIES
  await knex.schema.createTable('preferencecategories', (t) => {
    t.integer('preference_id').unsigned().notNullable()
      .references('preference_id').inTable('userpreferences').onDelete('CASCADE');
    t.integer('category_id').unsigned().notNullable()
      .references('category_id').inTable('categoriesid').onDelete('CASCADE');
    t.primary(['preference_id', 'category_id']);
    t.index(['category_id'], 'idx_preferencecategories_category');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('preferencecategories');
  await knex.schema.dropTableIfExists('eventscategories');
  await knex.schema.dropTableIfExists('categoriesid');
  await knex.schema.dropTableIfExists('userpreferences');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
};
