const { Pool } = require('pg');
require('dotenv').config();

const sslMode = (process.env.DB_SSL || '').toLowerCase();
const shouldUseSSL = sslMode === 'true' || (sslMode !== 'false' && (process.env.DB_HOST || '').includes('render.com'));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};