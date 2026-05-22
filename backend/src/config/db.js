const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
  timezone: '-03:00',
});

module.exports = pool;
