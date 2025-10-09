import knexLib from 'knex';
import knexfile from '../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];
const db = knexLib(config);

export default db;