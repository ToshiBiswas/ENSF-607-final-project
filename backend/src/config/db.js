/**
 * Database bootstrap for Knex.
 *
 * Supports:
 *  - DATABASE_URL (full DSN) OR discrete host/user/pass/name/port envs
 *  - MySQL2 driver
 *  - Small connection pool (adjust per deployment)
 *
 * Knex is exported as a singleton to share pool across modules.
 */
const knexLib = require('knex');

function createKnex() {
  if (process.env.DATABASE_URL) {
    return knexLib({
      client: 'mysql2',
      connection: process.env.DATABASE_URL,
      pool: { min: 0, max: 10 },
      migrations: { tableName: 'knex_migrations' }
    });
  }
  return knexLib({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'mindplanner',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    },
    pool: { min: 0, max: 10 },
    migrations: { tableName: 'knex_migrations' }
  });
}

const knex = createKnex();

module.exports = { knex };
