require('dotenv').config();

const base = {
  client: process.env.DB_CLIENT || 'mysql2',
  pool: { min: 0, max: 10 },
  migrations: { directory: './migrations', tableName: 'knex_migrations' },
  seeds: { directory: './seeds' }
};
const shared = {
  client: 'mysql2',
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
module.exports = {
  development: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'db',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'mindplanner',   
      user: process.env.DB_USER || 'mindplanner',
      password: process.env.DB_PASS || 'secret'
    }
  },
  production: {
    ...base,
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    }
  },
  test: {
    ...shared,
    connection: {
      host: process.env.DB_TEST_HOST || '127.0.0.1',
      port: Number(process.env.DB_TEST_PORT || 3307),
      user: process.env.DB_TEST_USER || 'test',
      password: process.env.DB_TEST_PASSWORD || 'test',
      database: process.env.DB_TEST_NAME || 'event_planner_test',
    },
  },
};
