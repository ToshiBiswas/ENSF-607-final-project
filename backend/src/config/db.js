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
const knexConfig = require('../../knexfile.js');

const ENV = process.env.NODE_ENV || 'development';

function createKnex() {
  // Optional: allow a full DSN override (e.g. Railway, Render, etc.)
  if (process.env.DATABASE_URL) {
    const baseConfig = knexConfig[ENV] || { client: 'mysql2' };

    return knexLib({
      ...baseConfig,
      client: 'mysql2',                 // ensure mysql2 client
      connection: process.env.DATABASE_URL,
    });
  }

  const config = knexConfig[ENV];
  if (!config) {
    throw new Error(`No Knex configuration found for NODE_ENV="${ENV}"`);
  }

  return knexLib(config);
}

const knex = createKnex();

module.exports = { knex };
