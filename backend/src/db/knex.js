require('dotenv').config();
const knexLib = require('knex');
const knexfile = require('../../knexfile'); 

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env];
if (!config) {
  throw new Error(`No knex configuration for NODE_ENV=${env}`);
}

const knex = knexLib(config);
module.exports = knex;
