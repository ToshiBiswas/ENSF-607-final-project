require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: process.env.DB_CLIENT || 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'db',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'mindplanner',
    user: process.env.DB_USER || 'mindplanner',
    password: process.env.DB_PASS || 'secret'
  },
  pool: { min: 0, max: 10 }
});

module.exports = db;
