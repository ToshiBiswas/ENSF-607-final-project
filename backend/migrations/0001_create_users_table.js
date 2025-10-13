/** @param {import('knex').Knex} knex */
/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  // ---- USERS ----
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (t) => {
      t.increments('user_id').primary();
      t.string('name', 100).notNullable();
      t.string('email', 255).notNullable().unique();
      t.text('password_hash').notNullable();
      t.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ---- EVENTS ----
  await knex.schema.createTable('events', (t) => {
    t.increments('event_id').primary();
    t
      .integer('organizer_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t.string('title', 200).notNullable();
    t.string('category', 100).notNullable();
    t.text('description').nullable();
    t.string('location', 200).notNullable();
    t.timestamp('start_time').notNullable();
    t.timestamp('end_time').notNullable();
    t.string('ticket_type', 100).notNullable(); // e.g., general, vip
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // ---- TICKETS ----
  await knex.schema.createTable('tickets', (t) => {
    t.increments('ticket_id').primary();
    t
      .integer('event_id')
      .unsigned()
      .notNullable()
      .references('event_id')
      .inTable('events')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t.string('ticket_type', 100).notNullable();
    t.decimal('price', 10, 2).notNullable();
    t.timestamp('purchase_date').notNullable().defaultTo(knex.fn.now());
    // optional uniqueness: one user can have multiple tickets if needed; omit composite unique
  });

  // ---- PAYMENTS ----
  await knex.schema.createTable('payments', (t) => {
    t.increments('payment_id').primary();
    t
      .integer('ticket_id')
      .unsigned()
      .notNullable()
      .references('ticket_id')
      .inTable('tickets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t.decimal('amount', 10, 2).notNullable();
    t.enum('status', ['pending', 'paid', 'failed', 'refunded']).notNullable().defaultTo('paid');
    t.timestamp('payment_date').notNullable().defaultTo(knex.fn.now());
  });

  // ---- NOTIFICATIONS ----
  await knex.schema.createTable('notifications', (t) => {
    t.increments('notification_id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t
      .integer('event_id')
      .unsigned()
      .nullable()
      .references('event_id')
      .inTable('events')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
      .index();
    t.text('message').notNullable();
    t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());
  });

  // ---- USER PREFERENCES ----
  await knex.schema.createTable('user_preferences', (t) => {
    t.increments('preference_id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .index();
    t.string('category', 100).nullable();
    t.string('location', 200).nullable();

    // avoid duplicates per user
    t.unique(['user_id', 'category', 'location'], 'uq_user_pref');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('user_preferences');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('events');
  // Only drop users if it was created by this migration
  // await knex.schema.dropTableIfExists('users');
};